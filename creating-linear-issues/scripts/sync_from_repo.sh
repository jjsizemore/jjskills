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
  "$REPO_ROOT/.github/prompts/creating-managing-linear-issues.prompt.md"
  "$REPO_ROOT/AGENTS.md"
)
for file in "${required[@]}"; do
  [[ -f "$file" ]] || { echo "Missing required source: $file" >&2; exit 1; }
done
mkdir -p "$REF_DIR"
cp "$REPO_ROOT/.github/prompts/creating-managing-linear-issues.prompt.md" "$REF_DIR/creating-managing-linear-issues.prompt.md"
cp "$REPO_ROOT/AGENTS.md" "$REF_DIR/AGENTS.md"
[[ -f "$REPO_ROOT/.agents/skills/managing-managing-linear-projects-mcp/SKILL.md" ]] && cp "$REPO_ROOT/.agents/skills/managing-managing-linear-projects-mcp/SKILL.md" "$REF_DIR/managing-managing-linear-projects-mcp.SKILL.md"
echo "Synced creating-managing-linear-issues references into $REF_DIR"
