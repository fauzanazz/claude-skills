# Hono Backend AGENTS.md Template

Use this template for projects built with **Hono + Bun + Drizzle ORM + PostgreSQL**.

Populate each section by inspecting the actual project. Replace `{placeholders}` with real values.

---

## Template

```markdown
# AGENTS.md

Instructions for AI agents working on this codebase.

## Stack

Hono (OpenAPIHono), Bun, TypeScript, Drizzle ORM, PostgreSQL, Redis, Zod

## Commands

\```bash
bun run dev                          # Dev server (hot reload via --hot)
bun run build                        # Production build
bunx --bun biome check --write .     # Lint & format (use instead of tsc)
bun run test                         # Run tests
bun run db:generate                  # Generate Drizzle migrations
bun run db:migrate                   # Apply migrations
\```

> **Runtime:** Only use `bun`. Never use npm, yarn, pnpm, or Node.js.

## Structure

\```
src/
├── index.ts              # Server entry point & lifecycle bootstrap
├── app.ts                # Hono app setup, CORS, global error handler
├── config/               # Zod-validated environment config
├── api/v1/
│   ├── routes/           # OpenAPI route definitions (Zod schemas)
│   └── controllers/      # Route handlers (thin — delegate to services)
├── services/             # Business logic
├── repositories/         # Data access layer (Drizzle queries)
├── db/
│   ├── schema/           # Drizzle table definitions (pgTable, pgEnum)
│   └── drizzle.ts        # DB connection pool & circuit breaker
├── middlewares/           # Auth, role, cache, rate-limit, logging
├── lib/                  # Shared utilities (errors, auth, storage)
├── types/                # Shared TypeScript type definitions
└── utils/                # Pure helper functions
\```

## Architecture

### Layered Pattern (Strict)

\```
Route Definition (.route.ts)   ← OpenAPI spec: method, path, Zod request/response schemas
        ↓
Controller (.controller.ts)    ← Parse request, call service, return response
        ↓
Service (.service.ts)          ← Business logic, orchestration, validation
        ↓
Repository (.repository.ts)   ← Data access via Drizzle ORM
        ↓
Schema (.schema.ts)            ← Drizzle table definitions
\```

**Rules:**
- Controllers are **thin** — parse input, call service, return `c.json(result, statusCode)`
- Services contain **all business logic** — never in controllers or repositories
- Repositories encapsulate **all Drizzle queries** — services never import `db` directly
- Routes define **OpenAPI metadata** — Zod schemas for request validation and response typing

### Route Definition Pattern

Every endpoint is defined as an OpenAPI route with Zod schemas:

\```typescript
export const getItemRoute = createRoute({
  operationId: 'getItem',
  tags: ['items'],
  method: 'get',
  path: '/{id}',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { content: { 'application/json': { schema: itemResponseSchema } }, description: 'Success' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});
\```

### Router Factory

Use the appropriate factory for each router:

| Factory | Use When |
|---------|----------|
| `createRouter()` | Public/unprotected endpoints |
| `createAuthRouter()` | Endpoints requiring authentication |
| `createTypedRouter()` | Child routers under an already-authenticated parent |

### Drizzle Schema Pattern

\```typescript
export const item = pgTable('item', {
  id: varchar('id').primaryKey().unique().$defaultFn(createId),
  name: text('name').notNull(),
  status: statusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').$defaultFn(getNow).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(getNow).$onUpdate(getNow).notNull(),
}, (table) => ({
  statusIdx: index('item_status_idx').on(table.status),
}));

export type Item = typeof item.$inferSelect;
export type ItemInsert = typeof item.$inferInsert;
\```

**Conventions:**
- UUID primary keys via `v4()` or `createId()`
- `$defaultFn(getNow)` for timestamps
- `pgEnum()` for all enumerated columns
- Composite indexes for common query patterns
- Export inferred `$inferSelect` and `$inferInsert` types

### Error Handling

\```typescript
throw new ApiError({
  status: 404,
  category: 'VALIDATION',
  message: 'Item not found',
  details: { itemId },
});
\```

**Categories:** `AUTH`, `PERMISSION`, `VALIDATION`, `EXTERNAL`, `INTERNAL`

- INTERNAL errors are **sanitized** — no details/stack traces leak to client
- Domain errors use `ApiError` — never raw `HTTPException`

### Middleware

| Middleware | Purpose |
|-----------|---------|
| Auth | Local JWT verification (no network call), JIT user sync |
| Role | Role-based access (admin, member, etc.) |
| Cache | Redis-backed HTTP response caching with locking |
| Rate Limit | Request rate limiting |
| Logging | Request/response logging via Pino |

## Code Style (Biome)

- **Quotes:** Single quotes
- **Line width:** 80 characters
- **Trailing commas:** Always
- **Semicolons:** Always
- **Imports:** `import type` enforced for type-only imports (`useImportType: error`)
- **Unused:** `noUnusedImports: error`, `noUnusedVariables: error`

## TypeScript

- `strict: true` with `noImplicitAny`
- Path aliases: `@/*` → `./src/*`
- Target: ES2020, ESNext modules, Bundler resolution

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Business logic in controllers | Move to service layer |
| Raw Drizzle queries in services | Use repository methods |
| HTTP exceptions in services | Throw domain `ApiError` with category |
| Skip route Zod schemas | Every endpoint needs request + response schemas |
| `new` inside service constructors | Inject dependencies via FastAPI-style `Depends()` or constructor |
| Skip the repository layer | Even for simple queries, wrap in a repository |
| Hardcode config values | Use Zod-validated env config |
| Use npm/yarn/pnpm | Bun only — runtime, package manager, and test runner |

## Before Committing

1. Run `bunx --bun biome check --write .`
2. Run `bun run build`
3. Follow existing patterns in the codebase
```

---

## Customization Notes

When populating this template, inspect the project for:

| Field | Where to Find |
|-------|---------------|
| DB connection | `src/db/drizzle.ts` — check for circuit breaker, pool config |
| Auth strategy | `src/middlewares/auth.middleware.ts` — JWT, API key, service token |
| MCP Server | Check for `src/mcp-server/` directory |
| Job scheduler | Check for `src/jobs/` directory |
| WebSocket support | Check `src/index.ts` for `websocket` config in `Bun.serve()` |
| API versioning | Check route mounting path (`/api/core/v1`, `/api/v1`, etc.) |
| External integrations | Check `src/services/` for third-party service wrappers |
| OpenAPI docs | Check for Scalar (`@scalar/hono-api-reference`) or Swagger UI |
