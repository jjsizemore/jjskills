# Linear Operation Catalog & MCP Parity Matrix

Use current schema introspection or official GraphQL documentation to select exact fields and input types. Names below describe capability families and explicit GraphQL/HTTP mappings with evidence-backed parity statuses.

## MCP-Tool to GraphQL/HTTP Parity Matrix

| Mounted MCP Tool | Transport / Operation | GraphQL Query / Mutation or HTTP Endpoint | Parity Status |
| :--- | :--- | :--- | :--- |
| `get_user` | GraphQL Query | `query User($id: String!) { user(id: $id) { id name email } }` | `live-UAT` |
| `list_users` | GraphQL Query | `query Users { users { nodes { id name email } } }` | `live-UAT` |
| `get_team` | GraphQL Query | `query Team($id: String!) { team(id: $id) { id name key } }` | `live-UAT` |
| `list_teams` | GraphQL Query | `query Teams { teams { nodes { id name key } } }` | `live-UAT` |
| `get_issue` | GraphQL Query | `query Issue($id: String!) { issue(id: $id) { id title description state { id name } assignee { id name } } }` | `live-UAT` |
| `list_issues` | GraphQL Query | `query Issues($filter: IssueFilter, $first: Int, $after: String) { issues(filter: $filter, first: $first, after: $after) { pageInfo { hasNextPage endCursor } nodes { id title } } }` | `live-UAT` |
| `save_issue` | GraphQL Mutation | `mutation IssueCreate($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id title } } }` / `issueUpdate` | `documented` |
| `list_comments` | GraphQL Query | `query Comments($issueId: String!) { issue(id: $issueId) { comments { nodes { id body user { name } } } } }` | `live-UAT` |
| `save_comment` | GraphQL Mutation | `mutation CommentCreate($input: CommentCreateInput!) { commentCreate(input: $input) { success comment { id body } } }` / `commentUpdate` | `live-UAT` |
| `delete_comment` | GraphQL Mutation | `mutation CommentDelete($id: String!) { commentDelete(id: $id) { success } }` | `live-UAT` |
| `get_project` / `list_projects` / `save_project` | GraphQL Query/Mutation | `query Project` / `query Projects` / `mutation ProjectCreate` / `mutation ProjectUpdate` | `documented` |
| `get_milestone` / `list_milestones` / `save_milestone` | GraphQL Query/Mutation | `query Milestone` / `query Milestones` / `mutation MilestoneCreate` / `mutation MilestoneUpdate` | `documented` |
| `list_cycles` | GraphQL Query | `query Cycles($teamId: String!) { team(id: $teamId) { cycles { nodes { id number name } } } }` | `documented` |
| `get_document` / `list_documents` / `save_document` | GraphQL Query/Mutation | `query Document` / `query Documents` / `mutation DocumentCreate` / `mutation DocumentUpdate` | `documented` |
| `get_initiative` / `list_initiatives` / `save_initiative` | GraphQL Query/Mutation | `query Initiative` / `query Initiatives` / `mutation InitiativeCreate` / `mutation InitiativeUpdate` | `documented` |
| `get_release` / `list_releases` / `save_release` | GraphQL Query/Mutation | `query Release` / `query Releases` / `mutation ReleaseCreate` / `mutation ReleaseUpdate` | `documented` |
| `get_release_note` / `list_release_notes` / `save_release_note` | GraphQL Query/Mutation | `query ReleaseNote` / `query ReleaseNotes` / `mutation ReleaseNoteCreate` / `mutation ReleaseNoteUpdate` | `documented` |
| `get_attachment` / `delete_attachment` | GraphQL Query/Mutation | `query Attachment` / `mutation AttachmentDelete` | `documented` |
| `prepare_attachment_upload` / `create_attachment_from_upload` | GraphQL Mutation + HTTP PUT | `mutation FileUpload` -> HTTP PUT to Linear upload URL -> `mutation AttachmentCreate` | `multi-step-transport` |
| `extract_images` | Authenticated HTTP GET | `GET https://uploads.linear.app/...` with `Authorization: <API_KEY>` or Bearer token | `multi-step-transport` |
| `get_diff` / `get_diff_threads` / `list_diffs` / `save_diff_comment` / `delete_diff_comment` / `resolve_diff_thread` / `submit_diff_review` / `merge_diff` | GitHub Integration / Non-Public API | Use GitHub GraphQL API / PR workflow or attach GitHub PR URL to Linear Issue | `non-public-extension` |
| `search_documentation` | External Docs | Refer to `https://linear.app/docs` or Context7 | `non-public-extension` |

## Evidence Level Definitions

- **`live-UAT`**: Tested live against Linear GraphQL API (`https://api.linear.app/graphql`) with response verified in this session.
- **`documented`**: Standard public Linear GraphQL schema query/mutation; syntax derived from official GraphQL documentation and schema introspection.
- **`multi-step-transport`**: Requires a combination of GraphQL control mutations and direct HTTPS transfers to allowlisted storage hosts (`uploads.linear.app`).
- **`non-public-extension`**: Not part of the public Linear GraphQL API schema; requires GitHub integrations or external documentation providers.

## Read/query families

- viewer and authenticated user: `viewer`; `users`.
- workspace/team discovery: `teams`; team details; issue/project/initiative labels; workflow states/statuses; cycles; projects; milestones; releases; release pipelines; documents; initiatives.
- issue data: `issues`; assigned issues; team issues; workflow-state issues; archived resources; filtering, ordering, and cursor pagination.
- planning/delivery: `project`, `milestone`, `release`, `releaseNote`, `initiative`, `document`.
- collaboration/review: `comments`; `attachments`; authenticated image extraction.

## Mutation families

- issue lifecycle: `issueCreate`, `issueUpdate`; assign users; change workflow state, cycle, project, milestone, labels, priority, estimate, relations, and archive state.
- comments/content: `commentCreate`, `commentUpdate`, `commentDelete`; `documentCreate`, `documentUpdate`; `releaseNoteCreate`, `releaseNoteUpdate`.
- planning metadata: `projectCreate`, `projectUpdate`; `milestoneCreate`, `milestoneUpdate`; `initiativeCreate`, `initiativeUpdate`.
- attachments/assets: `fileUpload` mutation -> HTTP PUT -> `attachmentCreate`, `attachmentDelete`.
- workspace administration: `issueLabelCreate`, `projectLabelCreate`, `initiativeLabelCreate`; `workflowStateCreate`; `webhookCreate`.

## Request-shape rules

- Use variables, operation names, minimal selections, and stable UUIDs.
- Connection reads must expose `pageInfo { hasNextPage endCursor }`; continue with `after: endCursor` while retaining filters and ordering.
- Mutations must request `success` plus the changed object's stable ID and enough fields to verify the requested transition. Check `errors` and `success` independently.
- For comments/documents/release notes, preserve Markdown mentions and collapsible sections only as user supplied; do not inject secrets or restricted content.
- For assets, GraphQL prepares/records the operation (`fileUpload`), while upload/download/image retrieval follows only Linear-returned HTTPS storage URLs (`uploads.linear.app`). Allowlist the host, reject arbitrary hosts and redirects, retain authentication, and treat URLs and bytes as sensitive.
