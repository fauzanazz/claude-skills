---
name: review
description: >
  Code review: requesting, conducting, and receiving reviews. Use when completing tasks,
  implementing major features, before merging, when the user says /review, or when receiving
  code review feedback. Covers the full review lifecycle: dispatching reviews, interactive
  review sessions, and handling feedback with technical rigor.
---

# Code Review

## Part 1: Requesting Reviews

Dispatch the code-reviewer agent to catch issues before they cascade.

### When to Request Review

**Mandatory:**
- After completing a major feature
- Before merge to main
- After each task in parallel-plan-execution

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

### How to Dispatch

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. Dispatch code-reviewer agent:**

Use Agent tool with `feature-dev:code-reviewer` type. Fill the template at `review/code-reviewer.md` with:
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` / `{HEAD_SHA}` - Commit range
- `{DESCRIPTION}` - Brief summary

**3. Act on feedback (severity-based):**
- **Critical** — fix immediately
- **Important** — fix before proceeding
- **Minor** — note for later
- Push back if reviewer is wrong (with reasoning)

---

## Part 2: Interactive Review

When the user invokes `/review` or asks to review their code changes, ask two questions first:

1. **"What should I review?"** (Scope)
   - "Uncommitted changes" — `git diff`
   - "Staged changes" — `git diff --cached`
   - "Last commit" — `git show HEAD`
   - "A pull request" — ask for PR number, use `gh pr diff <number>`

2. **"What type of review?"** (Focus)
   - "General" — bugs, logic errors, missing error handling, edge cases
   - "Security" — injection, XSS, auth issues, data exposure
   - "Performance" — N+1 queries, memory leaks, blocking ops
   - "Architecture" — patterns, code organization, naming

After getting answers, launch `feature-dev:code-reviewer` agent with the diff and review focus. Present findings as a structured review ranked by severity.

---

## Part 3: Receiving Review Feedback

Code review requires technical evaluation, not emotional performance.

### The Response Pattern

```
WHEN receiving code review feedback:

1. READ: Complete feedback without reacting
2. VERIFY: Check against codebase reality
3. EVALUATE: Technically sound for THIS codebase?
4. RESPOND: Technical acknowledgment or reasoned pushback
5. IMPLEMENT: One item at a time, test each
```

### Forbidden Responses

**NEVER:** "You're absolutely right!", "Great point!", "Thanks for catching that!"

**INSTEAD:** Restate the technical requirement, ask clarifying questions, push back with reasoning if wrong, or just start fixing (actions > words).

### Source-Specific Handling

**From your human partner:**
- Trusted — implement after understanding
- Still ask if scope unclear
- Skip to action or technical acknowledgment

**From external reviewers:**
- Check: Technically correct for THIS codebase?
- Check: Breaks existing functionality?
- Check: Does reviewer understand full context?
- If suggestion seems wrong: push back with technical reasoning
- If conflicts with your human partner's prior decisions: discuss with them first

### When to Push Back

Push back when:
- Suggestion breaks existing functionality
- Reviewer lacks full context
- Violates YAGNI (unused feature)
- Technically incorrect for this stack
- Conflicts with architectural decisions

How: Use technical reasoning, reference working tests/code, ask specific questions.

### Implementation Order

For multi-item feedback:
1. Clarify anything unclear FIRST
2. Then implement: blocking issues → simple fixes → complex fixes
3. Test each fix individually
4. Verify no regressions

### GitHub Thread Replies

Reply in the comment thread (`gh api repos/{owner}/{repo}/pulls/{pr}/comments/{id}/replies`), not as top-level PR comments.
