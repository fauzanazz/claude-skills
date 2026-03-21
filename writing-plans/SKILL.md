---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run in a dedicated worktree (created during vibe-engineering Phase 2).

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md`

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use parallel-plan-execution to implement this plan task-by-task.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

**Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

**Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

**Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## Remember
- Exact file paths always
- Complete code in plan (not "add validation")
- Exact commands with expected output
- Reference relevant skills with @ syntax
- DRY, YAGNI, TDD, frequent commits

## Multi-Session Plans

For large features, structure the plan into **session milestones** — each milestone is a
self-contained unit of work that ends with all tests green.

```markdown
## Session 1: Data Layer
Tasks 1-4: Models, repositories, migrations
Exit criteria: unit tests green for all models and repos

## Session 2: Business Logic
Tasks 5-8: Services, domain logic, validation
Exit criteria: service tests + integration tests green

## Session 3: API & Frontend
Tasks 9-12: Endpoints, UI components, wiring
Exit criteria: API tests + component tests green

## Session 4: Integration & Polish
Tasks 13-15: E2E tests, error handling, docs
Exit criteria: full test suite green
```

**Key rule:** Each session ends by writing failing tests for the next session's work.
The failing tests ARE the handoff — they encode exactly what the next session must build.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/plans/<filename>.md`. Execution options:**

**1. Single session** - I dispatch tasks in parallel waves now (best for plans with ~15 or fewer tasks)

**2. Multi-session** - We execute one session milestone at a time, with TDD contracts between sessions (best for large features)

**Which approach?"**

**If Single session chosen:**
- **REQUIRED SUB-SKILL:** Use parallel-plan-execution
- Stay in this session
- Fresh subagent per task + code review

**If Multi-session chosen:**
- Start with Session 1 milestone using parallel-plan-execution
- At session end: commit green code + failing tests for Session 2
- Each new session picks up from failing tests — no ambiguity about what to build
