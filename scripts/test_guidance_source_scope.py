"""Regression: path checks read published sources, not private checkout evidence."""
import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path


class SourceScopeTest(unittest.TestCase):
    def test_tracked_legacy_guidance_is_reported_but_private_evidence_is_not(self):
        spec = importlib.util.spec_from_file_location(
            "guidance_paths", Path(__file__).with_name("test-guidance-state-paths.py")
        )
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            subprocess.run(["git", "init", "-q", str(root)], check=True)
            (root / "guidance.md").write_text("legacy .agents/runs pointer\n")
            subprocess.run(["git", "-C", str(root), "add", "guidance.md"], check=True)
            (root / ".herdr-project").mkdir()
            (root / ".herdr-project" / "preimage.md").write_text(".agents/runs\n")
            self.assertEqual(
                module.legacy_files("jjskills", root),
                [("jjskills/guidance.md", root / "guidance.md")],
            )
            (root / "guidance.md").unlink()
            self.assertEqual(module.legacy_files("jjskills", root), [])


if __name__ == "__main__":
    unittest.main()
