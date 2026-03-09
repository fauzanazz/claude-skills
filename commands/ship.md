Run `git status` to see changes. 
If there are changes:
1. Sync main before creating a branch.
2. Create a new branch based on the current context or ask me for a name.
3. Stage only the relevant files for the release.
4. Generate a conventional commit message describing the changes and commit.
5. Push the branch to origin.
6. Use the GitHub CLI (`gh pr create`) to open a pull request to main with a summary of the changes.

Constraint:
- Do not add co-authors to the commit message.