---
name: vibe-engineering
description: >
  Orchestrates disciplined AI-assisted development using the Vibe Engineering methodology.
  ALSO use at the start of ANY conversation to establish skill discipline. Use this skill
  whenever starting a new feature, project, or significant code change — especially when the
  user says "build", "implement", "create", "add feature", or describes what they want built.
  Also trigger when the user mentions "vibe engineering", "spec first", "AI-friendly
  architecture", "memory banks", "session context", or when they're about to dive into code
  without a clear specification. This skill ensures work follows the Spec > Plan > Build > Verify > Ship
  pipeline rather than jumping straight to implementation. Even for seemingly simple tasks,
  invoke this skill if there's any ambiguity about requirements or architecture.
---

# Vibe Engineering

AI amplifies existing expertise — the better you direct it, the better the results. This skill
enforces a disciplined pipeline that treats AI as a capable-but-junior engineer who needs clear
direction, not free rein.

**The one-line summary:** "Speed isn't how fast you type — it's how fast your system tells you the truth."

## Session Start — Always Do This First

Before anything else, check for prior context:

1. **Check for handoff files** — look for `.planning/handoff.md`, `HANDOFF.md`, or handoff entries in MEMORY.md
2. **If a handoff exists**: read it, summarize what was done and what's next, then ask the user if they want to continue from where the previous session left off
3. **If no handoff exists**: proceed normally with the pipeline below
4. **Check git status** — understand the current branch, uncommitted changes, recent commits

This takes 10 seconds and prevents duplicate work or lost context from a previous session.

## Skill Discipline

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke it. This is not negotiable.
</EXTREMELY-IMPORTANT>

**Red Flags** — these thoughts mean STOP, you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "The skill is overkill" | Simple things become complex. Use it. |

**Priority:** Process skills first (debugging, planning), then implementation skills (frontend-design, etc.).

**Skill types:** Rigid (TDD, debugging) — follow exactly. Flexible (patterns) — adapt to context.

## Model Selection

Use different models for different phases to balance quality and speed:

- **Opus** — Planning phases (Spec, Plan) where architectural thinking and decision quality matter most
- **Sonnet** — Execution phases (Build, Verify, Ship) where speed matters and the plan provides clear direction

When spawning agents, pass `model: "opus"` for planning/architecture agents and `model: "sonnet"` for implementation/execution agents.

## The Pipeline

Every piece of work flows through these phases. The skill routes you to the right tool at each step.

```
Spec --> Plan --> Build --> Verify --> Ship
 |        |        |         |         |
 v        v        v         v         v
[spec]  [brain-  [TDD +   [verify]  [finish
 ref     storm    execute]           branch]
         + plan]
```

## Phase 1: Spec *(model: opus)*

Before planning or brainstorming, gather a complete specification through a structured interview.
The spec is the source of truth — every ambiguity left here becomes wasted implementation later.

**Ask one question at a time using the `AskUserQuestion` tool.** Wait for the answer before
asking the next. Never bundle questions or infer answers the user hasn't given.

Ask these questions in order, adapting wording to context:

1. **What are we building?** — one sentence describing the feature or change
2. **Who is this for?** — the user, consumer, or system that will use it
3. **What does success look like?** — observable, concrete outcomes (not "it works")
4. **What is explicitly out of scope?** — what are we NOT building
5. **What are the constraints?** — tech stack, performance, compatibility, deadlines

If any answer is vague or incomplete, ask a follow-up before moving on. Do not move to Phase 2
until every dimension has a clear, user-provided answer.

Only after all answers are collected: write the spec to `.planning/spec.md` and show it to the
user for confirmation. If they want changes, update and confirm again.

**Golden rule: never fill a spec gap by assumption. If you don't know, ask.**

## Phase 2: Plan *(model: opus)*

Once the spec is confirmed, explore approaches before writing a plan.

### Brainstorm (present options, don't decide)

Propose 2–3 distinct implementation approaches with tradeoffs. Use `AskUserQuestion` to ask:
*"Which approach do you want to pursue, or do you want to combine aspects of these?"*

Wait for the user's choice before proceeding. The user owns architecture decisions.

### Write the plan

With an approved approach, draft the implementation plan. As you write it, you will encounter
gaps — things the spec didn't cover, edge cases, decisions that must be made.

**For every gap you find: stop and ask the user using `AskUserQuestion`.** Never fill a gap by
assuming what the user would want. The cost of asking is one question; the cost of assuming is
wasted implementation.

Ask gaps one at a time. Once answered, continue drafting. When complete, show the plan to the
user and ask for explicit approval before moving to Build.

**Design doc:** Save the approved design to `docs/plans/YYYY-MM-DD-<topic>-design.md` and commit before writing the implementation plan.

**Golden rule: never fill a plan gap by assumption. If you're not sure, ask.**

## Phase 3: Build *(model: sonnet)*

Execute the plan with guardrails:

1. **TDD** — invoke `test-driven-development` to write tests alongside code
2. **Execute** — invoke `parallel-plan-execution` to run independent tasks in parallel waves
3. **Small chunks** — each commit should be a testable, reviewable unit
4. **Commit checkpoints** — every significant change gets its own commit with a clear message

