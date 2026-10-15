# Workers VPC Connectivity

Connect Cloudflare Workers to private networks through explicit Workers VPC bindings.

## Overview

Workers VPC Network bindings route HTTP or plaintext TCP through a confirmed Cloudflare Tunnel or Mesh network. Raw `cloudflare:sockets` connections do not establish this private-network route.

Use `env.MY_VPC.fetch()` for HTTP and `await env.MY_VPC.connect()` for plaintext TCP. VPC Network `connect()` does not currently support TLS/StartTLS. Use the current [VPC documentation](https://developers.cloudflare.com/workers-vpc/configuration/vpc-networks/) for binding prerequisites and limits.

## Quick Decision: Which Technology?

Need private network connectivity from Workers?

| Requirement | Use | Why |
|------------|-----|-----|
| HTTP/HTTPS APIs in private network | VPC Services (beta, separate docs) | SSRF-safe, declarative bindings |
| PostgreSQL/MySQL databases | [Hyperdrive](../hyperdrive/) | Connection pooling, caching, optimized |
| Custom plaintext TCP protocols | VPC Network `connect()` | Explicit private network binding |
| Private HTTP services | VPC Network `fetch()` or VPC Services | Explicit routed binding |
| Expose on-prem to internet (inbound) | [Cloudflare Tunnel](../tunnel/) | Not Worker-specific |

## When to Use TCP Sockets

**Use TCP Sockets when you need:**
- ✅ Direct control over wire protocols (e.g., Postgres wire protocol, SSH, Redis RESP)
- ✅ Non-HTTP protocols (MQTT, SMTP, custom binary protocols)
- Plaintext TCP through a configured VPC Network binding; not TLS/StartTLS
- ✅ Streaming binary data over TCP

**Don't use TCP Sockets when:**
- ❌ You just need HTTP/HTTPS (use `fetch()` or VPC Services)
- ❌ You need PostgreSQL/MySQL (use Hyperdrive for pooling)
- ❌ You need WebSocket (use native Workers WebSocket)

## Quick Start

Configure a `vpc_networks` binding named `MY_VPC` for the confirmed Tunnel
(`tunnel_id`) or Mesh (`network_id: "cf1:network"`), with `remote: true`.
Generate `Env` from Wrangler. See the [VPC Networks configuration](https://developers.cloudflare.com/workers-vpc/configuration/vpc-networks/).

```typescript
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // VPC Network bindings currently support plaintext TCP only.
    const socket = await env.MY_VPC.connect("10.0.1.50:6379");
    const writer = socket.writable.getWriter();
    await writer.write(new TextEncoder().encode("PING\r\n"));
    await writer.close();
    return new Response(socket.readable);
  }
};
```

## Architecture Pattern: Workers + Tunnel

1. Configure a VPC Network binding to the confirmed Tunnel UUID or Mesh network.
2. The Worker calls that binding's `fetch()` or `connect()` with a private destination.
3. The binding routes through Tunnel/Mesh; a raw socket to a Tunnel hostname is not a substitute.

See [configuration.md](./configuration.md) for Tunnel setup details.

## Reading Order

1. **Start here (README.md)** - Overview and decision guide
2. **[api.md](./api.md)** - Socket interface, types, methods
3. **[configuration.md](./configuration.md)** - Wrangler setup, Tunnel integration
4. **[patterns.md](./patterns.md)** - Real-world examples (databases, protocols, error handling)
5. **[gotchas.md](./gotchas.md)** - Limits, blocked ports, common errors

## Key Limits

| Limit | Value |
|-------|-------|
| Max concurrent sockets per request | 6 |
| Blocked destinations | Cloudflare IPs, localhost, port 25 |
| Scope requirement | Must create in handler (not global) |

See [gotchas.md](./gotchas.md) for complete limits and troubleshooting.

## Best Practices

1. **Always close sockets** - Use try/finally blocks
2. **Validate destinations** - Prevent SSRF by allowlisting hosts
3. **Use Hyperdrive for databases** - Better performance than raw TCP
4. **Prefer fetch() for HTTP** - Only use TCP when necessary
5. **Combine with Smart Placement** - Reduce latency to private networks

## Related Technologies

- **[Hyperdrive](../hyperdrive/)** - PostgreSQL/MySQL with connection pooling
- **[Cloudflare Tunnel](../tunnel/)** - Secure private network access
- **[Smart Placement](../smart-placement/)** - Auto-locate Workers near backends
- **VPC Services (beta)** - HTTP-only service bindings with SSRF protection (separate docs)

## Reference

- [TCP Sockets API Documentation](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/)
- [Connect to databases guide](https://developers.cloudflare.com/workers/tutorials/connect-to-postgres/)
- [Cloudflare Tunnel setup](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
