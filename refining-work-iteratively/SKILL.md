---
name: refining-work-iteratively
description: 'Use when improving an artifact, plan, spec, PR, feature, or fix through repeated antagonistic review-and-receive loops until the selected review scope finds no new issues.'
---

# Refining Work Iteratively

Use this skill when work needs to be made stronger by repeatedly reviewing it
skeptically, receiving the feedback rigorously, improving the work, and
reviewing the latest version again.

This is a loop controller. It does not replace domain review skills. It selects
the most relevant review skill, runs it in an antagonistic mode, routes the
result through the relevant receiving skill, and repeats until the latest work
has no new findings in the selected review scope.

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
- For independent cross-model antagonistic review, dispatch the review skill via
  an external CLI agent: `orchestrating-external-agents` with
  `using-opencode-cli`, `using-claude-cli-agent`, `using-codex-cli-agent`, or
  `using-antigravity-agy-cli`. Independence comes from a different model, not
  just a different CLI.

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

Run the selected review skill as a hostile acceptance gate. Tell the reviewer to
look for reasons the work should not be accepted yet.

The review prompt must include:

- The latest artifact, diff, plan, spec, PR, or output being reviewed.
- The intended outcome and explicit non-goals.
- Validation already run and any known limitations.
- Prior findings that were fixed, rejected with evidence, or deferred with user
  approval.
- The instruction to find new issues, not restate already resolved or rejected
  items unless the prior resolution is technically wrong.

Ask the reviewer to classify every finding as:

- **Blocking**: must be fixed before acceptance.
- **Advisory**: should be fixed if cheap or risk-reducing, but can be accepted
  with explicit rationale.
- **Nice-to-have**: improves polish, clarity, maintainability, or ergonomics,
  but is not required for acceptance under the default review scope.
- **Question**: a decision or missing fact blocks confident review.
- **No issue**: no new issue found within the selected review scope.

Every non-`No issue` finding in the selected review scope must include concrete
evidence, why it matters, and a specific remediation path. Reject vague feedback
and rerun the review prompt with tighter evidence requirements.

## Review Scope

Use one of these scopes before starting the loop:

- **Default actionable scope**: stop when there are no new Blocking, Advisory,
  or Question items. Nice-to-have findings may be recorded, accepted if cheap,
  deferred, or explicitly left as polish debt.
- **Polish-inclusive scope**: stop only when there are no new Blocking,
  Advisory, Question, or Nice-to-have items. Use this when the user asks for
  extra refinement, premium polish, exhaustive cleanup, or explicitly says to
  include nice-to-haves.

If the user does not specify, use default actionable scope. If the artifact is
high-risk or user-facing and the cost of iteration is low, recommend whether to
upgrade to polish-inclusive scope instead of silently expanding the loop.

## Receive And Improve

For each finding, apply the relevant receiving skill before changing the work:

1. Verify the claim against the artifact, code, tests, docs, logs, or product
   constraints.
2. Decide whether the finding is accepted, rejected, or deferred.
3. Fix accepted findings with the narrowest durable change.
4. Record rejected findings with technical evidence, not preference.
5. Defer findings only with explicit user approval or a tracked follow-up.
6. Run the narrowest validation that should fail without the fix, then broader
   validation when the touched surface warrants it.

Do not blindly implement every review note. A bad review finding should be
rejected clearly; an accurate finding should be fixed and validated.

## Iteration Loop

Repeat the loop on the latest work only:

1. Review the current version antagonistically.
2. Receive and triage every new finding.
3. Improve accepted issues.
4. Validate the improvements.
5. Summarize what changed and what was rejected or deferred.
6. Run the review again against the updated version.

Prior clean reviews do not count after the work changes. A review pass only
counts for the version it inspected.

## Stop Condition

Stop only when all are true:

- The selected review skill has reviewed the latest version and found no new
  findings within the selected review scope.
- Accepted findings from earlier passes are fixed.
- Rejected findings have evidence strong enough that a future reviewer can
  understand the decision.
- Deferred findings are explicitly accepted by the user or tracked as follow-up.
- Validation appropriate to the changed surface has run, or the exact blocker is
  documented.

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

- Running a review once, making changes, and skipping the follow-up review.
- Treating old clean feedback as valid after the artifact changed.
- Accepting review comments without verifying the underlying claim.
- Asking the user broad preference questions before inspecting available
  evidence.
- Letting the reviewer produce vague advice without evidence and remediation.
- Calling the loop done while validation is pending or blocked.
- Silently expanding to polish-inclusive scope when the user expected a fast
  actionable pass.
- Hiding rejected or deferred findings from the final handoff.