## Phase 4: Verify *(model: sonnet)*

Before claiming anything is done:

1. **Verify** — invoke `finishing-a-development-branch` (verification gate)
2. **Review** — invoke `review`
3. **Security scan** — check for OWASP top 10 issues in AI-generated code (injection, XSS, exposed secrets, broken auth)

## Phase 5: Ship *(model: sonnet)*

1. **Finish branch** — invoke `finishing-a-development-branch`
2. **Staging first** — deploy to preview/staging before production when possible

## Memory Management

Context is the #1 bottleneck in AI-assisted development. Session amnesia kills productivity.

Read `references/memory.md` for the full memory management guide. Key principles:

- **Read memory at session start** — always check what's already known
- **Update memory at milestones** — capture decisions, patterns, blockers
- **Structure by topic** — semantic organization, not chronological
- **Handoff protocol** — when pausing work, write enough context to resume cold

## Multi-Session Work & Context Management

Large tasks don't need to fit in one session. **No task is "too big" — it just needs more sessions.**

The key insight: **TDD is the cross-session contract.** Failing tests are the most unambiguous
handoff artifact possible — no prose summary needed, just test output telling the next session
exactly what's left to build.

### Planning for Multiple Sessions

During Phase 2 (Plan), assess whether the work fits in one session:

- **Single session** (~15 tasks or fewer, limited file scope): proceed normally
- **Multi-session** (large feature, many modules, significant scope): break the plan into
  **session milestones** — each milestone is a self-contained unit of work with its own tests

**Session milestone structure:**
```
Session 1: Core data models + repository layer (tests: unit tests for models & repos)
Session 2: Service layer + business logic (tests: service tests, integration tests)
Session 3: API endpoints + frontend (tests: API tests, component tests)
Session 4: Integration, E2E tests, polish
```

Each session milestone must:
1. **Start with tests** — write failing tests that define the session's deliverables
2. **End green** — all tests passing, committed, ready for the next session to build on
3. **Be independently verifiable** — `pytest` / `npm test` tells you if the session succeeded

### TDD as Session Contract

When breaking work across sessions:

1. **Write tests for the next session before ending the current one.** These failing tests are
   the specification for what comes next — far more precise than any prose handoff.
2. **Commit the failing tests** with a clear message: `test: add failing tests for [next milestone]`
3. **The next session's job is simple:** make the red tests green, then write tests for the session after.

This creates a chain: each session leaves failing tests → next session makes them pass → writes
new failing tests → repeat until done. No ambiguity, no lost context.

### Context-Limit Awareness

Long sessions degrade quality as context fills up. Monitor and act proactively:

**Warning signs you're approaching the limit:**
- The system compresses or drops earlier messages
- You notice you've forgotten details from earlier in the conversation
- The session has been running for a long time with many tool calls
- You're midway through a large multi-step plan

**When you sense context pressure:**

1. **Finish the current TDD cycle** (get to green, don't leave tests red mid-cycle).
2. **Write failing tests for remaining work** — this IS the handoff. The tests encode what's left.
3. **Commit everything** — passing code + failing tests for next session.
4. **Write a brief handoff** to `.planning/handoff.md`:
   - What's done (committed, tests green)
   - Failing tests that define next session's work (file paths, what they test)
   - Remaining plan items beyond the failing tests
   - Key decisions and gotchas
5. **Tell the user**: "Session milestone complete. I've committed passing code and failing tests
   for the next phase. Start a new session — the failing tests define exactly what to build next."

**Do not:**
- Refuse a task because it's "too big" — break it into sessions instead
- Push through and hope for the best — quality drops sharply near the limit
- Leave a session without committed, green tests for completed work
- Write a vague handoff ("continue working on the feature") — the failing tests should speak for themselves

## AI-Friendly Architecture

Codebases that are easy for AI to navigate produce better AI-assisted results.

Read `references/architecture.md` for the full guide. Key patterns:

- **Contracts first** — define interfaces before implementations
- **Golden paths** — one sanctioned way to add each type of component
- **Explicit over implicit** — favor clarity over cleverness
- **Self-documenting structure** — file/folder naming that reveals intent

## When to Skip Phases

Not everything needs the full pipeline:

- **Bug fix with clear repro** — skip Spec, go straight to `systematic-debugging`
- **Trivial change** (rename, typo, config) — just do it
- **Exploration / research** — skip Build/Verify, focus on Spec + Plan to clarify what you're learning
- **Never skip Spec/Plan because "it's simple"** — "simple" projects are where unexamined assumptions cause the most wasted work

Use judgment. The pipeline exists to prevent costly mistakes on ambiguous work, not to slow down obvious tasks.

## Delegation Intuition

**Give to AI:** Implementation details, boilerplate, test writing, refactoring, documentation, code search, pattern application.

**Keep for yourself:** Architecture decisions, security-critical logic, business logic validation, UX decisions, scope decisions, "is this the right thing to build?"

The division: humans decide *what* and *why*; AI handles *how* under human direction.
