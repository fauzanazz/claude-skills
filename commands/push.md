Commit all staged/unstaged changes and push to the current branch.

1. Run `git status` (no `-uall`), `git diff` (staged + unstaged), and `git log --oneline -5` in parallel.
2. Review changes. If nothing to commit, inform user and stop.
3. Stage relevant files by name (avoid `git add -A`). Never stage secrets (.env, credentials).
4. Write a concise commit message (1-2 sentences) focusing on the "why". Use a HEREDOC.
5. Run `git push` (with `-u origin HEAD` if no upstream is set).
6. Report the commit hash and confirm push succeeded.

Constraint:
- Do not add co-authors to the commit message.
