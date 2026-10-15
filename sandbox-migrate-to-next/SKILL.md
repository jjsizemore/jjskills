---
name: sandbox-migrate-to-next
description: Use when migrating an explicitly authorized legacy Cloudflare Sandbox SDK 0.x or historical preview application to current stable 1.x. The historical directory name does not mean the target is npm @next.
---

# Migrate legacy Sandbox to current stable

Target: verified @cloudflare/sandbox 1.0.1, matching sandbox-shim helper image, and the Durable Object Container API. Read the [official migration](https://developers.cloudflare.com/sandbox/sdk/migrate/), [API map](https://developers.cloudflare.com/sandbox/sdk/migrate/api-map/) and [cutover plan](https://developers.cloudflare.com/sandbox/sdk/migrate/plan-the-move/).

## Preserve authority and data first

- Inventory installed package/image, APIs in use, Durable Object class/storage, running commands, terminals, alarms, preview URLs, mounts and backup handles. Preserve a full before-state and matching tests.
- The official 0.x migration compares 0.12. If an older app requires that bridge step, use the documented package/image 0.12.10 prerequisite before moving; it is not the new stable target.
- Do not treat a historical @next release as identical to 0.12. Match its actual APIs to current types and the official feature-specific migration pages.
- Choose in-place versus side-by-side migration from actual lifetime/data needs. Rehearse on a separate staging Worker only when that environment is authorized.
- Switching a class to scheduling_policy durable_object is a one-way deploy: rollback to 0.x cannot restore container-start behavior. User agreement to the actual cutover/data impact is required; a docs-only assignment authorizes none of it.

## Map behavior, not names

| Old surface | Current stable replacement |
| --- | --- |
| Package Sandbox class/export and getSandbox | Your class extends DurableObject; resolve it with the generated namespace getByName |
| String exec / buffered stdout | container.exec(argv), then process.output(); decode ArrayBuffers and inspect exitCode |
| Sessions / retained cwd or env | Explicit cwd/env per exec; application-owned state where necessary |
| Old readFile/writeFile/listFiles | Files; readFile returns Response, readDirectory is one level |
| startProcess/handle logs/waits | Application-owned durable process state and the official background-process pattern, not invented package methods |
| Preview URLs/proxyToSandbox | Application routing and the official preview migration; preserve authorization/tokens when required |
| terminal/SandboxAddon | Official tmux/WebSocket pattern; not a current createTerminal package export |
| Interpreter extension/runCode | Explicit IPython kernel or Dynamic Worker pattern from the migration docs |
| mountBucket/createBackup | S3Mount/DirectoryBackup plus their gateways, storage and integrity requirements |

## Ordered implementation

1. Write the DurableObject class and native lifecycle, using [current stable setup](../sandbox-stable/SKILL.md). Pin the package and helper image together; use your own linux/amd64 base image and nodejs_compat.
2. Replace only APIs the app actually uses using the [full API map](https://developers.cloudflare.com/sandbox/sdk/migrate/api-map/). Preserve public application contracts or explicitly migrate each caller. Do not add compatibility aliases for removed package exports.
3. Drain or pause writers before the final backup, then record the backup identity, integrity digest, source paths and relevant permissions. Before any restore, preview the resolved destination and replacement paths. Rehearse only in an isolated disposable container with an explicit destination, never the live default directory; timestamp and record a pre-overwrite backup for any destination that already exists. Compare recovered content and permissions against the source before the one-way scheduling-policy switch. Retain the original backup and deterministic recovery steps: restore the recorded pre-overwrite backup to the exact destination, rerun parity checks, and report any remaining failure. Handle old alarms and reconnecting clients; files and process IDs do not magically migrate.
4. Typecheck and run the real authorized staging application: success/nonzero exit, file round-trip, interruption, and its used terminal/preview/network/storage behavior. Bind observations to the artifact/package/image, not caller claims.
5. Deploy only under the assigned environment/cutover authority and current official procedure. Do not carry over a blanket --containers-rollout=immediate instruction: a deploy under the new policy keeps running instances, while the 0.x policy transition has separate one-way consequences. Gradual deployment cannot mix incompatible class configurations; the documented side-by-side option uses distinct classes.
6. Verify the actual runtime and preserved data. Before retiring anything, produce a read-only cleanup preview listing the resolved account/environment, container application IDs, exact storage keys and intended deletions; match it against explicit cleanup authority and retained recovery records. Preserve those records after the operation. Never deleteAll or perform broad cleanup. No deploy/cleanup is implied by reading this skill.

Then use sandbox-stable. The original directory name is historical routing, not an SDK API alias or a preview installation instruction.
