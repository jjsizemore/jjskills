---
name: reviewing-implementation-specs
description: 'Use when Reviews implementation specs for clarity, technical soundness, completeness, feasibility, and testability. Use when asked to review, critique, evaluate, or assess an implementation spec, remediation plan, or execution brief before development begins.'
---

## Review Dimensions

Evaluate the spec across five dimensions:
- **Why / Rationale**: Verify the spec explains why the change is needed and the problem it addresses.
- **ADR completeness**: When an architectural decision is made and alternatives or tradeoffs are evaluated, verify an ADR records decision, alternatives considered, tradeoffs, and rationale; routine/non-architectural changes do not require an ADR.

1. **Clarity and Structure** — Goals, scope, and non-goals defined; consistent terminology; logical organization
2. **Technical Soundness** — Architectural decisions justified; edge cases and error handling addressed; assumptions stated explicitly
3. **Completeness** — Functional and non-functional requirements covered; dependencies, integrations, and data flows specified; migration/rollout/rollback plans present where relevant
4. **Feasibility and Risk** — Technical, operational, and scalability risks identified; performance, security, and compliance addressed; hidden complexities and unclear ownership surfaced
5. **Testability and Observability** — Acceptance criteria measurable and specific; testing strategy defined (unit, integration, e2e); logging, monitoring, and metrics specified

## Output Format

Produce exactly these five sections:

### 1. Executive Summary
Concise overview of overall quality and execution readiness — one short paragraph.

### 2. Key Strengths
Bullet list of what is well done. Skip if nothing stands out.

### 3. Gaps and Risks
Numbered list. Each entry must contain:
- **Issue**: what is missing or wrong
- **Why it matters**: concrete impact on execution quality or delivery risk
- **Suggested improvement**: a specific, actionable fix — not a vague direction

### 4. Clarifying Questions
Questions that must be answered before implementation begins. Omit if none.

### 5. Recommended Improvements
Concrete, prioritized actions to make the spec implementation-ready. Lead with the highest-impact items.

## Guidance

Be direct and precise. Avoid generic feedback ("consider adding more detail"). Every gap must have a suggested improvement — do not surface problems without remediation paths. Focus on changes that materially reduce implementation risk or prevent ambiguity from blocking execution.
