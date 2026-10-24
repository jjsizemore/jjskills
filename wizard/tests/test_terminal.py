#!/usr/bin/env python3
"""Check that terminal clearing cannot stop the wizard workflow."""
import os
import pty
import subprocess
import tempfile
from pathlib import Path

TEMPLATE = Path(__file__).resolve().parents[1] / "template.sh"
source = TEMPLATE.read_text().split("# STAGES — author this section.", 1)[0]


def run_wizard(tty):
    with tempfile.TemporaryDirectory() as directory:
        script = Path(directory) / "wizard.sh"
        script.write_text(source + 'TOTAL_STAGES=1\nstage "survived clear"\nsay "workflow reached"\nfinish\n')
        if not tty:
            result = subprocess.run(["bash", str(script)], input="\n", text=True, capture_output=True, env={**os.environ, "TERM": "dumb"})
            assert result.returncode == 0, result.stderr
            output = result.stdout
        else:
            pid, fd = pty.fork()
            if pid == 0:
                os.environ["TERM"] = "dumb"
                os.execv("/bin/bash", ["bash", str(script)])
            os.write(fd, b"\n")
            chunks = []
            while True:
                try:
                    chunk = os.read(fd, 4096)
                    if not chunk:
                        break
                    chunks.append(chunk)
                except OSError:
                    break
            _, status = os.waitpid(pid, 0)
            assert os.waitstatus_to_exitcode(status) == 0, b"".join(chunks).decode(errors="replace")
            output = b"".join(chunks).decode(errors="replace")
        assert "survived clear" in output
        assert "workflow reached" in output


run_wizard(tty=True)
run_wizard(tty=False)
