---
name: reviewing-implementation-specs
description: 'Use when Reviews implementation specs for clarity, technical soundness, completeness, feasibility, and testability. Use when asked to review, critique, evaluate, or assess an implementation spec, remediation plan, or execution brief before development begins.'
---

## Review Dimensions

Evaluate the spec across five dimensions:

1. **Clarity, Structure and Why Rationale** — Motivation ("why"), goals, scope, and non-goals defined; consistent terminology; logical organization
2. **Technical Soundness & ADRs** — Architectural decisions justified with ADRs documented under `docs/architecture/adr/` containing all four mandatory fields: decision, alternatives considered, tradeoffs, and rationale; edge cases and error handling addressed; assumptions stated explicitly
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
