---
name: sandbox-next
description: Use when a request or lockfile names the historical Cloudflare Sandbox @next preview line, so package provenance is established before applying current stable guidance. Not a recommendation to install @next for current work.
---

# Historical @next lineage and current stable routing

The directory name records the former preview guide; it does not define today's API. For current work, load [sandbox-stable](../sandbox-stable/SKILL.md).

## Resolve the actual line

1. Inspect package.json, lockfile, image and installed exports. Resolve npm dist-tags afresh when a tag is involved.
2. At this verified snapshot, latest is 1.0.1, while next is 0.13.0-next.776.1. The historical preview really did export getSandbox/Sandbox and an interpreter subpath; do not claim those APIs never existed.
3. Current stable 1.x instead uses your DurableObject class, ctx.container, and the Files/S3Mount/DirectoryBackup helpers. Do not combine preview code with stable types or assume a redirected old preview URL still documents that package.
4. If the user explicitly wants to maintain a historical preview app, retain its exact lockfile/image and obtain matching release documentation and source. Do not silently upgrade it or invent wrappers to emulate removed APIs.
5. If moving to current stable is authorized, use [the migration guide](../sandbox-migrate-to-next/SKILL.md); do not change a dependency to @next merely because this directory says next.

The local [quick reference](references/api-quick-ref.md) and [example index](references/examples.md) now describe the selected current stable line and explicitly identify their provenance. They are not historical-preview API references.
