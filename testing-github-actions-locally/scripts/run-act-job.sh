#!/usr/bin/env bash
set -euo pipefail

WORKFLOW=""
JOB=""
EVENT="pull_request"
PLATFORM=""
ARCH="linux/amd64"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --workflow)
      WORKFLOW="$2"
      shift 2
      ;;
    --job)
      JOB="$2"
      shift 2
      ;;
    --event)
      EVENT="$2"
      shift 2
      ;;
    --platform)
      PLATFORM="$2"
      shift 2
      ;;
    --arch)
      ARCH="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [[ -z "$WORKFLOW" || -z "$JOB" ]]; then
  echo "Usage: $0 --workflow <path> --job <job-id> [--event pull_request|push|workflow_dispatch] [--platform label=image] [--arch linux/amd64]" >&2
  exit 2
fi

cmd=(act "$EVENT" -W "$WORKFLOW" -j "$JOB" --container-architecture "$ARCH")

if [[ -n "$PLATFORM" ]]; then
  cmd+=(-P "$PLATFORM")
fi

echo "Running: ${cmd[*]}"
"${cmd[@]}"
