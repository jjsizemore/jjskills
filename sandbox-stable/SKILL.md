---
name: sandbox-stable
description: Use when building or changing Cloudflare Linux sandboxes with the current stable @cloudflare/sandbox 1.x helpers and Durable Object Container API. Not for maintaining legacy SDK 0.x or historical @next releases without an explicit migration.
---

# Sandbox — current stable 1.x

Retrieve [current package docs](https://developers.cloudflare.com/sandbox/reference/) and the [Container API](https://developers.cloudflare.com/containers/api/durable-object-container/) before implementation. Installed types and the lockfile win over this snapshot.

## Package and image gate

Verified snapshot: npm latest **1.0.1**; helper image **docker.io/cloudflare/sandbox:1.0.1**. Pin the package and copy the helper from the same version. The package supplies Files, S3Mount and DirectoryBackup; it does not own container lifetime or export the old Sandbox/getSandbox interface.

```sh
npm install --save-exact @cloudflare/sandbox@1.0.1
```

Use your own linux/amd64 base image. The matching image below is a helper-binary source, not the old all-in-one runtime:

```dockerfile
FROM node:24-trixie-slim
COPY --from=docker.io/cloudflare/sandbox:1.0.1 /usr/local/bin/sandbox-shim /usr/local/bin/sandbox-shim
RUN mkdir -p /workspace
CMD ["sleep", "infinity"]
```

Enable nodejs_compat and configure a Durable Object-managed image. Use today's compatibility_date in the real configuration:

```jsonc
{
  "compatibility_date": "2026-10-15",
  "compatibility_flags": ["nodejs_compat"],
  "containers": [{
    "class_name": "Workspace",
    "scheduling_policy": "durable_object",
    "images": {"workspace": {"dockerfile": "./Dockerfile"}}
  }],
  "durable_objects": {"bindings": [{"class_name": "Workspace", "name": "WORKSPACES"}]},
  "exports": {"Workspace": {"type": "durable-object", "storage": "sqlite"}}
}
```

Generate binding/platform types with the project's Wrangler. Add this concrete RPC method to the authorized Worker; it runs a fixed command, not untrusted request text:

```ts
import { Files } from "@cloudflare/sandbox";
import { DurableObject } from "cloudflare:workers";

export class Workspace extends DurableObject {
  async runNode() {
    const container = this.ctx.container;
    if (!container) throw new Error("Container binding is not configured");
    if (!container.running) {
      container.start({image: container.images.workspace, enableInternet: false});
      await container.setInactivityTimeout(600_000);
    }
    const files = new Files(container);
    await files.mkdir("/workspace", {recursive: true});
    await files.writeFile("/workspace/check.txt", "stable sandbox\n");
    const process = await container.exec(["node", "-e", "console.log(2 + 2)"], {cwd: "/workspace"});
    const output = await process.output();
    return {
      stdout: new TextDecoder().decode(output.stdout),
      stderr: new TextDecoder().decode(output.stderr),
      exitCode: output.exitCode,
    };
  }
}
```

Call the class through the generated WORKSPACES namespace and an application-authorized name. A name is not authorization; enforce authentication, ownership and path/argv policy at the public boundary. Restore the inactivity timeout in the constructor when an existing running container survives a Durable Object restart; the [full official example](https://developers.cloudflare.com/sandbox/reference/) shows that lifecycle path.

## Contracts

- container.start() returns before readiness. container.exec(argv) waits for a starting container but does not start a stopped one.
- exec uses argv, not shell syntax. Run an explicit shell only when needed and never interpolate untrusted input.
- ExecProcess.output() is consumed once and returns ArrayBuffer stdout/stderr plus exitCode. Decode bytes; nonzero exit is a result, not an exception.
- stdin can be piped. An exec AbortSignal sends SIGKILL; do not reuse historical preview wait-only cancellation assumptions.
- exec env does not inherit start env except PATH. Pass cwd/env explicitly. Keep live credentials in the Worker and use scoped outbound handlers.
- Files follows Linux paths, including symlinks; it is not a tenant filesystem jail. Validate authorized paths in the application.
- Running is not readiness. Use the official lifecycle/monitor/readiness procedure, and handle interruption without blanket retries.
- Durable Object-managed deploys do not automatically replace running instances. Do not force immediate container rollout based on old preview advice.

## Retrieve by task

| Need | Source |
| --- | --- |
| Process handles/stdin/cancellation/lifetime | [Container API](https://developers.cloudflare.com/containers/api/durable-object-container/) |
| File reads/writes | [Files](https://developers.cloudflare.com/sandbox/reference/files/) |
| Mounts | [S3Mount](https://developers.cloudflare.com/sandbox/reference/s3-mounts/) |
| Directory backups | [DirectoryBackup](https://developers.cloudflare.com/sandbox/reference/directory-backups/) |
| Application lifetime | [Lifetime](https://developers.cloudflare.com/sandbox/concepts/lifetime/) |
| Secrets and outbound access | [Network](https://developers.cloudflare.com/sandbox/network/) |
| Move an existing 0.x app | [Migration](https://developers.cloudflare.com/sandbox/sdk/migrate/) and sandbox-migrate-to-next (historical directory name) |
| Verified examples and type shapes | [Examples](../sandbox-next/references/examples.md), [quick reference](../sandbox-next/references/api-quick-ref.md) |

## Proof before delivery

Typecheck against the exact package and current generated Workers types. When runtime execution is authorized and available, run the actual application in local Docker and verify command output, nonzero exit, file round-trip and interruption for its used surfaces. A typecheck does not prove a Linux container ran. Never deploy or write cloud resources merely to validate this guide.
