# Current stable 1.x API quick reference

Historical file location; this is **not** the old @next contract. Verified package 1.0.1; [official Container API](https://developers.cloudflare.com/containers/api/durable-object-container/) and installed types are authoritative.

## Ownership

Your DurableObject class owns identity, state and container lifetime. The package helpers Files, S3Mount and DirectoryBackup operate on a running container. No getSandbox/Sandbox/proxyToSandbox export is assumed.

## Native process surface

```ts
async function command(container: Container) {
  if (!container.running) throw new Error("Container is stopped");
  const process = await container.exec(["node", "--version"], {cwd: "/workspace"});
  const output = await process.output();
  return {stdout: new TextDecoder().decode(output.stdout), exitCode: output.exitCode};
}
```

- start({image, enableInternet}) is synchronous validation/startup, not readiness.
- exec(argv, {cwd, env, stdin, stdout, stderr, user, signal, pty}) resolves to ExecProcess; output() returns bytes once.
- process.exitCode is a Promise<number>; process.kill(signal?) returns void. Do not await it as proof of process exit.
- Native exec stdin can be piped. AbortSignal kills the process; historical preview timeout/wait semantics are not transferable.
- user requires numeric uid:gid. Under durable_object scheduling it does not form a security boundary: process capabilities remain root-equivalent.
- Environment is explicit per exec except inherited PATH. No implicit shell, session, or inherited working directory.

## Files helper

```ts
import { Files } from "@cloudflare/sandbox";
async function roundTrip(container: Container) {
  const files = new Files(container);
  await files.mkdir("/workspace", {recursive: true});
  await files.writeFile("/workspace/check.txt", "ok");
  const response = await files.readFile("/workspace/check.txt");
  return response.text();
}
```

Files follows Linux symlinks; application code owns allowed-path policy. Writes can be partial on failure. For atomic replacement, write a separate file then rename after success. [Files API](https://developers.cloudflare.com/sandbox/reference/files/).

For [S3Mount](https://developers.cloudflare.com/sandbox/reference/s3-mounts/) and [DirectoryBackup](https://developers.cloudflare.com/sandbox/reference/directory-backups/), follow their complete gateway/credential/integrity requirements rather than inventing signatures. No package-level terminal/interpreter/session/preview convenience API is implied by these native primitives.
