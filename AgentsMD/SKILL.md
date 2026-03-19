---
name: agents-md
description: >
  Generate or update AGENTS.md files for projects based on detected framework and conventions.
  Use when the user asks to create an AGENTS.md, set up AI agent instructions, document project
  conventions, or establish coding standards for a repository. Triggers on: "AGENTS.md",
  "create agents file", "agent instructions", "project conventions for AI", "coding standards",
  or when starting work on a new project that lacks an AGENTS.md. Detects the project type
  automatically and applies the matching template.
---

# AGENTS.md Generator

Generate tailored AGENTS.md files that give AI coding agents the context they need to work effectively in a codebase.

> **Core principle:** Every AGENTS.md must be grounded in the project's actual conventions — never fabricated. Inspect the codebase first, then populate the template.

## When to Use

- Creating a new project and need AI-agent-friendly documentation
- Onboarding a repository that has no AGENTS.md
- Updating an existing AGENTS.md after a major stack change
- Standardizing conventions across multiple projects

**When NOT to use:**
- The project already has a comprehensive, up-to-date AGENTS.md
- The repository is a fork you don't maintain

## Detection Heuristic

Inspect the project root and determine the type using this priority order:

| Check | Detected Type | Template |
|-------|---------------|----------|
| `app.json` with `expo` field | **React Native / Expo** | `react-native-agents.md` |
| `package.json` with `hono` in dependencies | **Hono Backend** | `hono-agents.md` |
| `package.json` with `next` in dependencies | **Next.js** | `nextjs-agents.md` |
| `pyproject.toml` with `fastapi` in dependencies | **FastAPI** | `fastapi-agents.md` |
| Multiple service directories with separate package configs | **Multi-Service** | `multi-service-agents.md` |

If the project type is ambiguous, ask the user to confirm.

## Workflow

1. **Detect** — Read `package.json`, `pyproject.toml`, or `app.json` to identify the framework
2. **Inspect** — Scan the project structure (`src/`, `app/`, `components/`, `services/`, etc.) and config files (`tsconfig.json`, `biome.json`, `eslint.config.*`, `ruff` config) to discover actual conventions
3. **Select template** — Load the matching template from this skill's reference files
4. **Populate** — Fill in the template with project-specific details:
   - Exact framework/library versions from the manifest
   - Actual directory structure from the filesystem
   - Real commands from `scripts` in package.json or pyproject.toml
   - Detected linter/formatter from config files
   - Package manager (npm/bun/pnpm/uv) from lockfile presence
5. **Write** — Create `AGENTS.md` at the project root (or enhance the existing one)
6. **Verify** — Confirm every stated convention matches the actual codebase

## Template Reference Files

| Template | File | For |
|----------|------|-----|
| Next.js / React | `nextjs-agents.md` | Next.js App Router projects with React |
| Hono Backend | `hono-agents.md` | Hono + Bun + Drizzle API servers |
| FastAPI Backend | `fastapi-agents.md` | FastAPI + Python async backends |
| React Native | `react-native-agents.md` | Expo + React Native mobile apps |
| Multi-Service | `multi-service-agents.md` | Monorepos or multi-repo service orchestrations |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Listing conventions not actually used in the project | Always inspect first, template second |
| Copying another project's AGENTS.md verbatim | Each project has unique versions, structure, and tools |
| Including aspirational conventions instead of actual ones | Document what IS, not what SHOULD BE |
| Making the file too long (300+ lines) | Keep it 50-150 lines; link to docs for deep dives |
| Forgetting to list the package manager | Agents will default to npm and break bun/pnpm projects |
| Omitting the lint/format command | This is the #1 command agents need to run before committing |
