#!/usr/bin/env python3
"""Collect repo signals for Codex local environment setup recommendations."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT_MARKERS = [
    "pnpm-lock.yaml",
    "package-lock.json",
    "yarn.lock",
    "bun.lockb",
    "uv.lock",
    "poetry.lock",
    "Cargo.toml",
    "go.mod",
]

SCRIPT_FILES = ["package.json", "backend/package.json", "frontend/package.json", "desktop/package.json"]
INTERESTING_FILES = [
    ".codex/environments/environment.toml",
    ".codex/config.toml",
    "AGENTS.md",
    "mise.toml",
    ".mise.toml",
    "docker-compose.yml",
    "docker-compose.dev.yml",
    "compose.yml",
    "turbo.json",
]


def find_root(start: Path) -> Path:
    current = start.resolve()
    for path in [current, *current.parents]:
        if any((path / marker).exists() for marker in ROOT_MARKERS) or (path / ".git").exists():
            return path
    return current


def package_manager(root: Path) -> str:
    if (root / "pnpm-lock.yaml").exists():
        return "pnpm"
    if (root / "package-lock.json").exists():
        return "npm"
    if (root / "yarn.lock").exists():
        return "yarn"
    if (root / "bun.lockb").exists():
        return "bun"
    if (root / "uv.lock").exists():
        return "uv"
    if (root / "poetry.lock").exists():
        return "poetry"
    if (root / "Cargo.toml").exists():
        return "cargo"
    if (root / "go.mod").exists():
        return "go"
    return "unknown"


def package_scripts(path: Path) -> dict[str, str]:
    try:
        data = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return {}
    scripts = data.get("scripts")
    if not isinstance(scripts, dict):
        return {}
    return {str(k): str(v) for k, v in scripts.items() if not str(k).startswith("//")}


def main() -> int:
    start = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    root = find_root(start)
    print(f"root: {root}")
    print(f"package_manager: {package_manager(root)}")

    print("\nfiles:")
    for rel in INTERESTING_FILES:
        if (root / rel).exists():
            print(f"  present: {rel}")

    print("\nenv_templates:")
    for path in sorted(root.glob("**/template.env")) + sorted(root.glob("**/.env.example")) + sorted(root.glob("**/.env.defaults")):
        if ".git" not in path.parts and "node_modules" not in path.parts:
            print(f"  {path.relative_to(root)}")

    print("\nscripts:")
    wanted = {"setup", "install", "dev", "build", "typecheck", "lint", "test", "test:e2e", "validate", "down", "db:up"}
    for rel in SCRIPT_FILES:
        path = root / rel
        if not path.exists():
            continue
        scripts = package_scripts(path)
        shown = {k: scripts[k] for k in sorted(scripts) if k in wanted or k.startswith(("dev:", "test:", "typecheck:", "lint:"))}
        if shown:
            print(f"  {rel}:")
            for name, command in shown.items():
                print(f"    {name}: {command}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
