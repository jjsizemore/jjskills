---
agent: desktop-uat-regression-syncvia
description: 'Add or harden desktop Electron UAT regression guards for user-visible workflows so incidents become repeatable automated protection'
argument-hint: 'Describe the desktop workflow/bug to guard, expected behavior, and any known flaky gates (auth/onboarding/permissions)'
---

# Add Desktop UAT Regression Guards

## Task

Implement or harden desktop Electron UAT regression guards for the provided workflow/incident so the failure becomes repeatable automated protection in `desktop/__tests__/electron/**`.

## Input

**Regression to guard**:
`${input:regressionScope:Describe the desktop user journey, bug/incident signature, and expected outcome}`

**Known reliability constraints** _(optional)_:
`${input:constraints:Onboarding/auth races, permission prompts, env requirements, or "none"}`

## Required Skill

Load and follow `.agents/skills/guarding-desktop-uat-regressions-syncvia/SKILL.md`.

## Implementation requirements

1. Reproduce or model the real user-visible failure mode first (RED).
2. Add the smallest robust Electron UAT guard that would have failed before the fix (GREEN).
3. Refactor selectors/fixtures to remove flake while keeping behavior assertions meaningful (REFACTOR).
4. Prefer authenticated runtime helpers (for example, `launchAuthenticatedElectronApp`) when flow scope requires it.
5. Handle known first-run or personalization gates explicitly when they can block deterministic execution.
6. Assert business outcomes (IDs/state changes/rendered success states), not only intermediate clicks.
7. If helper hardening is needed, keep changes minimal and compatible with existing Electron specs.

## Validation

Run the narrowest relevant validation first, then broader gates:

- Targeted Electron UAT spec(s) you changed
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test` (or justify narrower slice if full run is out-of-scope for this lane)

If failures occur, inspect `desktop/test-results/**` artifacts, fix root cause, and rerun until green.

## Expected output

- Updated/added Electron UAT spec(s)
- Any minimal helper improvements needed for stability
- Short verification report including:
  - guarded scenario
  - what flake/risk was removed
  - commands run
  - pass/fail results and artifact paths if failures occurred

## Success criteria

- Guard reliably covers the targeted real user workflow
- Test would fail without the intended behavior
- No brittle selectors or avoidable timing sleeps remain
- Validation gates pass for the touched scope
- No regressions introduced in test hygiene or helper maintainability
