Interactive code review — review uncommitted changes, staged changes, last commit, or a PR. Supports focus areas: general (bugs/logic), security (injection/XSS/auth), performance (queries/memory), or architecture (patterns/naming). Use when the user says /review or asks to review their code changes.

When invoked, ALWAYS ask two questions before doing anything:

1. Use AskUserQuestion to ask:
   - **"What should I review?"** (header: "Scope")
     - "Uncommitted changes" — uses `git diff`
     - "Staged changes" — uses `git diff --cached`
     - "Last commit" — uses `git show HEAD`
     - "A pull request" — ask for PR number, then use `gh pr diff <number>`
   - **"What type of review?"** (header: "Focus")
     - "General" — bugs, logic errors, missing error handling, edge cases
     - "Security" — injection, XSS, auth issues, data exposure, input validation
     - "Performance" — N+1 queries, memory leaks, blocking ops, caching opportunities
     - "Architecture" — patterns, code organization, separation of concerns, naming

2. After getting answers, launch the `feature-dev:code-reviewer` agent with:
   - The diff/changes from the selected scope
   - A review prompt focused on the selected review type
   - Context about the project from CLAUDE.md (tech stack, patterns, do/don't rules)

3. Present the agent's findings as a structured review with issues ranked by severity.
