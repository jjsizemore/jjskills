# Testing Discipline Reference

Use this reference when the main `writing-skills` workflow needs more detail on
testing, rationalization resistance, and RED-GREEN-REFACTOR loops for skills.

## Testing All Skill Types

Different skill types need different test approaches:

| Skill type | Test with | Success criteria |
| --- | --- | --- |
| Discipline-enforcing skills | Academic questions, pressure scenarios, combined pressures, rationalization capture | Agent follows the rule under maximum pressure |
| Technique skills | Application scenarios, variations, missing-information tests | Agent applies the technique correctly to a new scenario |
| Pattern skills | Recognition scenarios, application scenarios, counter-examples | Agent identifies when and how to apply the pattern |
| Reference skills | Retrieval scenarios, application scenarios, gap tests | Agent finds and correctly applies the reference |

## Common Rationalizations For Skipping Testing

| Excuse | Reality |
| --- | --- |
| "Skill is obviously clear" | Clear to you is not the same as clear to another agent. Test it. |
| "It's just a reference" | References can still have gaps or unclear retrieval paths. |
| "Testing is overkill" | Untested skills routinely fail under pressure. |
| "I'll test if problems emerge" | Problems mean agents already could not use the skill. |
| "Academic review is enough" | Reading is not using. Test application scenarios. |
| "No time to test" | Deploying untested guidance costs more time later. |

## Bulletproofing Against Rationalization

Skills that enforce discipline need explicit anti-loophole language. Capture
rationalizations from baseline testing, then add direct counters.

Close every loophole:

```markdown
Write code before test? Delete it. Start over.

No exceptions:
- Do not keep it as "reference".
- Do not adapt it while writing tests.
- Do not look at it.
- Delete means delete.
```

Address spirit-vs-letter arguments early:

```markdown
Violating the letter of the rules is violating the spirit of the rules.
```

Create a red-flags list:

```markdown
## Red Flags - Stop And Start Over

- Code before test
- "I already manually tested it"
- "Tests after achieve the same purpose"
- "It's about spirit, not ritual"
- "This is different because..."
```

## RED-GREEN-REFACTOR For Skills

1. **RED:** run pressure scenarios without the skill and document baseline
   failures, choices, and rationalizations.
2. **GREEN:** write the smallest skill change that addresses those observed
   failures, then rerun the same scenarios with the skill.
3. **REFACTOR:** when agents find a new loophole, add the counter and rerun
   until the skill holds under pressure.

For full pressure-scenario mechanics, use `testing-skills-with-subagents.md`.

