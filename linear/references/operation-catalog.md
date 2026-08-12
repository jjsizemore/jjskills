# Linear Operation Catalog & GraphQL/HTTP Parity Matrix

Use current schema introspection or official Linear GraphQL documentation to select exact fields and input types. Names below describe capability families and evidence-backed transport mappings.

| Capability | Transport / operation family | Evidence status |
| :--- | :--- | :--- |
| Users and teams | GraphQL queries: `user`, `users`, `team`, `teams` | documented/live-UAT |
| Issues | GraphQL queries and mutations: `issue`, `issues`, `issueCreate`, `issueUpdate` | documented/live-UAT |
| Comments | GraphQL query/mutations: issue comments, `commentCreate`, `commentUpdate`, `commentDelete` | documented/live-UAT |
| Projects and milestones | GraphQL query/mutations for project and milestone entities | documented |
| Cycles and workflow | GraphQL queries for team cycles and workflow states | documented |
| Documents and initiatives | GraphQL query/mutations for document and initiative entities | documented |
| Releases and release notes | GraphQL query/mutations for releases, pipelines, and release notes | documented |
| Attachments and images | GraphQL upload control mutation plus authenticated HTTPS transfer to Linear-returned allowlisted storage URLs | multi-step-transport |
| Diff/review operations | GitHub integration or PR workflow; not assumed to be public Linear GraphQL schema | non-public-extension |
| Documentation search | External Linear docs or Context7 | non-public-extension |

## Evidence Level Definitions

- **`live-UAT`**: Tested live against Linear GraphQL with response verified in the current session.
- **`documented`**: Standard public Linear GraphQL schema query/mutation syntax derived from current documentation or schema introspection.
- **`multi-step-transport`**: Requires GraphQL control mutations plus direct HTTPS transfer to an allowlisted host.
- **`non-public-extension`**: Not part of the public Linear GraphQL schema; use the named external workflow instead.

## Read/query families

- Viewer and authenticated user: `viewer`; `users`.
- Workspace/team discovery: `teams`; team details; issue/project/initiative labels; workflow states; cycles; projects; milestones; releases; release pipelines; documents; initiatives.
- Issue data: `issues`; assigned issues; team issues; workflow-state issues; archived resources; filtering, ordering, and cursor pagination.
- Planning/delivery: `project`, `milestone`, `release`, `releaseNote`, `initiative`, `document`.
- Collaboration/review: comments; attachments; authenticated image extraction.

## Mutation families

- Issue lifecycle: `issueCreate`, `issueUpdate`; assignments; workflow state, cycle, project, milestone, labels, priority, estimate, relations, and archive state.
- Comments/content: `commentCreate`, `commentUpdate`, `commentDelete`; `documentCreate`, `documentUpdate`; release-note mutations.
- Planning metadata: project, milestone, and initiative create/update mutations.
- Attachments/assets: upload mutation, HTTPS transfer, then attachment creation/deletion.
- Workspace administration: issue-label, project-label, initiative-label, workflow-state, and webhook mutations when explicitly requested.

## Request-shape rules

- Use variables, operation names, minimal selections, and stable UUIDs.
- Connection reads must expose `pageInfo { hasNextPage endCursor }`; continue with `after: endCursor` while retaining filters and ordering.
- Mutations must request `success` plus the changed object's stable ID and enough fields to verify the requested transition. Check `errors` and `success` independently.
- Preserve user-supplied Markdown mentions and collapsible sections without injecting secrets or restricted content.
- For assets, allow only Linear-returned HTTPS storage URLs on approved hosts such as `uploads.linear.app`; reject arbitrary hosts and redirects, retain authentication, and treat URLs and bytes as sensitive.
