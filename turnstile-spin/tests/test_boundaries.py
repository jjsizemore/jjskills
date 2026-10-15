"""Exercise credential execution and local bundle persistence boundaries."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"


class BoundaryTests(unittest.TestCase):
    def test_missing_project_root_does_not_execute_wranger(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory).resolve()
            marker = root / "executed"
            binary = root / "wrangler"
            binary.write_text(f'#!/bin/sh\ntouch "{marker}"\nprintf "4.109.0\\n"\n')
            binary.chmod(0o755)
            env = {k: v for k, v in os.environ.items() if not k.startswith(("CLOUDFLARE_", "WRANGLER_", "PROJECT_ROOT"))}
            env.update(CLOUDFLARE_API_TOKEN="test-token", WRANGLER_BIN=str(binary), WRANGLER_VERSION="4.109.0")
            result = subprocess.run(["bash", str(SCRIPTS / "auth-probe.sh")], env=env, capture_output=True, text=True, check=True)
            self.assertFalse(marker.exists(), result.stderr)
            self.assertEqual(json.loads(result.stdout)["reason"], "missing_project_root")

    def test_persistence_rejects_a_destination_inside_its_source(self):
        target = SCRIPTS.parent / ".claude/skills/unsafe-copy"
        result = subprocess.run(["bash", str(SCRIPTS / "persist-skill.sh"), "--path", str(target / "SKILL.md")], cwd=SCRIPTS.parent, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(json.loads(result.stdout)["reason"], "target_inside_source")
        self.assertFalse(target.exists())

    def test_persistence_installs_the_reviewed_local_bundle(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run(["bash", str(SCRIPTS / "persist-skill.sh"), "--path", ".claude/skills/spin/SKILL.md"], cwd=directory, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            target = Path(directory) / ".claude/skills/spin"
            self.assertEqual((target / "SKILL.md").read_bytes(), (SCRIPTS.parent / "SKILL.md").read_bytes())
            self.assertEqual((target / "scripts/auth-probe.sh").read_bytes(), (SCRIPTS / "auth-probe.sh").read_bytes())


if __name__ == "__main__":
    unittest.main()
