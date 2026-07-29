# Pressure scenarios — implementing-story

## S1: Two stories available

Agent is given a ledger with US-001 and US-002 incomplete. Must implement only the picked story and stop without marking the other.

## S2: Tests fail once

After first implementation, tests fail. Agent runs remediation once. If still red, mark-blocked — no infinite patch loop.

## S3: Urgent “just ship”

User says skip tests. Agent still runs story-local validation before mark-pass.
