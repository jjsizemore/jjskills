# Linear operation catalog

Use current schema introspection or official GraphQL documentation to select exact fields and input types. Names below describe the mounted Linear capability families; they are not permission to guess deprecated fields.

## Read/query families

- viewer and authenticated user: viewer; get/list users.
- workspace/team discovery: get/list teams; team details; issue/project/initiative labels; workflow states/statuses; cycles; projects; milestones; releases; release pipelines; documents; initiatives.
- issue data: list/get issues; assigned issues; team issues; workflow-state issues; archived resources; filtering, ordering, and cursor pagination.
- planning/delivery: get project, milestone, release, release note, initiative, status update, document.
- collaboration/review: list comments; get attachments; extract authenticated images; list diffs and diff threads; get diff details.

## Mutation families

- issue lifecycle: create/update issues; assign users; change workflow state, cycle, project, milestone, labels, priority, estimate, relations, and archive state.
- comments/content: create/update/delete comments and replies; create/update/delete documents; create/update status updates; create/update release notes.
- planning metadata: create/update projects, milestones, initiatives, releases, pipelines, cycles, labels, workflow states, and status updates where the current schema permits.
- attachments/assets: prepare upload, create/link attachment, get/delete attachment, extract authenticated image content.
- review/delivery: create/update/delete diff comments; resolve/reopen diff threads; submit diff review; merge or queue a diff.
- workspace administration: create/update issue, project, and initiative labels; create/update statuses; webhook registration only when explicitly requested, with a verified callback URL and resource scope.

## Request-shape rules

- Use variables, operation names, minimal selections, and stable UUIDs. Shorthand issue identifiers are acceptable only when Linear accepts them for that field and the response resolves the canonical ID.
- Connection reads must expose `pageInfo { hasNextPage endCursor }`; continue with `after: endCursor` while retaining filters and ordering.
- Mutations must request `success` plus the changed object's stable ID and enough fields to verify the requested transition. Check `errors` and `success` independently.
- For comments/documents/release notes, preserve Markdown mentions and collapsible sections only as user supplied; do not inject secrets or restricted terminal/source content.
- For assets, GraphQL prepares/records the operation, while upload/download/image retrieval follows only Linear-returned HTTPS storage URLs, including `uploads.linear.app`. Allowlist the host, reject arbitrary hosts and redirects, retain authentication, and treat URLs and bytes as sensitive. Do not put full asset bytes or authenticated URLs in managed-service summaries.
- For review/merge actions, fetch current diff/thread state immediately before mutation and require explicit approval for merge, queue, resolve, delete, or other irreversible effects.

## Mounted-tool mapping

- The skill must be able to perform the same intent as these mounted tool families: `get_*`, `list_*`, `save_*`, `delete_*`, `create_*`, `prepare_attachment_upload`, `extract_images`, `get_diff`, `get_diff_threads`, `resolve_diff_thread`, `submit_diff_review`, `merge_diff`, and `search_documentation`.
- The mounted-tool intent is split between GraphQL control operations and validated Linear storage transfers: `prepare_attachment_upload`, `create/link attachment`, `get/delete attachment`, and `extract_images` must not assume the GraphQL endpoint serves file bytes. No fixed workspace, team, credential, or arbitrary asset host is embedded.
