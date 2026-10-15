---
name: auditing-linear-capacity
description: Use when auditing Linear team or workspace issue capacity, identifying candidates for closure or cancellation against repository evidence (commits, PRs, code state), executing verified one-at-a-time pre-read/mutate/post-read transitions, and producing evidence-backed triage reports.
---

# Auditing Linear Capacity

Use this skill to audit Linear team or workspace capacity when a team is near or at issue capacity limits, evaluate open/backlog/in-progress issues against repository evidence (git history, PRs, codebase state), perform verified issue closures or cancellations, and produce evidence-backed triage reports.

## Activation Boundary & Exclusions

- **Activate when**: The user requests a Linear capacity audit, clearing up capacity in Linear, evaluating open/backlog/in-progress issues for closure or cancellation, or bulk-triaging completed/stale Linear issues against repository commits and PRs.
- **Do NOT activate for**: Single issue updates or standard PR closeout (use `linear` or `closing-repo-work`), GitHub-only issue triage with no Linear state (use `querying-github-repository-mcp`), or local work-run state cleanup (use `work-run-state`).

## Required Inputs & Self-Discovery

1. **Repository Identity**: Derive GitHub `owner/repository` from `git remote get-url origin`.
2. **Linear Profile & Credential**: Load mapping from `~/.agents/linear/profiles.json` or `<repo>/.linear/team.json`. Resolve token via `fnox` or `LINEAR_API_TOKEN` environment variable. Never print or log credentials.
3. **Team Resolution**: Resolve stable team UUID via `mcp__linear_list_teams` or profile configuration.
4. **Issue Inventory**: Discover all issues in non-completed, non-canceled states (`Backlog`, `Todo` / `Unstarted`, `In Progress`, `In Review`, `Reviewed`, `Triage`) using cursor pagination.
5. **Repository Evidence**: Match issue identifiers against `git log`, `git branch -a`, merged/open PRs, and active codebase files.

---

## Ordered Workflow

```
1. Resolve Profile & Team ──► 2. Enumerate All Open Issues ──► 3. Evidence-Backed Classification
                                                                        │
5. Audit & Proof Report  ◄── 4. Verified State Transition Loop ◄────────┘
```

### Step 1: Environment & Profile Resolution

1. Verify git remote identity and Linear credential availability.
2. Resolve target team key and stable UUID. If no mapping exists, prompt for explicit team selection before writing configuration.
3. Verify team read access via `mcp__linear_get_team` or `mcp__linear_list_issue_statuses`.

### Step 2: Comprehensive Issue Inventory

1. Discover all workflow state names and IDs for the target team using `mcp__linear_list_issue_statuses`.
2. Query issues for each active (non-completed, non-canceled) status using `mcp__linear_list_issues` with `limit: 250`.
3. Paginate cursors (`hasNextPage` / `endCursor`) until all open issues across all active states are retrieved.

### Step 3: Evidence-Backed Classification

Correlate each issue key (`SV-XXX`, `PROJ-YYY`) against repository evidence:
- **Git Commit History**: Search `git log --grep='<issue-key>'` and `git log --oneline`.
- **Pull Requests**: Search PR titles and descriptions for linked issue keys or merged branch references.
- **Codebase Artifacts**: Check if specified files, schemas, endpoints, or features exist in the current working tree.

Categorize each open issue into one of three buckets:
1. **Completed**: Commits or merged PRs exist delivering the exact scope of the issue.
2. **Obsolete / Superseded**: Requirements or architecture evolved, rendering the issue obsolete or fully superseded by newer features.
3. **Active / Retained**: Open PR exists, unmerged feature branch exists, or work is legitimately unstarted/in-progress.

### Step 4: Strict Verified State Transition Loop

Audit requests are read-only by default. Issue inventory and classification do not authorize transitions. Run this step only when the user explicitly authorized closures/cancellations for the identified scope; otherwise return recommendations without mutations.

**Non-Negotiable Verification Protocol**:
For each candidate issue to be closed or canceled:

1. **Pre-Read**: Invoke `mcp__linear_get_issue` to capture current state, title, and metadata before modification.
2. **Mutate**: Select the target team's discovered completed/canceled state UUID from Step 2 and pass that UUID to `mcp__linear_save_issue`. Do not assume terminal names are `Done` or `Canceled`; stop if the intended target state is ambiguous.
3. **Post-Read**: Invoke `mcp__linear_get_issue` immediately after mutation to verify the exact selected state UUID and capture proof.

> **Process Limitation Disclosure**: If any batch mutation occurred prior to post-read verification, explicitly disclose the process limitation in the final report rather than asserting per-item pre-read evidence.

### Step 5: Audit & Proof Report

Generate a clear, evidence-backed report structured as follows:

1. **Audit Summary**: Workspace/team, total issues evaluated, total issues closed/canceled, total active issues retained.
2. **Verification Protocol Disclosure**: State whether items followed pre-read + post-read verification or batch mutation + post-read verification.
3. **Closed / Canceled Issues Table**: Issue ID, title, merged PR / commit proof, and verification path.
4. **Retained Active Issues Summary**: List remaining open issues with active branch/PR references or unstarted status.

---

## Edge Cases & Failure Recovery

- **Rate Limits (`RATELIMITED`)**: Honor `X-RateLimit-*-Reset` headers. Use bounded exponential backoff for idempotent reads. Never retry mutations blindly.
- **GraphQL Validation Errors**: Check error paths and operation payloads independently. Re-read target issue before repeating a failed mutation.
- **Ambiguous Evidence**: If an issue matches multiple commits or has an unmerged open PR, retain it in the active list. Do not close ambiguous items.
- **Unmapped Team / Token Missing**: Stop immediately. Present required configuration steps without exposing secrets.

---

## Stop Condition & Proof Bundle

Done means:
1. All open issues for the team were inventoried via cursor pagination.
2. Every closure/cancellation candidate was verified against repository evidence (commits/PRs/code).
3. Post-mutation state transitions (`Done` / `Canceled`) were verified by re-reading each changed issue.
4. An audit report containing exact issue IDs, commit/PR proof, and verification paths was produced.
