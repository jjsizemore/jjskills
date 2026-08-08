---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a durable Markdown artifact in the repo. Use only when the user explicitly requests that artifact or asks for the research to be delegated to a background agent; ordinary docs and API questions do not activate this skill.
---

## Activation boundary

Activate only when the user explicitly requests a durable research artifact in the repository or explicit background delegation. Answer ordinary documentation and API questions directly with the current documentation lookup path, without creating a research artifact.

Spin up a **background agent** to do the research, so you keep working while it reads.

Its job:

1. Investigate the question against **primary sources** — official docs, source code, specs, first-party APIs — not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.
