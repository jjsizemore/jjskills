#!/usr/bin/env bash
# Fresh-context outer loop for multi-story work runs.
# Snapshot maxIterations at start — do not re-read agent-mutated budget each iter.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI="${WORK_RUN_CLI:-$SCRIPT_DIR/work-run.mjs}"
AGENT="${WORK_RUN_AGENT:-claude}"
MODEL_MID="${WORK_RUN_MODEL_MID:-}"
MODEL_LOW="${WORK_RUN_MODEL_LOW:-}"
MODEL_HIGH="${WORK_RUN_MODEL_HIGH:-}"
MAX_OVERRIDE=""
RUN_ID=""
DRY_RUN=0

usage() {
  cat <<'EOF'
Usage: work-run-loop.sh [--agent claude|codex|grok] [--run-id ID]
                        [--max-iterations N] [--model-mid M] [--model-low M] [--model-high M]
                        [--dry-run]

Requires a Git worktree. Shared run state lives under
<git-common-dir>/agent-runs, or an explicitly validated AGENT_RUNS_ROOT.
Each iteration spawns a fresh agent process with a cold-start prompt.
Stops only on verified closeout, no reachable authorized story, recorded suspension/cancellation, or sealed resource exhaustion.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT="$2"; shift 2 ;;
    --run-id) RUN_ID="$2"; shift 2 ;;
    --max-iterations) MAX_OVERRIDE="$2"; shift 2 ;;
    --model-mid) MODEL_MID="$2"; shift 2 ;;
    --model-low) MODEL_LOW="$2"; shift 2 ;;
    --model-high) MODEL_HIGH="$2"; shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ ! -f "$CLI" ]]; then
  echo "work-run CLI not found: $CLI" >&2
  exit 1
fi

