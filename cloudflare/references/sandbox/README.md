# Cloudflare Sandbox — current stable

Use [sandbox-stable](../../../sandbox-stable/SKILL.md) for the current package and native Durable Object Container API. Verified snapshot: @cloudflare/sandbox 1.0.1, with sandbox-shim copied from docker.io/cloudflare/sandbox:1.0.1 into an application-owned linux/amd64 image.

## Architecture

- Your class extends DurableObject from cloudflare:workers; it owns state, identity, lifetime and routing.
- this.ctx.container starts the configured image and runs argv commands. output() returns byte buffers and exitCode.
- Files, S3Mount and DirectoryBackup are package helpers; they do not start the container.
- Tenant authentication, path/command authorization, live credentials and recovery policy belong to the application, not an assumed package Sandbox class.

## Reading order

1. [Current stable guide](../../../sandbox-stable/SKILL.md): exact package/image/configuration and a typed example.
2. [Official package reference](https://developers.cloudflare.com/sandbox/reference/) and [Container API](https://developers.cloudflare.com/containers/api/durable-object-container/).
3. [Current stable quick reference](../../../sandbox-next/references/api-quick-ref.md) and [immutable example index](../../../sandbox-next/references/examples.md).
4. [Legacy migration](../../../sandbox-migrate-to-next/SKILL.md) when an existing 0.x or historical preview application must move under explicit authority.

## Version boundary

The current stable package does not provide legacy getSandbox/Sandbox/proxyToSandbox/session/interpreter convenience exports. Historical npm @next 0.13.0-next.776.1 really did have a different preview API; the label does not mean today's stable package. Do not combine its examples or the old 0.7.0 full runtime image with 1.x helpers. The sibling configuration/api/pattern/gotchas files in this old vendor tree are legacy material: current official docs and the selected stable guide override them; this focused change does not silently rewrite that frozen tree.

## Safety and verification

Use explicit argv and environment, keep secrets in the Worker, and apply outbound/path policy. A running container is not service readiness, a deploy is not proof of instance replacement, and a typecheck is not a runtime smoke. Before any authorized migration, read the one-way scheduling-policy warning and data-preservation procedure in the [official migration plan](https://developers.cloudflare.com/sandbox/sdk/migrate/plan-the-move/). This index authorizes no deployment or resource cleanup.
