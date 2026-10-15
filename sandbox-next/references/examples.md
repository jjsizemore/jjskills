# Current stable examples and provenance

This directory once indexed the next branch. Current stable guidance must not resolve a moving historical preview link as if its APIs were unchanged.

Verified package: @cloudflare/sandbox 1.0.1. Helper image: docker.io/cloudflare/sandbox:1.0.1. Official example repository snapshot (unambiguous short commit): a080a659c5007b7e.

| Need | Verified source |
| --- | --- |
| Minimal stable Worker, Files and container lifetime | [minimal example](https://github.com/cloudflare/sandbox-sdk/tree/a080a659c5007b7e/examples/minimal) |
| Exact Worker source | [minimal/src/index.ts](https://github.com/cloudflare/sandbox-sdk/blob/a080a659c5007b7e/examples/minimal/src/index.ts) |
| Initial native Linux command | [official get started](https://developers.cloudflare.com/sandbox/get-started/) |
| Package/helper requirements and complete image/config | [current package reference](https://developers.cloudflare.com/sandbox/reference/) |
| Process execution/stdin/signals | [Container API](https://developers.cloudflare.com/containers/api/durable-object-container/) |
| Move existing SDK 0.x behavior | [migration API map](https://developers.cloudflare.com/sandbox/sdk/migrate/api-map/) |

Read the example's package.json, lockfile, Dockerfile and Wrangler configuration together before copying it. Preserve its authentication/path controls or adapt them to the application's authorized boundary; a sandbox name is not an ownership check. The minimal example demonstrates routing, not a license to expose arbitrary commands publicly.

A documentation/typecheck pass is not a deployment or Linux runtime result. Use local Docker or an authorized staging environment for actual command/file/network tests; do not create cloud resources merely to validate a skill draft.