if [[ -n "${AGENT_RUNS_ROOT:-}" ]]; then
  [[ "$AGENT_RUNS_ROOT" = /* ]] || { echo "AGENT_RUNS_ROOT must be absolute" >&2; exit 1; }
  RUN_ROOT="$AGENT_RUNS_ROOT"
else
  COMMON_DIR="$(git rev-parse --git-common-dir 2>/dev/null)" || {
    echo "Cannot resolve Git common dir; set absolute AGENT_RUNS_ROOT." >&2
    exit 1
  }
  RUN_ROOT="$(cd "$COMMON_DIR" && pwd)/agent-runs"
fi
export AGENT_RUNS_ROOT="$RUN_ROOT"

status_json() {
  if [[ -n "$RUN_ID" ]]; then
    node "$CLI" status --run-id "$RUN_ID"
  else
    node "$CLI" status
  fi
}

STATUS="$(status_json)" || {
  echo "No active run / status failed. Init a run first." >&2
  exit 1
}

# Snapshot sealed budget once (shell authority)
SEALED_MAX="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.maxIterations)' "$STATUS")"
RUN_ID="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.runId)' "$STATUS")"
if [[ -n "$MAX_OVERRIDE" ]]; then
  echo "Note: --max-iterations on the loop only caps this process; it does not unseal ledger budget." >&2
  if (( MAX_OVERRIDE < SEALED_MAX )); then
    SEALED_MAX="$MAX_OVERRIDE"
  fi
fi

ITER=0
LAST_PROGRESS_CHECKPOINT=$SECONDS
PROMPT_FILE="$(mktemp)"
CHILD_ACTIVE_FILE=""
CHECKPOINT_MONITOR_PID=""

cleanup() {
  [[ -z "$CHILD_ACTIVE_FILE" ]] || rm -f "$CHILD_ACTIVE_FILE"
  if [[ -n "$CHECKPOINT_MONITOR_PID" ]]; then
    kill -TERM "$CHECKPOINT_MONITOR_PID" 2>/dev/null || true
    wait "$CHECKPOINT_MONITOR_PID" 2>/dev/null || true
  fi
  rm -f "$PROMPT_FILE"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 131' QUIT

cat >"$PROMPT_FILE" <<EOF
You are a cold-start agent (empty prior chat). Load skills in order:
1) work-run-state  2) resuming-work  3) implementing-story

Repo has an active work run. Read:
- ${RUN_ROOT}/ACTIVE
- ${RUN_ROOT}/${RUN_ID}/handoff.md
- ${RUN_ROOT}/${RUN_ID}/ledger.json
- Codebase Patterns in ${RUN_ROOT}/${RUN_ID}/progress.md

Rules:
- Implement at most ONE incomplete story this process.
- Do not raise maxIterations (budget is sealed).
- Do not re-implement passes:true stories.
- Use low-tier models for explore/status when the harness allows; mid for implement; high only for required final/release review.
- On success mark-pass and update handoff/progress.
- On a failing boundary, diagnose/remediate within actual caps and assess causal
  progress internally every 30 minutes; no fixed-three human pause. Park only
  genuinely gated/exhausted stories and dependencies; independent work continues.
- If all stories pass, invoke complete --closeout-evidence PATH; only the
  persisted status completion marker is terminal. Never trust agent log text.
EOF

echo "work-run-loop: run=$RUN_ID sealed_max=$SEALED_MAX agent=$AGENT"
record_progress_checkpoint() {
  local checkpoint_status ledger_iteration ledger_max sealed_remaining causal_evidence note timestamp elapsed
  checkpoint_status="$(status_json 2>/dev/null || true)"
  if [[ -n "$checkpoint_status" ]]; then
    ledger_iteration="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(Number.isInteger(s.iteration) ? s.iteration : "unknown")' "$checkpoint_status")" || ledger_iteration=unknown
    ledger_max="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(Number.isInteger(s.maxIterations) ? s.maxIterations : "unknown")' "$checkpoint_status")" || ledger_max=unknown
    sealed_remaining="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(Number.isInteger(s.iteration) && Number.isInteger(s.maxIterations) ? Math.max(0, s.maxIterations - s.iteration) : "unknown")' "$checkpoint_status")" || sealed_remaining=unknown
    causal_evidence=unknown:no-stable-causal-receipt
  else
    ledger_iteration=unknown
    ledger_max=unknown
    sealed_remaining=unknown
    causal_evidence=unknown:no-stable-causal-receipt
  fi
  timestamp="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  elapsed=$((SECONDS - CHILD_STARTED_SECONDS))
  note="WORK_RUN_PROGRESS_CHECKPOINT run-id=$RUN_ID story-id=$STORY_ID agent=$AGENT child-id=${RUN_ID}/${STORY_ID}/iteration-${ITER} timestamp=$timestamp elapsed-seconds=$elapsed ledger-iteration=$ledger_iteration/$ledger_max remaining-sealed-iterations=$sealed_remaining remaining-process-iterations=$((SEALED_MAX - ITER)) causal-evidence=$causal_evidence resource-usage=unknown:no-provider-meter strategy=continue-current-child-within-sealed-allowance;reassess-on-exit;no-auto-pause-or-budget-change"
  if node "$CLI" append --run-id "$RUN_ID" --text "$note" >/dev/null; then
    printf '%s\n' "$note"
    LAST_PROGRESS_CHECKPOINT=$SECONDS
    return 0
  fi
  echo "WORK_RUN_PROGRESS_CHECKPOINT_RECORD_FAILED run-id=$RUN_ID; retrying while child remains active" >&2
  return 1
}


while (( ITER < SEALED_MAX )); do
  ITER=$((ITER + 1))
  echo "======== iteration $ITER / $SEALED_MAX ========"

  ST="$(status_json)" || exit 1
  COMPLETION="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.completion || "")' "$ST")"
  if [[ "$COMPLETION" == "WORK_RUN_COMPLETE run-id=$RUN_ID" ]]; then
    echo "$COMPLETION"
    exit 0
  fi
  ALL_PASS="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.allPass ? "1" : "0")' "$ST")"
  STATUS_NAME="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.status)' "$ST")"
  if [[ "$ALL_PASS" == "1" ]]; then
    echo "WORK_RUN_PAUSED run-id=$RUN_ID reason=closeout-evidence-required" >&2
    exit 1
  fi
  STORY_ID="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.next?.id || "")' "$ST")"
  if [[ "$STATUS_NAME" == "cancelled" || -z "$STORY_ID" ]]; then
    echo "Stopping: status=$STATUS_NAME reason=no-reachable-story" >&2
    exit 1
  fi

  # bump-iteration may fail if ledger already at max
  node "$CLI" bump-iteration --run-id "$RUN_ID" --story "$STORY_ID" || {
    echo "Budget exhausted at ledger counter" >&2
    exit 1
  }

  export WORK_RUN_STORY_ID="$STORY_ID"
  EVIDENCE_DIR="${RUN_ROOT}/${RUN_ID}/evidence"
  mkdir -p "$EVIDENCE_DIR"
  LOG="$EVIDENCE_DIR/iter-$(printf '%03d' "$ITER").log"

  if (( DRY_RUN )); then
    echo "[dry-run] would spawn $AGENT; prompt at $PROMPT_FILE" | tee "$LOG"
    continue
  fi

  CHILD_ACTIVE_FILE="${PROMPT_FILE}.child-active"
  : >"$CHILD_ACTIVE_FILE"
  CHILD_STARTED_SECONDS=$SECONDS
  LAST_PROGRESS_CHECKPOINT=$SECONDS
  MONITOR_PARENT_PID=$BASHPID
  (
    trap 'exit 0' TERM
    while [[ -e "$CHILD_ACTIVE_FILE" ]] && kill -0 "$MONITOR_PARENT_PID" 2>/dev/null; do
      sleep 1
      [[ -e "$CHILD_ACTIVE_FILE" ]] || break
      kill -0 "$MONITOR_PARENT_PID" 2>/dev/null || break
      if (( SECONDS - LAST_PROGRESS_CHECKPOINT >= 1800 )); then
        record_progress_checkpoint || true
      fi
    done
  ) &
  CHECKPOINT_MONITOR_PID=$!

  rc=0
  set +e
  case "$AGENT" in
    claude)
      MODEL_ARGS=()
      [[ -n "$MODEL_MID" ]] && MODEL_ARGS+=(--model "$MODEL_MID")
      claude --print --dangerously-skip-permissions "${MODEL_ARGS[@]}" <"$PROMPT_FILE" 2>&1 | tee "$LOG"
      rc=${PIPESTATUS[0]}
      ;;
    codex)
      # Codex CLI surface varies; pass prompt via stdin when supported
      codex exec <"$PROMPT_FILE" 2>&1 | tee "$LOG"
      rc=${PIPESTATUS[0]}
      ;;
    grok)
      MODEL_ARGS=()
      [[ -n "$MODEL_MID" ]] && MODEL_ARGS+=(--model "$MODEL_MID")
      grok "${MODEL_ARGS[@]}" <"$PROMPT_FILE" 2>&1 | tee "$LOG"
      rc=${PIPESTATUS[0]}
      ;;
    *)
      echo "Unsupported --agent $AGENT" >&2
      rc=2
      ;;
  esac
  set -e
  rm -f "$CHILD_ACTIVE_FILE"
  CHILD_ACTIVE_FILE=""
  kill -TERM "$CHECKPOINT_MONITOR_PID" 2>/dev/null || true
  wait "$CHECKPOINT_MONITOR_PID" 2>/dev/null || true
  CHECKPOINT_MONITOR_PID=""
  if (( rc == 130 || rc == 131 )); then
    exit "$rc"
  fi
  ST="$(status_json)" || exit 1
  COMPLETION="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.completion || "")' "$ST")"
  if [[ "$COMPLETION" == "WORK_RUN_COMPLETE run-id=$RUN_ID" ]]; then
    echo "$COMPLETION"
    exit 0
  fi
  ALL_PASS="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.allPass ? "1" : "0")' "$ST")"
  STATUS_NAME="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.status)' "$ST")"
  if [[ "$ALL_PASS" == "1" ]]; then
    echo "WORK_RUN_PAUSED run-id=$RUN_ID reason=closeout-evidence-required" >&2
    exit 1
  fi
  NEXT_STORY="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.next?.id || "")' "$ST")"
  if [[ -z "$NEXT_STORY" ]]; then
    echo "Stopping: status=$STATUS_NAME reason=no-reachable-story" >&2
    exit 1
  fi
  if [[ ${rc:-0} -ne 0 ]]; then
    echo "Agent exit $rc — continuing if budget remains (see $LOG)" >&2
  fi
done

echo "Stopped: reached sealed maxIterations=$SEALED_MAX without WORK_RUN_COMPLETE" >&2
exit 1
