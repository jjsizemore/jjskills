#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /absolute/path/to/syncvia" >&2
  exit 1
fi
REPO_ROOT="$1"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REF_DIR="$SKILL_DIR/references/source"
required=(
  "$REPO_ROOT/.github/prompts/creating-test-suites.prompt.md"
  "$REPO_ROOT/AGENTS.md"
)
for file in "${required[@]}"; do
  [[ -f "$file" ]] || { echo "Missing required source: $file" >&2; exit 1; }
done
mkdir -p "$REF_DIR"
cp "$REPO_ROOT/.github/prompts/creating-test-suites.prompt.md" "$REF_DIR/creating-test-suites.prompt.md"
cp "$REPO_ROOT/AGENTS.md" "$REF_DIR/AGENTS.md"
for area in backend desktop frontend; do
  [[ -f "$REPO_ROOT/$area/AGENTS.md" ]] && cp "$REPO_ROOT/$area/AGENTS.md" "$REF_DIR/$area.AGENTS.md"
done
[[ -f "$REPO_ROOT/.github/instructions/path-specific.instructions.md" ]] && cp "$REPO_ROOT/.github/instructions/path-specific.instructions.md" "$REF_DIR/path-specific.instructions.md"
echo "Synced creating-test-suites references into $REF_DIR"
