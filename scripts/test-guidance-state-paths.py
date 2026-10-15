#!/usr/bin/env python3
"""Reject live guidance that names retired work-run state paths."""

from __future__ import annotations

import argparse
import fnmatch
import json
import os
import re
import subprocess
import sys
from pathlib import Path

LEGACY_PATH = re.compile(r"\.agents/runs|syncvia-runs")
CLASSIFICATIONS = {"active", "history", "backup", "provenance", "config-protection"}
ACTIVE_CONSUMERS = {
    "dotfiles": (".agents/AGENTS.md",),
    "jjskills": (
        "work-run-state/SKILL.md",
        "work-run-state/scripts/work-run.mjs",
        "work-run-state/scripts/work-run-loop.sh",
        "executing-work/SKILL.md",
        "resuming-work/SKILL.md",
        "implementing-story/SKILL.md",
        "remediating-root-causes/SKILL.md",
        "canceling-work-run/SKILL.md",
    ),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allowlist", required=True, type=Path)
    parser.add_argument("--dotfiles-root", type=Path, default=os.environ.get("DOTFILES_ROOT"))
    parser.add_argument("--jj-skills-root", type=Path, default=os.environ.get("JJ_SKILLS_ROOT"))
    return parser.parse_args()


def load_allowlist(path: Path) -> list[dict[str, str]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"invalid allowlist {path}: {error}") from error
    if not isinstance(payload, dict) or payload.get("version") != 1:
        raise ValueError("allowlist must be an object with version=1")
    entries = payload.get("entries")
    if not isinstance(entries, list) or not entries:
        raise ValueError("allowlist must contain entries")
    seen: set[str] = set()
    for entry in entries:
        if not isinstance(entry, dict) or set(entry) != {"path", "classification", "reason", "owner"}:
            raise ValueError("each allowlist entry must contain path, classification, reason, and owner")
        if not all(isinstance(entry[key], str) and entry[key] for key in entry):
            raise ValueError("allowlist fields must be non-empty strings")
        if entry["classification"] not in CLASSIFICATIONS:
            raise ValueError(f"invalid allowlist classification: {entry['classification']}")
        if entry["path"] in seen:
            raise ValueError(f"duplicate allowlist path: {entry['path']}")
        seen.add(entry["path"])
    return entries


def entry_matches(entry_path: str, candidate: str) -> bool:
    return fnmatch.fnmatchcase(candidate, entry_path) or (
        entry_path.endswith("/**") and candidate.startswith(entry_path[:-2])
    )


def legacy_files(root_name: str, root: Path) -> list[tuple[str, Path]]:
    matches: list[tuple[str, Path]] = []
    # Inspect published sources only; private checkout evidence is not guidance.
    paths = subprocess.check_output(
        ["git", "-C", str(root), "ls-files", "-z"], text=True
    ).split("\0")
    for relative in sorted(set(paths) - {""}):
        path = root / relative
        if path.resolve() == Path(__file__).resolve():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        if LEGACY_PATH.search(text):
            matches.append((f"{root_name}/{relative}", path))
    return matches


def main() -> int:
    args = parse_args()
    if args.dotfiles_root is None or args.jj_skills_root is None:
        print("DOTFILES_ROOT and JJ_SKILLS_ROOT must be set or passed explicitly", file=sys.stderr)
        return 2
    roots = {
        "dotfiles": args.dotfiles_root.resolve(),
        "jjskills": args.jj_skills_root.resolve(),
    }
    if any(not root.is_dir() for root in roots.values()):
        print("DOTFILES_ROOT and JJ_SKILLS_ROOT must name directories", file=sys.stderr)
        return 2
    try:
        allowlist = load_allowlist(args.allowlist.resolve())
    except ValueError as error:
        print(error, file=sys.stderr)
        return 2

    failures: list[str] = []
    allowed = {entry["path"]: False for entry in allowlist}
    for root_name, root in roots.items():
        active_paths = set(ACTIVE_CONSUMERS[root_name])
        for relative in active_paths:
            path = root / relative
            if not path.is_file():
                failures.append(f"missing active consumer: {root_name}/{relative}")
                continue
            if LEGACY_PATH.search(path.read_text(encoding="utf-8")):
                failures.append(f"retired path in active consumer: {root_name}/{relative}")
        for relative, _ in legacy_files(root_name, root):
            if relative in {f"{root_name}/{path}" for path in active_paths}:
                continue
            matching = [entry for entry in allowlist if entry_matches(entry["path"], relative)]
            if not matching:
                failures.append(f"unallowlisted retired path: {relative}")
                continue
            for entry in matching:
                allowed[entry["path"]] = True
    for path, matched in allowed.items():
        if not matched:
            failures.append(f"allowlist entry matches no retired path: {path}")
    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1
    print("agent-guidance-state-paths: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
