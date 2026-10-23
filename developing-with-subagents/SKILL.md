---
name: developing-with-subagents
description: 'Use when executing implementation plans with independent tasks in the current session'
---

# Developing With Subagents

Use this skill when executing implementation plans with independent tasks in the current session

## Guidance

The [portable completion contract](../references/autonomous-completion-contract.md)
owns assignment, ownership, gates, evidence reuse, review and delivery endpoints.

For native Codex collaboration, use `send_message` to steer a running worker.
Use `followup_task` to resume an idle or completed worker with authorized,
eligible work: `send_message` only queues a message and does not start a turn.
Consume a returned review packet, then resume its owner after clearance; do
not leave the owner idle while waiting for execution. Follow-up requests steer
the original assignment unless they explicitly replace it.

| Worker state and input | Required action | Keep closed |
| --- | --- | --- |
| Completed review packet; clearance arrives; authorized delivery remains | Use the native turn-starting continuation with the exact remaining task and retained proof. | Message-only clearance followed by waiting or claiming delivery. |
| Running worker; correction or review request arrives | Send steering and retain the original endpoint. | Silently replacing the original task with the side request. |
| Worker is blocked on unchanged consent, access, lease or resource limits | Keep that action parked; continue independent eligible work. | A continuation that retries the unchanged gate. |
