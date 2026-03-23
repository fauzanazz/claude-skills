---
name: parallel-plan-execution
description: >
  Execute implementation plans with parallel wave-based dispatch — independent tasks
  run simultaneously, cutting wall-clock time dramatically. Use this skill whenever
  you have a written implementation plan with multiple tasks, especially when tasks
  fall into independent domains (e.g., separate UI sections, separate modules, separate
  features). Replaces executing-plans and subagent-driven-development
  when parallelism is beneficial. Trigger when the user says "execute the plan",
  "implement the plan", "run the tasks in parallel", or when you have a PLAN.md /
  implementation plan with 3+ tasks that could plausibly run concurrently.
---

# Parallel Plan Execution

Execute implementation plans in dependency-ordered waves. Tasks within each wave
run simultaneously as parallel agents. Each wave completes (implement → review → fix)
before the next wave starts.

**Announce at start:** "I'm using parallel-plan-execution to implement this plan."

---

## Phase 1: Load and Analyze

1. Read the plan file
2. Extract every task with its full text
3. Build a dependency graph:
   - Look for explicit markers: "depends on", "requires Task N", "after Task N"
   - Look for implicit dependencies: task B uses output/files/components created by task A
   - Tasks that share output files must be in different waves
4. Group tasks into **waves** (topological sort):
   - Wave 1: tasks with no prerequisites
   - Wave 2: tasks whose only prerequisites are in Wave 1
   - Wave N: tasks whose prerequisites are all in earlier waves
5. **Conflict check**: verify no two tasks in the same wave write to the same files. If they would conflict, move the later one to the next wave.

Present the wave plan to the user before proceeding:

```
Wave 1 (parallel): Task 2, Task 3, Task 4
Wave 2 (parallel): Task 5, Task 6, Task 7, Task 8, Task 9
Wave 3 (sequential): Task 10  ← depends on Wave 2 output
```

Ask: "Does this grouping look right? Any dependencies I missed?"

Adjust based on feedback, then create a TodoWrite with all tasks.

---

## Phase 2: Execute Each Wave

Repeat for each wave:

### Step A: Parallel Implementation

Dispatch **all tasks in the wave simultaneously** — a single message with one Agent call per task.

Each agent prompt (adapt the implementer-prompt template from subagent-driven-development):

```
You are implementing [Task N: task name] as part of a parallel wave.

## Task Description
[FULL TEXT of this task from the plan]

## Context
[Where this fits in the overall plan. What wave this is. What was built in prior waves.]
[Explicitly state: "Other tasks are being implemented in parallel. Do NOT touch files
 outside your task scope: [list the files/directories this task owns].]

## Your Job
1. Implement exactly what the task specifies (nothing more)
2. Write tests if the task requires them
3. Verify your implementation works
4. Commit your work with a clear message
5. Self-review before reporting

## Self-Review Checklist
- Did I implement everything requested?
- Did I avoid touching files outside my scope?
- Is the code clean and consistent with existing patterns?
- Do tests verify real behavior?

## Report Format
- What you implemented
- Files changed (list them explicitly)
- Test results
- Any issues or concerns
```

Wait for **all agents in the wave** to report back before proceeding.

### Step B: Parallel Spec Review

Once all implementers have reported, dispatch spec reviewers in parallel — one per task:

```
You are reviewing spec compliance for [Task N: task name].

## What Was Requested
[FULL TEXT of task requirements]

## What the Implementer Built
[Implementer's report summary]

## Your Job
Read the actual code (don't trust the report). Verify:
- Everything requested was implemented
- Nothing unrequested was added
- The implementation matches the intent of the spec

Report ✅ Spec compliant OR ❌ Issues: [specific list with file:line]
```

### Step C: Fix Spec Issues (if any)

For any task that failed spec review, dispatch a fix agent for that task only.
Re-run its spec reviewer after the fix. Repeat until compliant.

Other tasks that passed do not need re-review — they're done.

### Step D: Parallel Code Quality Review

Once all tasks in the wave are spec-compliant, dispatch code quality reviewers in parallel:

```
You are reviewing code quality for [Task N: task name].

## What Was Built
[List of files changed by this task]

## Review Criteria
- Names are clear and accurate
- No unnecessary complexity (YAGNI)
- Follows existing codebase patterns
- Edge cases handled appropriately
- Security: no injection, XSS, exposed secrets, broken auth

Report: Approved ✅ OR Issues (Important): [list]
```

Fix any important quality issues task-by-task, then confirm fixed.

### Step E: Wave Complete

Mark all wave tasks as completed in TodoWrite. Log a brief wave summary:

```
Wave N complete: [task names]
Files changed: [list]
```

Proceed to next wave.

---

## Phase 3: Finish

After all waves complete:

1. Dispatch a final code reviewer across the entire implementation
2. Announce: "I'm using the finishing-a-development-branch skill to complete this work."
3. Invoke **finishing-a-development-branch**

---

## When to Serialize Within a Wave

Even within a "parallel" wave, some tasks must run sequentially if:
- They write to the same file (detected in Phase 1 conflict check)
- One task's output is a required input to another (this should have been caught as a dependency, but sometimes it's discovered mid-wave)

If you discover a mid-wave conflict after dispatching, note it in your wave summary and handle the conflicting task in the next wave.

---

## When to Stop and Ask

- **Dependency ambiguity**: if you're not sure whether two tasks are independent, ask before grouping them in the same wave — a wrong assumption causes a merge conflict
- **Blocker mid-wave**: if any agent hits a blocker it can't resolve, stop the wave and surface it to the user before continuing
- **Wave plan disagreement**: user says the grouping is wrong — adjust before executing

---

## Key Principles

**Independent tasks own their files.** The clearest signal that two tasks can run in parallel is that they write to completely different files. When in doubt, put them in separate waves.

**Fresh context per agent.** Each implementer gets the full task text plus context about prior waves — not a pointer to the plan file. This prevents agents from reading context they don't need and getting confused.

**Quality gates per wave, not per task.** Running spec + quality review across an entire wave in parallel is faster than sequential per-task review while maintaining the same quality bar.

**Don't parallelize reviews before implementation completes.** Wait for all wave implementers to finish before dispatching any reviewers. Partial reviews create confusing feedback loops.

---

## Integration

- **using-git-worktrees** — set up isolated workspace before starting
- **writing-plans** — creates plans this skill executes
- **`references/parallel-dispatch-patterns.md`** — detailed patterns for dispatching parallel agents (prompt structure, common mistakes, when NOT to parallelize)
- **finishing-a-development-branch** — complete development after all waves
