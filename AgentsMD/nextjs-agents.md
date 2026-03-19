# Next.js AGENTS.md Template

Use this template for projects built with **Next.js App Router + React + TypeScript + Tailwind CSS**.

Populate each section by inspecting the actual project. Replace `{placeholders}` with real values.

---

## Template

```markdown
# AGENTS.md

Instructions for AI agents working on this codebase.

## Stack

{Next.js version}, React {version}, TypeScript, Tailwind CSS {version}, {package manager}

## Commands

\```bash
{pkg} run dev          # Dev server
{pkg} run build        # Production build
{pkg} run lint         # Linter ({eslint|biome})
{pkg} run test         # Tests ({playwright|vitest|jest})
{lint_format_cmd}      # Lint & format (run before committing)
\```

> **Package manager:** Only use `{npm|bun|pnpm}`. Never use {alternatives}.

## Structure

\```
{src_prefix}
├── app/             # Next.js App Router (pages, layouts, API routes)
├── components/      # React components
│   ├── ui/          # Primitives (button, input, card — shadcn/ui)
│   {atomic_design}
├── hooks/           # Custom React hooks (by domain)
├── lib/             # Shared utilities (cn(), api client, auth)
├── services/        # API call functions (by domain)
├── types/           # TypeScript type definitions
{extra_dirs}
\```

## Code Conventions

### Component Architecture

- **Server Components** fetch data and pass to Client Components
- **Client Components** (`"use client"`) handle interactivity
- **Server Actions** (`"use server"`) handle mutations, call `revalidatePath()` after writes
- Layered data flow: **Components → Hooks → Services → Server Actions / API**

### UI & Styling

- Use **shadcn/ui** primitives from `components/ui/` — do not create custom primitives
- Use `cn()` from `lib/utils.ts` for conditional Tailwind classes
- Use `cva()` from `class-variance-authority` for variant-based component styling
- Use **Tailwind utility classes** directly — no CSS modules, no inline styles
- Use **design tokens**: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`
- Icons: **lucide-react** only

### Forms & Validation

- Forms: **react-hook-form** + `@hookform/resolvers`
- Validation: **Zod** schemas (co-located in `lib/validations/` or per-feature)
- Always validate on both client and server

### State Management

- **Server state**: TanStack React Query (`@tanstack/react-query`)
- **Client state**: Zustand (only when React Query doesn't fit)
- **UI state**: Local `useState` / `useReducer`
- No Redux, no MobX

### Notifications

- Use **sonner** for toast notifications
- Use **next-themes** for dark/light mode

### TypeScript

- `strict: true` enforced
- Path alias: `@/*` maps to `{./src/*|./*}`
- Prefer `interface` for component props, `type` for unions/intersections
- Use `import type` for type-only imports

## SOLID Principles

- **Single Responsibility** — One purpose per file / function / component
- **Open/Closed** — Extend via props / composition, don't modify existing code
- **Liskov Substitution** — Components replaceable by their subtypes
- **Interface Segregation** — Small, focused prop interfaces
- **Dependency Inversion** — Depend on abstractions (hooks, contexts), not implementations

## Reuse First

Before writing new code, check:

1. `{src_prefix}/lib/` — Shared utilities (`cn()`, API client, formatters)
2. `{src_prefix}/hooks/` — Existing custom hooks by domain
3. `{src_prefix}/components/ui/` — Base UI primitives
4. `{src_prefix}/components/` — Existing feature components

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Business logic in components | Extract to custom hooks |
| API calls in page components | Use services layer + React Query hooks |
| Inline styles or CSS modules | Tailwind utility classes |
| Create new UI primitives | Use existing shadcn/ui components |
| Global state for server data | TanStack React Query |
| Skip validation on server | Always validate with Zod in Server Actions |
| Modify shadcn/ui source files | Wrap with a custom component |
| Components over ~150 lines | Extract sub-components, co-locate in folders |

## Before Committing

1. Run `{lint_format_cmd}`
2. Run `{pkg} run build` — ensure no build errors
3. Follow existing patterns in the codebase
```

---

## Customization Notes

When populating this template, inspect the project for:

| Field | Where to Find |
|-------|---------------|
| `{Next.js version}` | `package.json` → `dependencies.next` |
| `{package manager}` | Lockfile: `bun.lock` → bun, `pnpm-lock.yaml` → pnpm, `package-lock.json` → npm |
| `{eslint\|biome}` | Check for `biome.json` (biome) or `eslint.config.*` (eslint) |
| `{src_prefix}` | Check if `src/` exists or if `app/` is at root level |
| `{atomic_design}` | Check for `atoms/`, `molecules/`, `organisms/` under `components/` |
| `{extra_dirs}` | Check for `repository/`, `store/`, `context/`, `utils/`, `actions/` |
| `{lint_format_cmd}` | biome: `bunx --bun biome check --write .`; eslint: `{pkg} run lint --fix` |
| Auth pattern | Check for `next-auth`, `@supabase/ssr`, custom JWT (`jose`), or cookie-based |
| Data fetching | Check for TanStack Query, SWR, or plain fetch with Server Components |
| CMS | Check for `@storyblok/react`, `contentful`, `sanity`, etc. |
| ORM | Check for `@prisma/client`, `drizzle-orm`, or direct Supabase client |
