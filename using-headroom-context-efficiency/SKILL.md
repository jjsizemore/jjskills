---
name: using-headroom-context-efficiency
description: >-
  Use when context or tool output is bloated, reusable compression is needed,
  or Headroom, RTK, audit-reads, or token efficiency is part of the task. Keep
  subscription-first routing and require explicit consent for BYOK or proxy use.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable per-session context and tool-output efficiency guidance.
---

# Using Headroom Context Efficiency

Reduce context waste while preserving enough source evidence to make correct
decisions. This skill is optional: normal work does not require Headroom or a
compression service.

## Activation Boundary

Use when a tool output is large and likely to be reused, context-window
pressure is suspected, the user asks about Headroom, RTK, token bloat,
compression, audit-reads, or learning, or an agent's read pattern needs
diagnosis.

Do not use compression as a substitute for targeted discovery, and do not
compress a one-shot result that will not be reused. Follow the nearest
repository `AGENTS.md` for repository-specific tools, scopes, and safety rules;
do not copy those instructions into this skill.

## Ordered Workflow

### 1. Reduce shell output first

Use `rtk` first for git, file, test, lint, build, and analysis commands when it
is available. Keep the command's scope narrow and preserve failure output. If a
repository or client provides a safer output reducer, follow its adapter
instructions rather than inventing a second wrapper.

### 2. Discover before compressing

Use targeted reads and existing code indexes before broad scans. If CodeGraph,
tokensave, or an equivalent index exists, use it as a map and confirm its
source against the current files. Compression can reduce context cost; it
cannot establish that a symbol, file, or dependency exists.

### 3. Compress only reusable output

When output is large enough to threaten the session budget and a later step
will reuse it, compress it into a hash-keyed slot through the available
Headroom adapter. Record the source path or query, source identity, scope, and
compression key. Keep secrets, credentials, and unapproved external data out
of the compressed output.

### 4. Retrieve and audit

Retrieve compressed output by its key when needed and confirm it is unchanged
for the source identity. If output is stale, unavailable, or from a different
branch/configuration, invalidate it and re-read the smallest authoritative
source. Use `audit-reads` or an equivalent read audit to find repeated large
reads and decide which ones merit reusable compression.

### 5. Route models subscription-first

The default context-efficiency order is:

1. `rtk` for bounded shell output;
2. tokensave, CodeGraph, or an equivalent local index for discovery;
3. Headroom compression and retrieval for reusable output;
4. provider-key, BYOK, or proxy routing only after explicit task-scoped
   consent.

Never route through a Headroom proxy or configure provider keys from an
implicit assumption that it will save context. If consent is absent, continue
with the subscription-friendly path or report the evidence limit.

## Composition

- `governing-shared-context` owns shared context scopes and durable sharing;
  this skill owns per-session compression and retrieval.
- Repository instructions own command wrappers, local indexes, and token
  budgets; this skill routes to them without duplicating their rules.
- `verifying-before-completion` owns evidence quality and completion claims;
  compressed output is evidence only when its source identity and retrieval
  are recorded.

## Stop Conditions

Stop and report the exact limit when the source cannot be re-read, the
compressed result is stale or unverifiable, a required index is unavailable,
or explicit BYOK/proxy consent is missing. Do not silently substitute stale
compressed output for current source or treat compression as discovery proof.

See [portable promotion pressure scenarios](../references/portable-user-scope-p1-p2-pressure-scenarios.md)
for stale-output, discovery-substitution, one-shot compression, and consent
pressure cases.
