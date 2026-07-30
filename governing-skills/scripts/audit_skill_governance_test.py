import tempfile
import unittest
from pathlib import Path

import audit_skill_governance as audit


class AuditAgentRootTests(unittest.TestCase):
    def test_accepts_directory_symlink_to_same_scope_canonical_root(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            canonical = root / ".agents" / "skills"
            skill = canonical / "example-skill"
            skill.mkdir(parents=True)
            (skill / "SKILL.md").write_text(
                "---\n"
                "name: example-skill\n"
                "description: Use when testing directory mirrors.\n"
                "---\n"
                "\n"
                "# Example Skill\n"
            )

            mirror = root / ".gemini" / "config" / "skills"
            mirror.parent.mkdir(parents=True)
            mirror.symlink_to(canonical, target_is_directory=True)

            findings: list[audit.Finding] = []
            audit.audit_agent_root(mirror, {"example-skill"}, canonical, findings)

            self.assertEqual(findings, [])

    def test_rejects_directory_symlink_to_other_scope(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            canonical = root / "user" / ".agents" / "skills"
            foreign = root / "repo" / ".agents" / "skills"
            canonical.mkdir(parents=True)
            foreign.mkdir(parents=True)

            mirror = root / "user" / ".gemini" / "config" / "skills"
            mirror.parent.mkdir(parents=True)
            mirror.symlink_to(foreign, target_is_directory=True)

            findings: list[audit.Finding] = []
            audit.audit_agent_root(mirror, set(), canonical, findings)

            self.assertEqual([finding.code for finding in findings], ["agent-root-symlink-wrong-scope"])


if __name__ == "__main__":
    unittest.main()
