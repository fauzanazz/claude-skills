# Generic Project AGENTS.md Template

Use this template when no specific framework is detected, or for projects using plain HTML, vanilla JS, Go, Rust, or other stacks without a dedicated template.

Populate each section by inspecting the actual project. Replace `{placeholders}` with real values. Remove sections that don't apply.

---

## Template

```markdown
# AGENTS.md

Instructions for AI agents working on this codebase.

## Stack

{language}, {runtime/framework if any}, {key libraries}

## Package Manager

{detected from lockfile: pnpm | bun | npm | yarn | uv | cargo | go modules | N/A}

## Commands

\```bash
{build command}                      # Build
{test command}                       # Run tests
{lint/format command}                # Lint & format
{dev command}                        # Dev server (if applicable)
\```

## Directory Structure

\```
{root}/
├── {source dir}/                    # Source code
├── {test dir}/                      # Tests
├── {config files}                   # Configuration
└── {output dir}/                    # Build output (if applicable)
\```

## Conventions

- {naming convention: e.g., snake_case for files, PascalCase for types}
- {import style: e.g., absolute imports from src/}
- {error handling pattern}
- {any other project-specific conventions discovered by inspection}

## Testing

- Framework: {detected test framework or "none"}
- Run: `{test command}`
- Pattern: {test file naming, e.g., *.test.ts, *_test.go, test_*.py}

## Before Committing

1. Run `{lint command}` to format
2. Run `{test command}` to verify
3. {any other pre-commit steps discovered from config}
```

---

## Inspection Checklist

When populating this template, check:

| What | Where to Look |
|------|--------------|
| Language & runtime | File extensions, shebang lines, config files |
| Package manager | Lockfile: `pnpm-lock.yaml`, `bun.lockb`, `yarn.lock`, `package-lock.json`, `uv.lock`, `Cargo.lock`, `go.sum` |
| Build command | `package.json` scripts, `Makefile`, `Cargo.toml`, `pyproject.toml` |
| Test command | `package.json` scripts, `Makefile`, test config files |
| Lint/format | `biome.json`, `.eslintrc.*`, `ruff.toml`, `.prettierrc`, `rustfmt.toml` |
| Directory structure | `ls` the project root |
| Conventions | Read 2-3 source files to identify naming, imports, patterns |
| Pre-commit hooks | `.husky/`, `.pre-commit-config.yaml`, `lefthook.yml` |
