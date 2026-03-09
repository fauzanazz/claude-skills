# Memory Management Guide

AI sessions are stateless by default. Every new conversation starts from zero unless you
actively manage context. This guide establishes patterns for combating session amnesia.

## Memory Architecture

Organize persistent context into these layers, from most stable to most volatile:

### Layer 1: Project Identity (changes rarely)
- **CLAUDE.md / project rules** — coding standards, repo conventions, tool preferences
- **PROJECT.md / projectbrief.md** — what this project is, who it's for, core architecture

These are your foundation. They change when the project's direction changes, not per-feature.

### Layer 2: Technical Context (changes per milestone)
- **Architecture docs** — system design, data flow, key abstractions
- **Tech context** — stack decisions, dependency rationale, integration points
- **Patterns file** — recurring patterns in this codebase (naming, file structure, error handling)

Update these when you make architectural decisions or discover important patterns.

### Layer 3: Active Context (changes per session)
- **MEMORY.md** — auto-memory file with current state, in-progress work, key decisions
- **Progress tracking** — what's done, what's next, blockers
- **Session handoff notes** — context for resuming work

Update these at every significant milestone within a session.

## Memory Hygiene Rules

1. **Read before write** — always check existing memory before adding new entries
2. **Update, don't append** — if information changed, update the existing entry rather than adding a new one
3. **Prune stale context** — remove completed tasks, resolved blockers, outdated decisions
4. **Semantic, not chronological** — organize by topic ("auth system", "API design"), not by date
5. **Link, don't duplicate** — reference other files instead of copying their content

## Session Start Protocol

At the beginning of every session:

1. Read CLAUDE.md and MEMORY.md (these load automatically)
2. Check for any active work context (progress files, handoff notes)
3. Orient yourself: what was the last thing done? What's the next thing to do?
4. If resuming paused work, read the handoff notes before touching code

## Session Handoff Protocol

When pausing work mid-task:

1. **Current state** — what's done, what's in progress, what's blocked
2. **Key decisions made** — and why (the "why" is critical for future sessions)
3. **Next steps** — concrete, actionable items (not vague "continue working on X")
4. **Gotchas** — anything surprising or non-obvious discovered during this session
5. **Files touched** — which files were modified and why

Write this to MEMORY.md or a dedicated handoff file. The goal: a cold-start session
should be able to pick up exactly where you left off.

## What to Remember vs. What to Forget

**Remember:**
- Architectural decisions and their rationale
- Patterns confirmed across multiple interactions
- User preferences for workflow and communication
- Recurring problems and their solutions
- Key file paths and project structure

**Forget (don't persist):**
- Session-specific debugging steps
- Temporary workarounds that have been properly fixed
- Speculative conclusions from reading a single file
- Information that duplicates existing docs

## Context-Limit Handoff Protocol

AI sessions have finite context windows. When a session runs long, the model starts losing
earlier context — and quality degrades silently. This protocol prevents lost work.

### When to Trigger

Trigger a proactive handoff when any of these occur:
- The system has compressed or dropped earlier messages
- You've made 30+ tool calls in the session
- You're midway through a multi-step plan and sense degradation
- You notice yourself re-reading files you already read earlier

### The Handoff File

Write to `.planning/handoff.md` (or update MEMORY.md). Include ALL of the following:

```markdown
# Session Handoff — [Date]

## Completed This Session
- [x] Task 1 — committed as abc1234
- [x] Task 2 — committed as def5678

## In Progress
- [ ] Task 3 — branch: feature/foo, files modified: src/bar.ts, src/baz.ts
  - Current state: [what's done, what's left]
  - Uncommitted changes: [yes/no, describe if yes]

## Remaining Plan
- [ ] Task 4
- [ ] Task 5
- [ ] Task 6

## Key Decisions
- Chose X over Y because [reason]
- Discovered that Z requires [workaround]

## Gotchas
- [Non-obvious thing that will bite the next session]

## Verification Commands
- `npm test` — all passing as of this handoff
- `npm run typecheck` — clean
- `npm run build` — succeeds

## Resume Instructions
1. Read this file
2. Check git status on branch feature/foo
3. Continue with Task 3: [specific next action]
```

### Rules

1. **Write the handoff BEFORE you degrade** — if you wait until context is gone, the handoff
   will be low quality. Better to hand off one task early than produce garbage output.
2. **Commit first** — save completed work to git so the next session starts clean.
3. **Be specific** — "continue implementing the webhook system" is useless.
   "Add retry logic to WebhookDispatcher.emit() — tests are written but failing, see
   src/services/webhook-dispatcher.test.ts:45" is useful.
4. **Tell the user** — don't silently write a file. Explicitly say you're handing off and why.

## Memory for Teams

If multiple people (or multiple AI sessions) work on the same project:

- Keep a shared `PROJECT.md` as the single source of truth
- Use per-person or per-session memory files for individual context
- Sync important discoveries back to shared docs
- Avoid conflicting memory entries — if two sessions disagree, resolve it explicitly
