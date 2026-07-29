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

Requires cwd = git worktree with .agents/runs/ state.
Each iteration spawns a fresh agent process with a cold-start prompt.
Stops on WORK_RUN_COMPLETE, blocked status, budget exhaustion, or spawn failure.
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
PROMPT_FILE="$(mktemp)"
trap 'rm -f "$PROMPT_FILE"' EXIT

cat >"$PROMPT_FILE" <<EOF
You are a cold-start agent (empty prior chat). Load skills in order:
1) work-run-state  2) resuming-work  3) implementing-story

Repo has an active work run. Read:
- .agents/runs/ACTIVE
- .agents/runs/${RUN_ID}/handoff.md
- .agents/runs/${RUN_ID}/ledger.json
- Codebase Patterns in progress.md

Rules:
- Implement at most ONE incomplete story this process.
- Do not raise maxIterations (budget is sealed).
- Do not re-implement passes:true stories.
- Use low-tier models for explore/status when the harness allows; mid for implement; high only for required final/release review.
- On success mark-pass and update handoff/progress.
- On hard failure after one remediation cycle mark-blocked.
- If all stories pass, run work-run complete and print: WORK_RUN_COMPLETE run-id=${RUN_ID}
EOF

echo "work-run-loop: run=$RUN_ID sealed_max=$SEALED_MAX agent=$AGENT"

while (( ITER < SEALED_MAX )); do
  ITER=$((ITER + 1))
  echo "======== iteration $ITER / $SEALED_MAX ========"

  ST="$(status_json)" || exit 1
  ALL_PASS="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.allPass ? "1" : "0")' "$ST")"
  STATUS_NAME="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.status)' "$ST")"
  if [[ "$ALL_PASS" == "1" ]]; then
    echo "WORK_RUN_COMPLETE run-id=$RUN_ID"
    exit 0
  fi
  if [[ "$STATUS_NAME" == "blocked" || "$STATUS_NAME" == "cancelled" ]]; then
    echo "Stopping: status=$STATUS_NAME" >&2
    exit 1
  fi

  # bump-iteration may fail if ledger already at max
  node "$CLI" bump-iteration --run-id "$RUN_ID" || {
    echo "Budget exhausted at ledger counter" >&2
    exit 1
  }

  EVIDENCE_DIR=".agents/runs/${RUN_ID}/evidence"
  mkdir -p "$EVIDENCE_DIR"
  LOG="$EVIDENCE_DIR/iter-$(printf '%03d' "$ITER").log"

  if (( DRY_RUN )); then
    echo "[dry-run] would spawn $AGENT; prompt at $PROMPT_FILE" | tee "$LOG"
    continue
  fi

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
      exit 2
      ;;
  esac
  set -e

  if grep -q "WORK_RUN_COMPLETE run-id=${RUN_ID}" "$LOG" 2>/dev/null; then
    echo "WORK_RUN_COMPLETE run-id=$RUN_ID"
    exit 0
  fi

  ST="$(status_json)" || exit 1
  ALL_PASS="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.allPass ? "1" : "0")' "$ST")"
  STATUS_NAME="$(node -e 'const s=JSON.parse(process.argv[1]); console.log(s.status)' "$ST")"
  if [[ "$ALL_PASS" == "1" ]]; then
    echo "WORK_RUN_COMPLETE run-id=$RUN_ID"
    exit 0
  fi
  if [[ "$STATUS_NAME" == "blocked" ]]; then
    echo "Stopping: blocked" >&2
    exit 1
  fi
  if [[ ${rc:-0} -ne 0 ]]; then
    echo "Agent exit $rc — continuing if budget remains (see $LOG)" >&2
  fi
done

echo "Stopped: reached sealed maxIterations=$SEALED_MAX without WORK_RUN_COMPLETE" >&2
exit 1
