---
name: managing-managing-linear-projects-mcp
description: Use Linear MCP tools for issue tracking and project management operations.
user-invocable: true
argument-hint: 'Provide Linear issue details or query filters.'
---

# Linear MCP Skill

Use this skill for structured issue creation, querying, and status updates in Linear.

## Source of truth

This skill is the authoritative Linear MCP tool surface for this repo. Prompt files may reference it, but they must not redefine tool names or parameter names. If a tool or field is not listed here, do not invent it.

## CRITICAL: Tool Loading (agents fail here most often)

Linear MCP tools are **deferred tools** in VS Code. They do NOT exist until you explicitly load them. There are **no** `activate_*()` helper functions — those are fictional and will cause immediate failure.

**The only way to load Linear MCP tools is:**

```
tool_search_tool_regex({ pattern: "^mcp_managing-linear_" })
```

This single call loads **all** Linear MCP tools for the session. Call it **once** before using any `mcp_managing-linear_*` tool. You can also load a subset with a more specific pattern (e.g., `"mcp_managing-linear_save|mcp_managing-linear_get"`) but the full load is preferred for reliability.

### ❌ NEVER use these — they do not exist

- `activate_issue_management_tools()`
- `activate_comment_management_tools()`
- `activate_entity_retrieval_tools()`
- `activate_label_and_status_management_tools()`
- `activate_managing-linear_issue_and_initiative_management()`
- `activate_managing-linear_issue_label_management()`
- `activate_issue_management_tools_2()`
- `mcp_managing-linear_create_issue` (use `mcp_managing-linear_save_issue` without `id`)
- `mcp_managing-linear_get_authenticated_user` (use `mcp_managing-linear_get_user({ query: 'me' })`)
- `mcp_managing-linear_research` (use `mcp_managing-linear_list_issues({ query: '...' })` for searching)

## Canonical safe workflow

1. **Load tools first**
   - Call `tool_search_tool_regex({ pattern: "^mcp_managing-linear_" })` once at the start
   - This replaces all former "activate" steps

2. **Resolve the scope before mutating anything**
   - If an issue ID is already known, call `mcp_managing-linear_get_issue({ id: 'SV-123' })` first.
   - For this workspace, the canonical team is **`SyncVia`** with key **`SV`**.
   - Do **not** assume the team name is `SyncVia.ai`; that is a known mismatch and can fail.

3. **Search before mutating**
   - Use `mcp_managing-linear_list_issues({ query: '...', team: 'SyncVia' })` to check for duplicates before creating.
   - Use `mcp_managing-linear_list_projects`, `mcp_managing-linear_list_cycles`, or `mcp_managing-linear_list_milestones` to resolve ambiguous project / cycle / milestone mapping.
   - Use targeted list/get tools when the scope is already known.

4. **Create/update issues with the real tool**
   - Use `mcp_managing-linear_save_issue(...)`
   - Omit `id` to create a new issue
   - Include `id` to update an existing issue

5. **Populate only supported, high-confidence fields**
   - Use the actual supported save fields (see table below).
   - If a field cannot be resolved confidently, omit it and note the uncertainty instead of guessing.

6. **Send markdown content with literal newlines**
   - For `description`, `body`, and document content, send real markdown paragraphs/bullets
   - Do not use escaped `\n` sequences

### Supported `mcp_managing-linear_save_issue` fields

| Purpose      | Save field    | Example                                                       |
| ------------ | ------------- | ------------------------------------------------------------- |
| Team         | `team`        | `SyncVia` or the resolved team ID                             |
| Project      | `project`     | `Database Security & Performance`                             |
| Cycle        | `cycle`       | resolved cycle name / number / ID                             |
| Milestone    | `milestone`   | resolved milestone name / ID                                  |
| Labels       | `labels`      | `['backend', 'bug', 'infrastructure']`                        |
| Assignee     | `assignee`    | `'me'` or a resolved user identifier                          |
| Priority     | `priority`    | `1` (Urgent), `2` (High), `3` (Normal), `4` (Low), `0` (None) |
| Estimate     | `estimate`    | `3`                                                           |
| Status       | `state`       | `In Progress` (state type, name, or ID)                       |
| Due date     | `dueDate`     | `2026-04-15`                                                  |
| Parent issue | `parentId`    | parent issue ID                                               |
| Blocked by   | `blockedBy`   | issue ID(s) this issue is blocked by                          |
| Blocks       | `blocks`      | issue ID(s) this issue blocks                                 |
| Related to   | `relatedTo`   | related issue ID(s)                                           |
| Duplicate of | `duplicateOf` | issue ID this is a duplicate of                               |
| Links        | `links`       | URL link attachments                                          |

**Priority mapping**: P0 → `1` (Urgent), P1 → `2` (High), P2 → `3` (Normal), P3 → `4` (Low)

## Reliable tool map

### Core CRUD

- Create/update issue → `mcp_managing-linear_save_issue`
- Add/update comment → `mcp_managing-linear_save_comment`
- Delete comment → `mcp_managing-linear_delete_comment`
- Get a known issue directly → `mcp_managing-linear_get_issue({ id: 'SV-123' })`
- Get issue status → `mcp_managing-linear_get_issue_status`
- List/search issues → `mcp_managing-linear_list_issues`

### Research & Discovery

- Search issues by title/description → `mcp_managing-linear_list_issues({ query: '...' })`
- Search documentation → `mcp_managing-linear_search_documentation`

