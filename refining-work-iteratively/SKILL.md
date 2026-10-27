---
name: refining-work-iteratively
description: 'Use when explicitly refining an artifact, plan, spec, PR, feature, or fix through bounded evidence-based review and repair; stop when validated actionable findings are resolved.'
---

# Refining Work Iteratively

Use this skill when work needs to be made stronger by repeatedly reviewing it
skeptically, receiving the feedback rigorously, improving the work, and
reviewing the latest version again.

This is a loop controller. It does not replace domain review skills. It selects
the most relevant review skill, runs it in an antagonistic mode, routes the
result through the relevant receiving skill, and rechecks affected fixes until
validated actionable findings in the selected scope are resolved. A clean first
review is sufficient; do not schedule another pass merely to find something new.

## Required Sub-Skills

- Use the most specific available review skill for the work surface:
  `reviewing-prs`, `requesting-code-review`,
  `reviewing-implementation-specs`, `reviewing-implementation-plans`,
  `auditing-ux-intuition`, a security review skill, a reliability review skill,
  or another narrower domain review skill.
- Use the matching receiving skill for the feedback. For code, PR, or technical
  review comments, use `receiving-code-review`.
- Use `grill-me` when the user asks to be grilled, when acceptance criteria are
  ambiguous, or when a review finding depends on a product, risk, ownership, or
  tradeoff decision that cannot be answered from the work itself.
- If a narrower repo-local skill exists for the same loop, prefer it for
  repo-specific mechanics and keep this skill as the general process boundary.

## Canonical Authority

Apply the [portable autonomous completion contract](../references/autonomous-completion-contract.md)
for review capability, finding triage, proof tiers, evidence invalidators, and review convergence bounds.

## Initial Framing

Before the first review pass, identify:

1. The exact artifact or work version being refined.
2. The intended outcome and acceptance criteria.
3. The review skill that best matches the artifact.
4. The receiving skill or decision process for review findings.
5. The validation evidence that should prove accepted fixes.
6. Known constraints, rejected approaches, deferred work, and user-approved
   tradeoffs.
7. The review scope: default actionable issues, or nice-to-have polish included.

Do not start by asking generic questions if local files, issue text, tests,
review comments, product requirements, or prior decisions already answer them.
When intent is genuinely missing, use `grill-me`: ask one hard question at a
time, state the recommended answer, cite the evidence, and wait for the user's
decision.

## Antagonistic Review Pass

Run the selected review skill against acceptance criteria and concrete failure
modes. Ask for evidenced defects, allow “no actionable findings,” and do not
reward finding something on every pass.

The review prompt must include:

- The latest artifact, diff, plan, spec, PR, or output being reviewed.
- The intended outcome and explicit non-goals.
- Validation already run and any known limitations.
- Prior findings that were fixed, rejected with evidence, or deferred with
  rationale; optional/advisory deferral does not require user approval.
- The instruction to verify affected fixes and identify material regressions,
  without restating resolved/rejected findings unless new evidence shows the
  prior resolution is wrong.

Ask the reviewer to classify every finding as:

- **Blocking**: must be fixed before acceptance.
- **Advisory**: should be fixed if cheap or risk-reducing, but can be accepted
  with explicit rationale.
- **Nice-to-have**: improves polish, clarity, maintainability, or ergonomics,
  but is not required for acceptance under the default review scope.
- **Question**: a decision or missing fact blocks confident review.
- **No issue**: no new issue found within the selected review scope.

Every non-`No issue` finding in the selected review scope must include concrete
evidence, why it matters, and a specific remediation path. Investigate missing
facts directly. Reject unsupported feedback with rationale; rerun review only
when its coverage was insufficient for a specific material risk. A reviewer
question is not a user approval gate unless it identifies a genuinely missing
product decision, authority or access that available evidence cannot resolve.

## Review Scope

Use the contract's default actionable scope unless the user explicitly requests
polish-inclusive or exhaustive work. Record that selection in the existing
review evidence; do not expand the loop merely because another pass is cheap.

## Receive And Improve

For each finding, apply the relevant receiving skill before changing the work:

1. Verify the claim against the artifact, code, tests, docs, logs, or product
   constraints.
2. Decide whether the finding is accepted, rejected, or deferred.
3. Fix accepted findings with the narrowest durable change.
4. Record rejected findings with technical evidence, not preference.
5. Defer optional or advisory findings with recorded technical rationale;
   do not manufacture user approvals or demand tracked tickets for optional improvements.
6. Run the narrowest validation that should fail without the fix, then broader
   validation when the touched surface warrants it.

Do not blindly implement every review note. A bad review finding should be
rejected clearly; an accurate finding should be fixed and validated.

## Iteration Loop

Repeat the loop on the latest work only:

1. Review the current version against acceptance criteria and concrete risks.
2. Receive and triage every new finding.
3. Improve accepted issues.
4. Validate the improvements.
5. Summarize what changed and what was rejected or deferred.
6. Re-review affected fixes/integration only when the work changed materially
   or evidence identifies a coverage gap. With no actionable findings and no
   changed subject, stop; optional notes do not trigger another round.

Subsequent review passes cover actual fixes/delta and affected integration,
retaining unaffected settled proof, and rejecting repeated resolved findings.

## Stop Condition

Stop only when all are true:

- The selected review skill has reviewed the latest applicable subject and no
  validated actionable findings remain in the selected scope. Existing review
  remains valid under the contract's evidence reuse rules.
- Accepted findings from earlier passes are fixed.
- Rejected findings have evidence strong enough that a future reviewer can
  understand the decision.
- Validated must-fix items remain blockers and cannot be waived. Deferred
  advisory, style, or optional findings have recorded technical rationale,
  without manufacturing user approvals or demanding tracked tickets.
- Validation appropriate to the changed surface has run, or the exact blocker is
  documented.
- The contract's convergence and recovery rules are satisfied; a review-round
  bound never waives a validated must-fix risk.

For pull requests, prefer `refining-prs-iteratively` when live PR state,
mergeability, hosted checks, unresolved threads, or target-branch freshness are
part of the stop condition.

## Final Handoff

Report:

- Artifact or work version reviewed.
- Review scope used.
- Review skill(s) used and number of passes.
- Findings fixed, rejected, or deferred.
- Validation commands and results.
- Remaining risks, if any.
- The exact reason the loop stopped.

Do not claim the work is clean, accepted, production-ready, or finished unless
the stop condition was met on the latest version.

## Red Flags

- Skipping affected review after a material change or proven coverage gap.
- Reusing clean feedback after its source or integration binding was invalidated.
- Accepting review comments without verifying the underlying claim.
- Asking the user broad preference questions before inspecting available
  evidence.
- Letting the reviewer produce vague advice without evidence and remediation.
- Calling the loop done while validation is pending or blocked.
- Silently expanding to polish-inclusive scope when the user expected a fast
  actionable pass.
- Hiding rejected or deferred findings from the final handoff.
