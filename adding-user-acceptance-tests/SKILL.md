---
name: adding-user-acceptance-tests
description: >-
  Use when adding or strengthening user-acceptance tests that prove a
  user-visible journey crosses its real application boundaries and reaches a
  persisted or owned handoff outcome.
metadata:
  governing-skills-placement: user
  governing-skills-reason: Portable user-journey and boundary proof across repositories.
---

# Adding User Acceptance Tests

Create durable UATs that prove a user can enter a feature, complete its
meaningful action, receive clear feedback, and reach the intended product-owned
outcome. A component test, mocked preview, or single handler assertion is not a
UAT by itself.

## Activation Boundary

Use this skill when a user journey needs proof of complete wiring across a real
application boundary: desktop UI to a typed bridge and backend, frontend to an
API and service, authenticated persistence, an asynchronous handoff, or a
cross-surface recovery flow. Use it for new functionality, regressions, and
release-critical flows.

Do not use it for isolated utilities, visual-only snapshots, pure component
layout work, or a provider's delivery guarantee. Use unit/component coverage,
visual checks, or provider monitoring for those boundaries.

## Required Inputs

Before writing a test, state the user role, starting state, intent, visible
entry point, action, success result, failure result, recovery path, and
product-owned side effect. Discover the nearest repository instructions,
existing fixtures and harness, authentication setup, incident evidence, and
the current boundary implementation first.

If a graph index is available, use it as a map for the feature and action, then
confirm its nodes and edges against current source. Do not treat stale or
missing graph output as proof.

## Boundary Matrix

For every user action, record each relevant boundary and its proof:

| Boundary | Evidence | Status |
| --- | --- | --- |
| Visible entry and user action | Accessible control and user-visible state | covered / out of scope / unproven |
| Typed bridge or API | Real request/response and auth context | covered / out of scope / unproven |
| Service, repository, or persistence | Record, transaction, queue item, or owned state | covered / out of scope / unproven |
| External provider handoff | Controlled request or provider-owned event boundary | covered / out of scope / unproven |
| Failure and recovery | Actionable error, retry, and recovered state | covered / out of scope / unproven |

Choose the narrowest test tier that crosses every product-owned boundary. Mark
an unproven boundary explicitly; do not infer coverage from a neighboring test.

## Replayable TDD Evidence

For behavior-bearing UATs, compose `developing-with-tests` and preserve one
public vertical slice with immutable `testOnlyCheckpoint`, `red`,
`minimalGreen`, and `postGreenRefactor` commands, expected and actual exit
codes, output, and checkpoint SHAs. An immediately passing test requires an
`existing-guarantee` classification and a meaningful assertion gap.

Use independent user-visible expected values from the acceptance statement or
published contract. Do not calculate the expected value through the
implementation under test. For skill, documentation, CI, or configuration
changes, use a failing contract or pressure fixture RED followed by the
smallest passing GREEN fixture.

## Workflow

1. Read the nearest `AGENTS.md`, matching instructions, and existing harness.
   Compose `guarding-desktop-uat-regressions` for desktop coverage and
   `developing-with-tests` for behavior changes.
2. Write acceptance statements in user language. Assert visible confirmation,
   actionable failure feedback, recovery, and the product-owned side effect at
   the actual boundary rather than through implementation-private calls.
3. Write and run the UAT RED in the same harness users exercise. Record why it
   fails. Never weaken authorization, validation, privacy, retries, or error
   handling to make a UAT pass.
4. Add only deterministic setup and accessible, stable selectors needed for
   test coverage. Interact through the real user surface; do not call private
   component hooks or replace a real bridge with a browser-only preview.
5. Run GREEN, nearby regressions, and the required quality gates. Use
   `verifying-before-completion` to review the evidence from user, developer,
   and operator perspectives.

## Real Boundary Patterns

- For desktop flows, launch the real authenticated application through the
  repository's adapter, reset the session between tests, close the process,
  and prefer role, label, test-id, and visible-state selectors.
- For persisted backend flows, use a real transaction fixture and inspect the
  product-owned record, queue item, or public identifier after the user action.
- At an external provider boundary, use a controlled spy, fake, or captured
  request only where the provider is outside product ownership. Never send a
  real email, charge a payment method, or invoke a live third-party service
  without explicit task-scoped authority.
- Provider delivery after the owned handoff is a monitoring or webhook concern,
  not a falsely deterministic UAT guarantee.

## Stop Condition

Stop and report the exact blocker when the user journey, expected side effect,
required authentication, test environment, or external-provider authority is
unknown. Do not claim the feature is fully functional while any product-owned
boundary remains unproven. Do not run live provider calls or model-backed
pressure scenarios without explicit task-scoped consent.

## Deliverable

Return a concise UAT evidence bundle containing the user journey, boundary
matrix, test files and user-visible assertions, RED/GREEN results, immutable
TDD checkpoints, success/failure/recovery coverage, external-provider boundary,
evidence limits, remaining risks, and follow-up monitoring needs.

See [portable promotion pressure scenarios](../references/portable-user-scope-p1-p2-pressure-scenarios.md)
for the shared mock-only, missing-side-effect, live-provider, and recovery
pressure cases.