### Users & Teams

- Get current user → `mcp_managing-linear_get_user({ query: 'me' })`
- List users → `mcp_managing-linear_list_users`
- Get team → `mcp_managing-linear_get_team`
- List teams → `mcp_managing-linear_list_teams`

### Projects, Cycles & Milestones

- Get/list projects → `mcp_managing-linear_get_project` / `mcp_managing-linear_list_projects`
- Save project → `mcp_managing-linear_save_project`
- List cycles → `mcp_managing-linear_list_cycles` (requires `teamId`)
- Get/list milestones → `mcp_managing-linear_get_milestone` / `mcp_managing-linear_list_milestones({ project: '<known project>' })`
- Save milestone → `mcp_managing-linear_save_milestone`

### Labels & Statuses

- List issue labels → `mcp_managing-linear_list_issue_labels`
- Create issue label → `mcp_managing-linear_create_issue_label`
- List project labels → `mcp_managing-linear_list_project_labels`
- List issue statuses → `mcp_managing-linear_list_issue_statuses`

### Initiatives & Status Updates

- Get/list initiatives → `mcp_managing-linear_get_initiative` / `mcp_managing-linear_list_initiatives`
- Save initiative → `mcp_managing-linear_save_initiative`
- Get status updates → `mcp_managing-linear_get_status_updates`
- Save/delete status update → `mcp_managing-linear_save_status_update` / `mcp_managing-linear_delete_status_update`

### Documents & Attachments

- Get/list/create/update documents → `mcp_managing-linear_get_document` / `mcp_managing-linear_list_documents` / `mcp_managing-linear_create_document` / `mcp_managing-linear_update_document`
- Get/create/delete attachments → `mcp_managing-linear_get_attachment` / `mcp_managing-linear_create_attachment` / `mcp_managing-linear_delete_attachment`
- Extract images → `mcp_managing-linear_extract_images`
- List comments → `mcp_managing-linear_list_comments`

## Project and milestone guardrails

- Never pass an issue ID, team name, or guessed string into `mcp_managing-linear_list_milestones({ project })`.
- Treat `mcp_managing-linear_list_milestones` as a lookup on a **known project**, not as a project-discovery tool.
- Reuse the exact project already attached to an issue from `mcp_managing-linear_get_issue` whenever possible.
- If the project cannot be resolved confidently, leave `project` and `milestone` unset and state that explicitly instead of guessing.

## Anti-loop / anti-flakiness rules

- ✅ Call `tool_search_tool_regex({ pattern: "^mcp_managing-linear_" })` once before using any Linear tool
- ✅ Resolve the team from `mcp_managing-linear_get_user({ query: 'me' })`, `mcp_managing-linear_get_team({ query: 'SV' })`, or the canonical `SyncVia` / `SV` mapping before issue creation
- ✅ Use `mcp_managing-linear_get_issue` when an issue ID is already known instead of searching by title repeatedly
- ✅ Use `mcp_managing-linear_list_issues({ query: '...' })` to search for duplicates or related issues before creating
- ✅ Use `mcp_managing-linear_list_projects`, `mcp_managing-linear_list_cycles`, or `mcp_managing-linear_list_milestones` for ambiguous project / cycle / milestone mapping
- ✅ Use the actual `mcp_managing-linear_save_issue` parameter names: `project`, `cycle`, `milestone`, `labels`, `assignee`
- ✅ Only call `mcp_managing-linear_list_milestones({ project })` after a real project has already been resolved
- ✅ Maximum two resolution attempts per entity: one list/search call and one targeted follow-up
- ✅ On `Project not found`, stop guessing and either list projects or omit the field
- ❌ Never call `activate_*()` functions — they do not exist (see Tool Loading section)
- ❌ Never use invented tools like `mcp_managing-linear_create_issue` or `mcp_managing-linear_get_authenticated_user`
- ❌ Never pass an issue ID, team name, or guessed string into `mcp_managing-linear_list_milestones({ project })`
- ❌ Never fabricate IDs, slugs, or display names just to satisfy metadata completeness

## Example workflow

```
// Step 1: Load all Linear MCP tools (REQUIRED — replaces all "activate" calls)
tool_search_tool_regex({ pattern: "^mcp_managing-linear_" })

// Step 2: Resolve identity and team
mcp_managing-linear_get_user({ query: 'me' })

// Step 3: Search for duplicates before creating
mcp_managing-linear_list_issues({ query: 'meeting transcript lag', team: 'SyncVia' })

// Step 4: Resolve labels if needed (use real label names from the team)
mcp_managing-linear_list_issue_labels({ team: 'SyncVia' })

// Step 5: Create the issue
mcp_managing-linear_save_issue({
  title: 'Fix meeting transcript lag',
  description: '...',
  team: 'SyncVia',
  priority: 2,
  estimate: 3,
  project: 'Post-Meeting Intelligence & Export',
  cycle: 'current',
  assignee: 'me',
  labels: ['backend', 'real-time']
})
```

## Notes

- Prefer this skill for reproducible issue updates from agent workflows.
- In SyncVia, a failed `mcp_managing-linear_get_team({ query: 'SyncVia.ai' })` is usually a **name mismatch**, not a platform outage.
- Prefer correctness over completeness: attach all metadata that is **reliably resolvable with the current MCP surface**, and omit the rest rather than guessing.
