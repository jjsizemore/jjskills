# Why/Rationale and ADR rule

This file is the canonical mandate for plans, specs, commits and PRs; skill
entrypoints refer here rather than restating it.

- **Why / Rationale**: Every plan, implementation spec and PR body must include
  an explicit section explaining why the change is needed and the technical or
  business motivation. Every commit message must include that explanation in a
  body section or paragraph; a subject or list of changes alone is insufficient.
- **Architectural Decision Record (ADR)**: When an architectural decision involves
  evaluated alternatives and tradeoffs, document it under the repository's
  established ADR path (default `docs/architecture/adr/`). Record these four required
  fields: **decision**, **alternatives considered**, **tradeoffs**, and **rationale**.
  Reference the applicable ADR from the plan/spec, commit and PR. Routine changes
  do not require an ADR.
