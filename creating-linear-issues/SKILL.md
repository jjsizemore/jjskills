---
name: creating-linear-issues
description: >-
  Use when creating, confirming, or updating a Linear issue with enough detail
  for implementation, validation, and closeout. Prefer the create-linear-issue
  script or Linear MCP when available.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable issue creation with API/script + MCP paths.
---

# Creating Linear Issues

## Role

Produce an **independently actionable** Linear issue (or update an existing one)
so an implementer does not rediscover cause, recovery, ownership, or acceptance.

## When to use

- New work needs a tracked issue (feature, bug, chore, epic)
- User invokes `/creating-linear-issues` or asks to file a Linear ticket

## Contract (minimum body)

| Section | Required |
| --- | --- |
| Why / Rationale | MANDATORY — explain why the issue/work is needed |
| Problem / goal | Yes — evidence-linked |
| Failing boundary / proof | Bugs/incidents: yes; chores: N/A with reason |
| Root cause / escape reason | Bugs: yes; features: design intent |
| Acceptance criteria | Yes — testable |
| Implementation scope | Files/areas / out of scope |
| Architectural Decision Record (ADR) | When an architectural decision is made and alternatives or tradeoffs are evaluated, require an ADR under `docs/architecture/adr/` containing decision, alternatives considered, tradeoffs, and rationale; routine/non-architectural changes do not require an ADR |
| Validation | Commands / gates |
| UX recovery / operator notification | When users/ops affected; else `Not applicable — …` |
| Rollout / rollback | When runtime; else N/A |
| Owner | Team or person |

Reject patch-and-test-only issues with no acceptance proof.

## Create (preferred order)

### 1. MCP OAuth (preferred when Grok Linear MCP is authenticated)

```bash
node ~/.agents/skills/creating-linear-issues/scripts/create-linear-issue-mcp.mjs \
  --title "…" \
  --team SV \
  --description-file /tmp/issue-body.md
```

Uses `~/.grok/mcp_credentials.json` (Linear MCP OAuth). Re-auth via Grok `/mcps` if 401.

### 1b. API key script (fallback)

```bash
export LINEAR_API_KEY=lin_api_...   # or rely on 1Password item "Linear"
node ~/.agents/skills/creating-linear-issues/scripts/create-linear-issue.mjs \
  --title "…" \
  --team SV \
  --description-file /tmp/issue-body.md
```

Auth resolution:

1. `LINEAR_API_KEY` (non-`test_` prefix)
2. `op item get Linear --fields 'kilo-code api key' --reveal` (override via `LINEAR_OP_ITEM` / `LINEAR_OP_FIELD`)

On **401**: key is missing/revoked. Create a new personal API key at Linear → Settings → Account → Security → API keys, store in 1Password, retry. Do not invent issue IDs.

### 2. Linear MCP

If `linear__save_issue` / `linear__create_issue` (or equivalent) is available via `search_tool` / `use_tool`, use it with the same body contract.

### 3. Manual fallback

Write the full issue body to a file and give the user the title + body + team key to paste. Still complete the contract; do not stop at a vague title.

## Workflow

1. Confirm trigger and gather evidence (code, failing command, plan path).
2. Draft title (≤~80 chars, imperative) and full markdown body.
3. Create via script or MCP; capture `identifier` + `url`.
4. Link from PR/plan/run ledger (`sourceSpec` / `Closes SV-NNN`) when relevant.
5. Hand off identifier to `executing-work` / `remediating-root-causes` as needed.

## Stop

- Cannot authenticate and user did not accept manual paste
- Issue would force implementer to rediscover root cause or acceptance

## Related

- `managing-linear` / `managing-linear-projects-mcp` for broader workspace ops
- `creating-implementation-specs` for remediation specs that should link an issue
