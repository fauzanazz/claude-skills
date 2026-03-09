# Spec Writing Guide

A spec answers the questions that prevent wasted work. It's not a design doc or a plan —
it's a contract between you and the AI about what "done" looks like.

## Why Spec Before Plan

Planning without a spec means brainstorming in the dark. You'll generate clever solutions
to the wrong problem, or miss constraints that invalidate your approach halfway through.
The spec takes 5 minutes and saves hours.

## The Spec Template

Use this structure. Not every section needs to be long — a sentence each is fine for
small features. The point is to think through each dimension before coding.

```markdown
# Spec: [Feature Name]

## Problem
What problem does this solve? Why does it matter now?

## Solution
One-paragraph description of what we're building.

## Success Criteria
Observable outcomes that prove this works:
- [ ] Criterion 1 (specific, testable)
- [ ] Criterion 2
- [ ] Criterion 3

## Non-Goals
What we are explicitly NOT doing:
- Non-goal 1
- Non-goal 2

## Constraints
- Tech stack: [what we must use]
- Performance: [any requirements]
- Compatibility: [what it must work with]
- Security: [any special considerations]

## User Flow
How does a user interact with this? (Even for internal/API features,
describe the consumer's experience.)

1. User does X
2. System responds with Y
3. User sees Z

## Edge Cases
Things that could go wrong or behave unexpectedly:
- Edge case 1: how we handle it
- Edge case 2: how we handle it

## Open Questions
Things we don't know yet that could affect the approach:
- Question 1
- Question 2
```

## Spec Quality Checklist

Before approving a spec, verify:

- [ ] **Testable success criteria** — could you write an assertion for each one?
- [ ] **Clear non-goals** — do they prevent scope creep?
- [ ] **Constraints acknowledged** — no hidden assumptions about tech/environment?
- [ ] **Edge cases considered** — at least 2-3 "what if" scenarios?
- [ ] **No implementation details** — the spec says *what*, not *how*

## Spec Anti-Patterns

- **The Novel** — 3 pages when 3 paragraphs would do. Keep it proportional to complexity.
- **The Wish List** — success criteria that can't be verified ("make it fast", "good UX")
- **The Solution Spec** — describing implementation instead of outcomes
- **The Missing Spec** — "just build it, we'll figure it out" (this is what the spec prevents)

## Working with the Spec

Once written, the spec becomes the reference for all downstream work:

- **Brainstorming** references the spec to stay on-target
- **Planning** maps tasks to success criteria
- **Verification** checks each success criterion is met
- **Review** validates the implementation matches the spec, not just "works"

If the spec changes mid-build (it happens), update it explicitly and reassess the plan.
Don't let the spec and the implementation drift apart silently.
