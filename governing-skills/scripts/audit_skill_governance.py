#!/usr/bin/env python3
"""Audit Agent Skills spec metadata, canonical placement, and symlinks."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path


NAME_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$")
DEFAULT_AGENT_DIRS = (".claude/skills",)
REPO_MARKERS = (
    "syncvia",
    "sv-",
    "pnpm current-work",
)


@dataclass
class Finding:
    severity: str
    code: str
    path: str
    message: str
    suggestion: str = ""


@dataclass
class SkillRecord:
    name: str
    level: str
    path: str
    skill_md: str
    is_symlink: bool


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Audit Agent Skills for spec compliance, .agents centralization, and agent-specific symlinks.",
    )
    parser.add_argument("--home", default=str(Path.home()), help="Home directory to audit. Default: current user home.")
    parser.add_argument("--repo", help="Repository root to audit for repo-level .agents/skills.")
    parser.add_argument("--skill", action="append", default=[], help="Limit checks to a skill name. Repeatable.")
    parser.add_argument(
        "--agent-dir",
        action="append",
        default=[],
        help="Agent-specific skill directory relative to home/repo or absolute. Default: .claude/skills.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of a text report.")
    parser.add_argument("--strict", action="store_true", help="Exit non-zero when warnings are present.")
    parser.add_argument(
        "--fix-missing-symlinks",
        action="store_true",
        help="Create missing symlinks for canonical .agents skills. Never overwrites existing paths.",
    )
    return parser.parse_args()


def normalize_filter(names: list[str]) -> set[str]:
    return {name.strip() for name in names if name.strip()}


def read_text(path: Path, limit: int = 200_000) -> str:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return handle.read(limit)
    except UnicodeDecodeError:
        with path.open("r", encoding="utf-8", errors="replace") as handle:
            return handle.read(limit)


def clean_yaml_scalar(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def parse_frontmatter(skill_md: Path) -> tuple[dict[str, str], str | None]:
    text = read_text(skill_md)
    if not text.startswith("---"):
        return {}, "SKILL.md must start with YAML frontmatter delimiter"

    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, "SKILL.md must start with a standalone --- delimiter"

    end_index = None
    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            end_index = index
            break
    if end_index is None:
        return {}, "SKILL.md frontmatter is missing the closing --- delimiter"

    metadata: dict[str, str] = {}
    frontmatter = lines[1:end_index]
    index = 0
    while index < len(frontmatter):
        line = frontmatter[index]
        match = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if not match:
            index += 1
            continue

        key, raw_value = match.groups()
        value = raw_value.strip()
        if value == "":
            index += 1
            nested_found = False
            while index < len(frontmatter) and (
                frontmatter[index].startswith(" ") or frontmatter[index].startswith("\t")
            ):
                nested_match = re.match(r"^\s+([A-Za-z0-9_.-]+):\s*(.*)$", frontmatter[index])
                if nested_match:
                    nested_key, nested_raw_value = nested_match.groups()
                    nested_value = nested_raw_value.strip()
                    if nested_value and nested_value[0] not in {"'", '"'} and re.search(r":\s", nested_value):
                        return {}, (
                            f"Frontmatter field `{key}.{nested_key}` contains an unquoted ': ' sequence; "
                            "quote the value so YAML parsers can load it."
                        )
                    metadata[f"{key}.{nested_key}"] = clean_yaml_scalar(nested_value)
                    nested_found = True
                index += 1
            if nested_found:
                continue
            metadata[key] = ""
            continue

        if value in {"|", ">"}:
            collected: list[str] = []
            index += 1
            while index < len(frontmatter) and (
                frontmatter[index].startswith(" ") or frontmatter[index].startswith("\t")
            ):
                collected.append(frontmatter[index].strip())
                index += 1
            metadata[key] = "\n".join(collected).strip()
            continue

        if value and value[0] not in {"'", '"'} and re.search(r":\s", value):
            return {}, (
                f"Frontmatter field `{key}` contains an unquoted ': ' sequence; "
                "quote the value so YAML parsers can load it."
            )

        metadata[key] = clean_yaml_scalar(value)
        index += 1

    return metadata, None


def governance_placement(metadata: dict[str, str]) -> str:
    return (
        metadata.get("metadata.governing-skills-placement")
        or metadata.get("governing-skills-placement")
        or ""
    ).strip().lower()


def governance_reason(metadata: dict[str, str]) -> str:
    return (
        metadata.get("metadata.governing-skills-reason")
        or metadata.get("governing-skills-reason")
        or ""
    ).strip()


def skill_entries(root: Path, only: set[str]) -> list[Path]:
    if not root.exists() or not root.is_dir():
        return []

    entries: list[Path] = []
    for child in sorted(root.iterdir(), key=lambda item: item.name):
        if child.name.startswith("."):
            continue
        if only and child.name not in only:
            continue
        if child.is_dir() or child.is_symlink():
            skill_md = child / "SKILL.md"
            if skill_md.exists():
                entries.append(child)
    return entries


def validate_skill(entry: Path, level: str, findings: list[Finding]) -> SkillRecord | None:
    skill_md = entry / "SKILL.md"
    metadata, error = parse_frontmatter(skill_md)
    if error:
        findings.append(Finding("error", "invalid-frontmatter", str(skill_md), error))
        return None

    name = metadata.get("name", "").strip()
    description = metadata.get("description", "").strip()
    if not name:
        findings.append(Finding("error", "missing-name", str(skill_md), "Required frontmatter field `name` is missing."))
        name = entry.name
    elif not NAME_RE.match(name) or "--" in name:
        findings.append(
            Finding(
                "error",
                "invalid-name",
                str(skill_md),
                f"Skill name `{name}` does not match Agent Skills naming rules.",
                "Use lowercase letters, numbers, and single hyphens only, 1-64 characters.",
            ),
        )

    if name != entry.name:
        findings.append(
            Finding(
                "error",
                "name-directory-mismatch",
                str(skill_md),
                f"Frontmatter name `{name}` does not match directory/link name `{entry.name}`.",
                "Rename the directory or update `name` so they match exactly.",
            ),
        )

    if not description:
        findings.append(Finding("error", "missing-description", str(skill_md), "`description` is required."))
    elif len(description) > 1024:
        findings.append(
            Finding(
                "error",
                "description-too-long",
                str(skill_md),
                f"`description` is {len(description)} characters; max is 1024.",
                "Move details into SKILL.md body or references/ and keep the description as trigger guidance.",
            ),
        )

    if entry.is_symlink() and level in {"user-canonical", "repo-canonical"}:
        findings.append(
            Finding(
                "warning",
                "canonical-source-is-symlink",
                str(entry),
                "Canonical .agents/skills entries should usually be real directories.",
                "Keep symlinks in agent-specific compatibility directories instead.",
            ),
        )

    return SkillRecord(
        name=name or entry.name,
        level=level,
        path=str(entry),
        skill_md=str(skill_md),
        is_symlink=entry.is_symlink(),
    )


def looks_repo_specific(entry: Path, repo: Path | None) -> bool:
    text = read_text(entry / "SKILL.md", limit=80_000).lower()
    if entry.name.endswith("-syncvia"):
        return True
    if repo and str(repo).lower() in text:
        return True
    return any(marker in text for marker in REPO_MARKERS)


def audit_canonical_root(root: Path, level: str, only: set[str], repo: Path | None, findings: list[Finding]) -> list[SkillRecord]:
    records: list[SkillRecord] = []
    for entry in skill_entries(root, only):
        record = validate_skill(entry, level, findings)
        if not record:
            continue
        records.append(record)

        metadata, _ = parse_frontmatter(entry / "SKILL.md")
        placement = governance_placement(metadata)
        reason = governance_reason(metadata)
        repo_specific = looks_repo_specific(entry, repo)
        if level == "user-canonical" and repo_specific:
            if placement in {"user", "home", "global"}:
                findings.append(
                    Finding(
                        "info",
                        "intentional-user-placement",
                        str(entry),
                        "Skill contains repo-specific markers but declares intentional user-level placement.",
                        reason or "Keep user-level only when the skill is a portable alias or cross-checkout workflow.",
                    ),
                )
                continue
            findings.append(
                Finding(
                    "warning",
                    "repo-specific-skill-in-user-tree",
                    str(entry),
                    "This skill appears repo-specific but is stored in the user-level .agents tree.",
                    "Review whether it belongs under <repo>/.agents/skills and should be symlinked from agent-specific dirs.",
                ),
            )
        if level == "repo-canonical" and not repo_specific:
            if placement in {"repo", "project"}:
                continue
            findings.append(
                Finding(
                    "info",
                    "possibly-portable-skill-in-repo-tree",
                    str(entry),
                    "This repo-level skill does not contain obvious repo-specific markers.",
                    "If it is intended to work across repositories, consider moving it to ~/.agents/skills.",
                ),
            )
    return records


def resolve_agent_dirs(base: Path, specs: list[str]) -> list[Path]:
    dirs: list[Path] = []
    for spec in specs or list(DEFAULT_AGENT_DIRS):
        path = Path(spec).expanduser()
        dirs.append(path if path.is_absolute() else base / path)
    return dirs


def relative_target(source: Path, link_parent: Path) -> str:
    return os.path.relpath(source, start=link_parent)


def path_is_within(child: Path, parent: Path) -> bool:
    child_text = str(child.resolve(strict=False))
    parent_text = str(parent.resolve(strict=False))
    return child_text == parent_text or child_text.startswith(f"{parent_text}{os.sep}")


def ensure_symlink(source: Path, link: Path, findings: list[Finding], fix: bool) -> None:
    if link.exists() or link.is_symlink():
        return

    findings.append(
        Finding(
            "warning",
            "missing-agent-symlink",
            str(link),
            f"Missing agent-specific symlink for canonical skill `{source.name}`.",
            f"Create symlink to {source}.",
        ),
    )
    if not fix:
        return

    link.parent.mkdir(parents=True, exist_ok=True)
    link.symlink_to(relative_target(source, link.parent))
    findings.append(Finding("info", "created-agent-symlink", str(link), f"Created symlink to {source}."))


def audit_agent_root(root: Path, only: set[str], canonical_root: Path, findings: list[Finding]) -> None:
    if not root.exists() or not root.is_dir():
        return

    if root.is_symlink():
        target = root.resolve(strict=False)
        if not target.exists():
            findings.append(
                Finding(
                    "error",
                    "broken-agent-root-symlink",
                    str(root),
                    f"Agent-specific skill root target does not exist: {target}",
                )
            )
        elif target.resolve() != canonical_root.resolve():
            findings.append(
                Finding(
                    "error",
                    "agent-root-symlink-wrong-scope",
                    str(root),
                    f"Agent-specific skill root resolves to {target}, expected {canonical_root}.",
                    "User mirrors must target user .agents/skills; repo mirrors must target repo .agents/skills.",
                )
            )
        return

    for entry in skill_entries(root, only):
        skill_md = entry / "SKILL.md"
        if entry.is_symlink():
            target = entry.resolve(strict=False)
            if not target.exists():
                findings.append(Finding("error", "broken-symlink", str(entry), f"Symlink target does not exist: {target}"))
                continue
            if ".agents/skills" not in str(target):
                findings.append(
                    Finding(
                        "warning",
                        "agent-symlink-target-not-agents",
                        str(entry),
                        f"Agent-specific symlink points outside .agents/skills: {target}",
                        "Point compatibility symlinks at the canonical .agents skill source unless a client-managed source is required.",
                    ),
                )
            elif not path_is_within(target, canonical_root):
                findings.append(
                    Finding(
                        "error",
                        "agent-symlink-wrong-scope",
                        str(entry),
                        f"Agent-specific symlink resolves to {target}, outside expected canonical root {canonical_root}.",
                        "Home mirrors must point to home .agents/skills; repo mirrors must point to repo .agents/skills.",
                    ),
                )
        else:
            findings.append(
                Finding(
                    "warning",
                    "agent-specific-real-copy",
                    str(entry),
                    "Agent-specific skill entry is a real directory, not a symlink.",
                    "Move the canonical copy to .agents/skills, then replace this entry with a symlink.",
                ),
            )
        validate_skill(entry, "agent-specific", findings)
        if not skill_md.exists():
            findings.append(Finding("error", "missing-skill-md", str(entry), "Skill entry does not contain SKILL.md."))


def text_report(records: list[SkillRecord], findings: list[Finding]) -> str:
    counts = {
        "skills": len(records),
        "errors": sum(1 for finding in findings if finding.severity == "error"),
        "warnings": sum(1 for finding in findings if finding.severity == "warning"),
        "info": sum(1 for finding in findings if finding.severity == "info"),
    }
    lines = [
        "# Skill Governance Audit",
        "",
        f"Skills checked: {counts['skills']}",
        f"Errors: {counts['errors']}",
        f"Warnings: {counts['warnings']}",
        f"Info: {counts['info']}",
    ]
    if records:
        lines.extend(["", "## Skills"])
        for record in records:
            suffix = " symlink" if record.is_symlink else ""
            lines.append(f"- {record.name} ({record.level}{suffix}): {record.path}")
    if findings:
        lines.extend(["", "## Findings"])
        for finding in findings:
            lines.append(f"- [{finding.severity}] {finding.code}: {finding.path}")
            lines.append(f"  {finding.message}")
            if finding.suggestion:
                lines.append(f"  Suggestion: {finding.suggestion}")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    home = Path(args.home).expanduser().resolve()
    repo = Path(args.repo).expanduser().resolve() if args.repo else None
    only = normalize_filter(args.skill)
    findings: list[Finding] = []
    records: list[SkillRecord] = []

    user_root = home / ".agents" / "skills"
    repo_root = repo / ".agents" / "skills" if repo else None

    records.extend(audit_canonical_root(user_root, "user-canonical", only, repo, findings))
    if repo_root:
        records.extend(audit_canonical_root(repo_root, "repo-canonical", only, repo, findings))

    for record in records:
        source = Path(record.path)
        if record.level == "user-canonical":
            for agent_dir in resolve_agent_dirs(home, args.agent_dir):
                ensure_symlink(source, agent_dir / record.name, findings, args.fix_missing_symlinks)
        elif record.level == "repo-canonical" and repo:
            for agent_dir in resolve_agent_dirs(repo, args.agent_dir):
                if agent_dir.exists():
                    ensure_symlink(source, agent_dir / record.name, findings, args.fix_missing_symlinks)

    for agent_dir in resolve_agent_dirs(home, args.agent_dir):
        audit_agent_root(agent_dir, only, user_root, findings)
    if repo:
        for agent_dir in resolve_agent_dirs(repo, args.agent_dir):
            audit_agent_root(agent_dir, only, repo_root, findings)

    if args.json:
        print(json.dumps({"skills": [asdict(record) for record in records], "findings": [asdict(f) for f in findings]}, indent=2))
    else:
        print(text_report(records, findings))

    has_errors = any(finding.severity == "error" for finding in findings)
    has_warnings = any(finding.severity == "warning" for finding in findings)
    if has_errors:
        return 1
    if args.strict and has_warnings:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
