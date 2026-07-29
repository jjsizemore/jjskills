---
name: generating-secure-release-notes
description: Create public-facing release notes that balance transparency with security and compliance
type: workflow
---

# Generating Secure Public Release Notes

**Trigger:** When creating release notes, patch notes, changelog entries, or public deployment announcements for end users or external stakeholders.

## Purpose

Generate release documentation that builds user trust through clarity and transparency while protecting security posture, customer data, compliance status, and operational integrity. Public release notes are your communication contract with users — inaccurate, misleading, or overly vague notes erode confidence.

## Workflow

### Phase 1: Gather & Validate Source Material

1. **Collect the scope:**
   - Git commits/pull requests in the release (tags, branch diffs)
   - Issue tracking (Linear, GitHub Issues) — link tickets to changes
   - Breaking changes or migrations users must action
   - Database schema changes affecting stored data
   - Deprecated features, sunset dates, and deprecation periods
   - New dependencies, version bumps, license changes
   - Security patches (CVSS severity, affected versions, workarounds)
   - Performance improvements, benchmarks, or tuning notes
   - API contract changes (tRPC inputs/outputs, REST endpoint routes)

   **Scope discovery in monorepos:** When a repo has multiple independently-versioned packages (e.g., `backend-v0.16.0-staging.5`, `desktop-v0.19.0-staging.5`), determine the correct base reference:
   - For a specific package's release notes: use the last production tag for that package (`backend-v0.16.0` → `backend-v0.16.0-staging.5`)
   - For a unified release: collect across all package ranges
   - Distinguish "since last staging" (what's new in this iteration) vs "since last prod" (full staging scope). Staging iterations often contain only 1-2 commits on top of a larger batch — clarify with the user which scope they want.

2. **Mine commit messages for user-visible impact:**
   - Use `git log <range> --format="%B" --no-patch` to dump full commit bodies for batch review
   - Commit messages with `chore:`, `ci:`, `refactor:` prefixes typically have zero user-visible impact — exclude unless they affect behavior
   - `fix:` and `feat:` prefixes are candidates — verify the body describes user-facing change, not just internal plumbing
   - `fix(release):` or `chore(release):` commits often only affect CI/CD and should be excluded from public notes
   - When a commit body references internal ticket codes (e.g., "Closes #1402"), the ticket may contain additional user context — but don't expose ticket numbers in public notes

3. **Identify sensitive material to exclude:**
   - Internal metrics, thresholds, or operational details
   - Third-party integration keys, credentials, or undocumented API patterns
   - Infrastructure changes that don't affect end users (deployment platform, CI/CD tooling)
   - Bug fixes for vulnerabilities not yet disclosed (wait for embargo period)
   - Internal refactoring that has zero user-visible impact (code simplifications, perf tuning internals)
   - Debugging signals or log formats (internal observability details)
   - Postmortem findings not yet remediated or disclosed
   - Business metrics, user counts, or SLA compliance data
   - Roadmap items or future capability hints (unless already public)

4. **Separate by user impact:**
   - **Required actions** — migrations, deprecations, auth changes (highlight clearly)
   - **New capabilities** — features, APIs, integrations (use short, user-focused language)
   - **Bug fixes** — group by subsystem (desktop, backend, web, etc.)
   - **Security fixes** — severity, CVSS, remediation steps (may warrant separate advisory)
   - **Performance** — specific improvements (faster query responses, lower latency)
   - **Infrastructure / internals** — typically omitted unless it affects availability or billing

### Phase 2: Write User-Focused Descriptions

Each change should answer: **What changed? Why does it matter to me? What do I need to do?**

**✅ Good patterns:**
```
### Desktop Audio Capture Improvements
- Fixed system audio gauge stuck at 0% on macOS Sequoia 15.0+ (resolves SV-X)
- Added microphone fallback when system audio becomes unavailable mid-meeting
- Users: Restart the desktop app to pick up the fix; no configuration needed

### Backward-Compatible API Change
- Added optional `includeTranscript=true` query param to `/meetings/{id}/summary` endpoint
- Existing clients: No action required; defaults to current behavior
- New feature: Pass `includeTranscript=true` to receive full transcript in summary response
```

**❌ Avoid:**
```
- Fixed race condition in realTimeDataPipelineOrchestrator.ts
- Updated vector search threshold from 0.72 to 0.68
- Refactored transcript chunking logic
- Docker image updated to Ubuntu 24.04 LTS
```

### Phase 3: Security & Compliance Review

**Before publishing, validate:**

- [ ] **No credentials exposed** — No API keys, connection strings, auth tokens, or internal URLs
- [ ] **No internal paths** — `src/services/foo.ts`, `backend/database/migrations/`, build artifacts
- [ ] **No unpatched CVEs named** — Never mention a CVE by number before the patch is available
- [ ] **No customer data references** — No specific deployment counts, account names, or user metrics
- [ ] **No operational fingerprints** — No version numbers of internal tools (Postgres, Redis, Kafka versions are internal)
- [ ] **No inference attack risks** — Feature hints shouldn't leak roadmap priorities or financial decisions
- [ ] **Compliance language accurate** — SOC 2, HIPAA, GDPR claims must match actual implementation
- [ ] **Third-party service names correct** — Don't misattribute fixes to the wrong provider (e.g., "OpenAI API rate limiting" when you meant Anthropic)
- [ ] **No blame language** — Avoid "we discovered a bug in X's library" (blame third parties privately if at all)
- [ ] **Deprecation periods clear** — "Deprecated in v1.5; removed in v1.7" gives users a timeline

### Phase 4: Structure & Format

**Recommended structure (can vary by product):**

For staging/preview releases, add a "(Staging Preview)" label and note that features may be gated:

```markdown
# Release Notes — vX.Y.Z (YYYY-MM-DD)

## 🎉 New Features
- Brief user-focused description
- Link to docs if needed
```

**Header variants by release type:**
- Production: `# Release Notes — vX.Y.Z (YYYY-MM-DD)`
- Staging/Preview: `# Release Notes — vX.Y.Z Staging Preview (YYYY-MM-DD)`
- Multi-package monorepo: List affected packages below the header
## 🔒 Security Fixes
- CVE-YYYY-XXXXX: Description (CVSS X.X)
- Action users must take (if any)

## 🐛 Bug Fixes
- **Category**: Description (e.g., "Desktop audio capture fixed for macOS Sequoia")
- How to access the fix (restart, update, etc.)

## 📈 Performance
- Query latency: X% faster
- Widget rendering: Y ms → Z ms

## ⚠️ Deprecations & Breaking Changes
- **Removed**: Feature X (deprecated in vN.M, removed in vN.O)
- **Migration**: How to upgrade / what to do instead

## 📚 For Developers
- New tRPC routes or API changes
- Database schema changes (if affecting integrations)
- Dependency updates (major versions only)

## 🙏 Contributors
- Acknowledge external contributors by name/GitHub handle (with permission)
```

### Phase 5: Validation Checklist

Before pushing to public:

- [ ] Each change has a user-visible impact (not just internal cleanup)
- [ ] No sensitive information remains (re-read once)
- [ ] Tone is professional and jargon-free (read aloud; test with a non-technical person)
- [ ] Migration steps are actionable (provide code examples if needed)
- [ ] Breaking changes are flagged prominently and early
- [ ] Security fixes reference CVE, CVSS, and remediation clearly
- [ ] Deprecation timelines are explicit (version + date window)
- [ ] Links are correct and don't leak internal infrastructure
- [ ] Spelling, grammar, and formatting are consistent
- [ ] Release version matches your version control tag
- [ ] Date is accurate (time zone aware if global)
- [ ] If multi-package (monorepo), clarify which package(s) affected

### Phase 6: Post-Publish Monitoring

- **Deployment evidence:** Tag the commit/branch in git; pin the release artifacts
- **User communication:** Post to blog, email, Slack, Discord (with platform-appropriate tone)
- **Observability:** Monitor incoming support tickets for confusion; update notes if critical misunderstandings emerge
- **Feedback loop:** If users consistently ask "why was X changed?", that's a signal your notes were too terse

## Context: What Makes Secure Release Notes

**Transparency without operational risk:**
- Users trust you to tell the truth, so be honest about what changed
- Users don't need to know internal decision-making, but they do need to know how to act
- Security fixes should be clear on severity and remediation (no mysterious "we patched something")
- Deprecations need timeline clarity so users can plan their own upgrades

**Information asymmetry is intentional:**
- Your infrastructure choices (Neon, Redis, Kafka versions) are deployment details; don't expose them
- Internal performance metrics help you, not users; share user-visible metrics instead (latency improvements, feature speed)
- Third-party integrations: name the service, never expose the API contract or implementation
- Roadmap hints should be minimal (avoid "we're building X" unless you're confident you'll ship it)

**Compliance & legal considerations:**
- Security advisories may need embargo periods; coordinate with security/legal before publishing
- Data handling changes (GDPR, HIPAA) must be accurate; vague language invites audit risk
- Third-party attribution: credit accurately, don't blame (privately escalate vendor issues)

## Examples

### ✅ Security Fix (Good — with CVE)

```
### Security
- **CVE-2025-1234**: Fixed SQL injection in meeting search endpoint (CVSS 7.5 - High)
  - Affected versions: v1.2.0 — v1.2.3
  - Remediation: Update to v1.2.4 or later immediately
  - No known exploitation in the wild; no user data was affected
  - Thank you to [researcher name] for responsible disclosure
```

### ✅ Security Fix (Good — without CVE)

When a security fix has no CVE assigned, describe by impact area:

```
### Security
- **Speaker Identity Service Hardening**: Resolved tenant injection
  vulnerabilities and cross-tenant profile injection. Users can now
  only initiate erasure of their own voice biometric data.
  - Remediation: Update to the latest version; no user action required
```

### ✅ Monorepo Staging Notes (Good)

For monorepos with independently-versioned packages, note which packages are affected:

```
These release notes cover:
- **Backend**: v0.16.0-staging.5 (1 commit since v0.16.0)
- **Desktop**: v0.19.0-staging.5 (50 commits since v0.18.0)
```

When a staging iteration contains only release-infrastructure commits (e.g., wiring a new env var into the deploy pipeline), it's acceptable to produce minimal or empty notes for that iteration — don't fabricate user-visible impact.

### ✅ Breaking Change (Good)

```
### Breaking Changes
- **Removed**: Deprecated `?includeRaw` query parameter on `/summary` endpoint
  - Was deprecated in v1.1.0; removed in v1.3.0
  - **Migrate**: Use `?format=detailed` instead (available since v1.1.0)
  - Affected: <1% of API consumers; migration takes ~5 minutes
```

### ✅ New Feature (Good)

```
### New Features
- **Transcript export formats**: Download meeting transcripts as Markdown, JSON, or CSV
  - Available in Settings → Downloads after each meeting
  - Supports filtering by speaker, time range, or keyword
  - [Learn more](https://docs.example.com/export-transcripts)
```

### ❌ Internal Refactor (Bad — Don't Include)

```
- Refactored RealTimeDataPipelineOrchestrator to use async iterators
- Updated vector search threshold from 0.72 to 0.68
- Migrated from Socket.IO to native WebSocket
```
*None of these have user-visible impact; they're internal cleanup.*

### ❌ Vague Security Note (Bad)

```
- Fixed a security issue in authentication
```
*Users can't assess risk or decide whether to update.*

### ❌ Operational Details Exposed (Bad)

```
- Upgraded Postgres from 15.4 to 16.1 for performance
- Added new Redis cluster in us-west-2 for cache failover
- OpenAI API rate limit bypass implemented for batch requests
```
*Users don't need this; it leaks infrastructure details.*

## Related Guidance

- **Security disclosure coordination**: Work with security team before naming CVEs or vulnerabilities
- **Legal review**: Data handling, compliance claims, third-party attributions
- **Product context**: Link release notes to a shipping checklist or release plan (if available)
- **Internationalization**: If supporting multiple languages, translate notes carefully; don't auto-translate security advisories
- **Monorepo staging releases**: See `references/monorepo-staging-release-discovery.md` for scope discovery technique (independently-versioned packages, iterating staging tags)
