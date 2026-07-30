---
agent: task-router-syncvia
description: 'Inspect a completed feature and route it to the correct UAT flow or flows before merge or release'
argument-hint: 'Describe the feature, PR, branch, or changed files so the right post-implementation UAT sequence can be selected'
---

# Feature → UAT Routing

## Task

Inspect the completed feature work and determine **which UAT flow or flows must run next**, in what order, and with what launch/runtime notes.

This prompt exists to prevent a feature from stopping at “code is done” without the correct post-implementation validation. Route only the UAT flows that materially protect release confidence for the surfaces that actually changed.

## Inputs

- **Feature summary:** `${input:featureSummary:Describe the feature, bug fix, or release slice that just finished}`
- **Changed files / surfaces (optional):** `${input:changedFiles:List key files, folders, PR number, or branch name if known}`
- **Release context (optional):** `${input:releaseContext:Is this pre-merge, pre-release, hotfix verification, or commit-range regression localization?}`

## Verified Routing Goal

Choose the smallest correct UAT set based on the affected surface:

- **Desktop renderer / main / packaged app / audio capture / onboarding / release packaging**
  - Route to desktop-focused UAT and release signoff flows.
- **Frontend public auth/legal / signup / privacy / terms / onboarding**
  - Route to browser-based public-surface UAT.
- **Backend API / service / schema / export / auth behavior**
  - Route to API or cross-surface regression validation, usually through commit-range UAT when release confidence or regression localization matters.
- **Cross-stack or ambiguous work**
  - Route the required surface-specific UATs in sequence, not all possible flows.

## Primary Routing Rules

### Use `legal-surface-uat-signoff.prompt.md` when

- the feature changes:
  - `frontend/src/pages/SignupPage.tsx`
  - `frontend/src/pages/PrivacyPolicyPage.tsx`
  - `frontend/src/pages/TermsOfServicePage.tsx`
  - public auth/legal copy, route access, or legal-surface UX
- and the goal is final browser signoff for those public pages.

### Use `running-commit-range-uat.prompt.md` when

- you need regression localization across commits,
- you want release-confidence evidence for a feature slice,
- or the work changed runtime behavior that needs the **same UAT checklist repeated** across a commit range.

### Use `running-commit-range-uat-rehearsal-signoff.prompt.md` when

- the runner/workflow itself needs final proof,
- or the release train wants one last end-to-end confidence pass using a small real commit range.

### Use specialized desktop validation alongside UAT when

- packaged app, updater, permissions, or release artifact behavior changed.
- Reference the existing desktop commands where relevant:
  - `pnpm --dir desktop validate:pack`
  - `pnpm --dir desktop validate:uat`
  - `pnpm --dir desktop validate:uat:no-login`

## Requirements

### Must Have

- Verify the feature’s dominant surface from the described files, branch, or summary before routing.
- Recommend only the UAT flows that are actually relevant.
- Provide the **execution order**, not just a list.
- Include any critical runtime notes such as URLs, services, credentials, or packaged-app prerequisites.
- Distinguish:
  - **required before merge/release**
  - **recommended if time allows**
  - **not needed for this feature**

### Explicitly Out of Scope

- implementing the feature itself
- running unrelated UAT flows for untouched surfaces
- turning targeted UAT routing into a giant release checklist when the work is narrow

## Expected Output Format

Return your answer in this order:

1. **Feature surface classification**
   - desktop / frontend public auth/legal / backend / cross-stack / release-packaging
2. **Required UAT flow order**
   - exact prompt(s) or command(s) to run next
3. **Why each flow is required**
4. **Runtime notes / prerequisites**
5. **Anything that can be skipped for this feature**

## Example

### Input

- `featureSummary`: `Finished the signup and legal copy hardening work for public beta onboarding.`
- `changedFiles`: `frontend/src/pages/SignupPage.tsx, frontend/src/pages/PrivacyPolicyPage.tsx, frontend/src/pages/TermsOfServicePage.tsx`
- `releaseContext`: `pre-release`

### Expected Outcome

- classify the feature as **frontend public auth/legal**
- route first to `legal-surface-uat-signoff.prompt.md`
- add `running-commit-range-uat.prompt.md` only if commit-range regression confidence is also needed for the release
- note that desktop packaged-app UAT is **not required** for this narrow feature unless the same release also includes desktop changes

## Success Criteria

- The routed UAT sequence matches the surfaces that actually changed.
- The output is concise enough for an operator to run immediately.
- Irrelevant UAT flows are excluded rather than dumped into the checklist.
- The result makes post-feature validation routing obvious before merge or release.
