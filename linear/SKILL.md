---
name: linear
description: Use in any repository when an agent must interact with Linear through its GraphQL API across the active repository's teams, workspaces, or credentials.
---

# Linear

Use this skill for authenticated Linear reads and writes: teams, users, issues, comments, projects, documents, initiatives, workflows, releases, attachments, diffs, and reviews. Do not use it for GitHub-only work, local planning with no Linear side effect, or unauthenticated access.

## Inputs and configuration

Discover configuration; never ask the user to paste a secret that an available credential store can provide.

1. Find the repository root and derive its GitHub `owner/repository` identity from the configured remote; do not infer it from the directory name.
2. Load the user-level profile map at `~/.agents/linear/profiles.json` and the repository mapping at `<repo>/.linear/team.json` when present. The repo mapping must contain `teamKey` and may contain `teamId`, `teamUrl`, `credentialEnv`, `auth`, or `endpoint`.
3. Merge mappings only when explicitly compatible: repository profile data supplies credentials/default endpoint, while `.linear/team.json` supplies the repository's team identity and may override a credential reference only when it names an available secret. If both sources specify different team keys/IDs, stop with a configuration conflict; never select one silently.
4. Select the resulting profile explicitly. A team key is only a lookup hint; resolve and verify its stable UUID before a team-scoped write.
5. Resolve credentials from the configured environment/secret store. Personal API keys use `Authorization: <API_KEY>`; OAuth access tokens use `Authorization: Bearer <ACCESS_TOKEN>`. Never print, persist, interpolate into issue text, or include either value in proof output.
6. Before a mutation, resolve the target workspace/team/entity and verify stable IDs, permissions, and the requested fields. Do not infer identity from title, URL slug, path, or display label when an ID is available.
7. If no safe profile, credential, team, or target can be resolved, or mappings conflict, stop with the missing input/conflict and the exact non-secret evidence needed. Do not guess or fall back to another team.

Accepted configuration may be environment-backed or repo-local, for example:

```yaml
linear:
  profile: active-repository
  profiles:
    active-repository:
      teamId: <stable-team-uuid>
      credentialEnv: LINEAR_ACTIVE_REPOSITORY_TOKEN
      auth: personal-key # or oauth
      endpoint: https://api.linear.app/graphql
```

Treat repo-local configuration as non-secret metadata. Reject tracked credentials and redact token-shaped values in logs.

## Ordered request workflow

1. Classify the request as read, reversible write, destructive write, attachment operation, or diff/review operation. Reusable narrower workflows remain authoritative for their own domain; this skill supplies transport, profile selection, and proof requirements.
2. Build one GraphQL operation with variables and a minimal selection set. Use introspection only when the current schema or mutation input is unknown; do not rely on stale generated types.
3. POST JSON `{query, variables, operationName}` to the selected endpoint with the selected auth header and `Content-Type: application/json`.
4. Check HTTP status, rate-limit headers, transport failures, and the response `errors` array before treating `data` as successful. GraphQL may return partial data with errors. For mutations also require the mutation payload's `success` field and a returned stable ID where applicable.
5. Paginate connection fields with the server's cursor (`pageInfo.hasNextPage` and `endCursor`), continuing with `after: endCursor` while preserving filters and ordering. Never fetch an unbounded collection or fetch all records merely to filter locally. Use `includeArchived` only when requested or necessary to explain absence.
6. For writes, re-read the changed entity or mutation payload and report the exact stable ID, operation result, and selected fields. For destructive or externally visible actions, require explicit user intent and stop before execution if target, scope, authorization, or current state is ambiguous.
7. Return a redacted proof bundle: profile name (not credential), endpoint host, operation name, target IDs, pagination count/cursor status, mutation success, returned IDs, and sanitized errors. Do not return full issue descriptions, transcripts, source files, environment variables, credentials, or diff bodies unless the user explicitly requested that content and the direct-device privacy boundary permits it.

## Operation coverage

The complete mounted Linear MCP surface is represented in `references/operation-catalog.md`. Use that catalog to choose query/mutation families rather than inventing a second command vocabulary. Coverage includes discovery, issue/workflow, collaboration/content, attachments/assets, review/delivery, and workspace administration operations.

## Failure and recovery rules

- **401/403 or missing scope:** stop; identify the profile, required permission/scope, and target without exposing the token. Do not retry with a different credential unless the user selected that profile.
- **Rate limit:** Linear may return HTTP 400 with `errors[].extensions.code == "RATELIMITED"`. Treat that code as throttling, not query validation. Honor `X-RateLimit-Requests-Reset`, `X-RateLimit-Endpoint-Reset`, and `X-RateLimit-Complexity-Reset` when present; use bounded backoff only for idempotent reads and do not blindly retry mutations. Report the reset source and attempts without exposing headers that contain secrets.
- **5xx/network/timeout:** retry idempotent reads at most twice with bounded backoff; re-read after an uncertain mutation instead of repeating it. Stop with the last sanitized response.
- **GraphQL validation/partial error:** preserve the operation name, error path/code/message, and any safe partial IDs; correct the query or ask for the missing field rather than assuming success.
- **Concurrent state change:** re-read before a state-dependent mutation. If the expected version/state no longer matches, stop for review rather than overwriting.
- **Attachment/image access:** GraphQL control operations use the configured API endpoint, but upload/download/image URLs must be returned by Linear and must use HTTPS on an allowlisted Linear storage host such as `uploads.linear.app`. Preserve authentication, reject arbitrary hosts and user-supplied redirects, do not publish authenticated asset URLs, and download/self-host only when explicitly requested and permitted.
- **Unknown or ambiguous action:** classify as high risk; require in-app review and host-side revalidation. Stop rather than guessing.

## Completion and stop condition

Done means the requested operation is verified by the proof bundle and no secret or restricted body crossed the managed-service boundary. Stop when the request succeeds, when a safe retry budget is exhausted, when permissions/configuration/target identity is unresolved, or when the result contains unhandled GraphQL errors. Report the blocker and the smallest evidence needed to continue; never claim a mutation succeeded from HTTP 200 alone.
