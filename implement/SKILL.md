---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Follow the repository's affected-surface validation policy. When the user requests
CI-only tests or local resources are constrained, use the supported CI deferral
route. Keep non-test safeguards enabled and report deferred tests as pending,
not passed. Bind the CI run to the published head and require its applicable
results before merge or verified completion.

Once done, use /code-review to review the work.

Commit your work to the current branch.
