---
name: debugging-real-time-pipelines
description: Debug SyncVia desktop-to-backend real-time transcript and intervention pipeline (audio capture, chunk handoff, transcript persistence, orchestration, and emitted interventions). Use when live meeting assistance is delayed, missing, duplicated, or low quality.
---

# SyncVia Real-Time Pipeline Debug

Use this skill for issues in the live flow from desktop capture through backend AI orchestration.

## Canonical Pipeline

Desktop capture (system + mic) -> audio chunks -> backend transcription API -> transcript chunks persistence -> real-time orchestration -> intelligent question generation -> WebSocket emission -> desktop renderer.

## Debug Strategy

1. Identify first broken stage in the pipeline (not just final symptom).
2. Verify contracts at each boundary (payload shape, IDs, timestamps, meeting/session linkage).
3. Check deduplication/rate-limit behavior for intervention generation.
4. Validate permission context and user ownership on persisted/derived data.
5. Confirm latency against budgets where relevant.

## Performance Targets

- Vector/context retrieval path: target <100ms operations where expected.
- Real-time intervention latency: keep under ~2s budget end-to-end where feasible.

## Scope Guardrails

- Prioritize desktop ingest path; Zoom/Teams/Meet are legacy scaffolding.
- Avoid introducing client-only filtering that breaks meeting data uniformity.

## Output Expectations

Report:

- Stage where failure originated
- Evidence used to prove root cause
- Fix implemented
- Validation run (targeted + broader)
- Any residual risk and monitoring suggestions
