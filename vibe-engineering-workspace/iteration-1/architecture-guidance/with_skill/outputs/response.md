# Response: Structuring a TypeScript Microservice for AI-Friendly Development

Great question -- and before jumping into recommendations, I want to flag that this is exactly the kind of decision that benefits from the **Spec > Plan > Build** pipeline. You're making foundational architecture choices that will shape every future interaction with AI tools on this codebase. Let me walk you through how I'd approach this.

## Step 1: Start With a Spec

Before laying down any project structure, write a short spec (even 10 minutes is enough). For your inventory service, it might look like:

```markdown
# Spec: Inventory Management Service

## Problem
We need a standalone microservice to manage inventory (stock levels, SKUs, warehouse locations)
that integrates with our existing orders service via REST.

## Success Criteria
- [ ] CRUD operations for inventory items with typed request/response contracts
- [ ] REST integration with the orders service (stock reservation, availability checks)
- [ ] Clear domain boundaries -- inventory logic does not leak into orders concerns
- [ ] A new developer (or AI agent) can add an endpoint by following a single golden path

## Non-Goals
- UI / frontend
- Real-time inventory streaming (future scope)
- Migrating existing orders service logic

## Constraints
- TypeScript, Node.js runtime
- REST API (matching orders service patterns)
- Must be independently deployable
```

Write this to a file (`SPEC.md` or `.planning/spec.md`) so it persists across sessions. Every downstream decision references this document.

## Step 2: Project Structure -- Contracts First, Domain-Based Layout

Here is the structure I recommend. It follows the AI-friendly architecture principles: **contracts first**, **domain-based grouping**, **explicit naming**, and **self-documenting structure**.

```
inventory-service/
  SPEC.md                          # What we're building (the spec above)
  CLAUDE.md                        # AI session rules, coding standards, repo conventions
  .planning/
    adr/                           # Architecture Decision Records
      001-rest-over-grpc.md
      002-domain-based-structure.md
  contracts/
    api.openapi.yaml               # REST API contract (OpenAPI 3.x)
    types.ts                       # Shared TypeScript type definitions
    orders-client.types.ts         # Types for the orders service integration
  src/
    inventory/
      inventory.service.ts         # Business logic
      inventory.controller.ts      # HTTP handler / route definitions
      inventory.repository.ts      # Data access
      inventory.types.ts           # Domain-specific types
      inventory.test.ts            # Co-located tests
    orders-integration/
      orders-client.service.ts     # REST client for orders service
      orders-client.test.ts
    shared/
      errors.ts                    # Typed error classes (not string-based)
      config.ts                    # Env config with clear names and defaults
      middleware/
        auth.middleware.ts
        validation.middleware.ts
  templates/
    new-endpoint.ts.template       # Golden path template for adding endpoints
  PATTERNS.md                      # Documents the one right way to add each component type
  tsconfig.json
  package.json
```

### Why This Structure Works Well With AI Tools

**1. Contracts live in their own top-level directory.**
When you ask an AI to "add a new endpoint," it can read `contracts/api.openapi.yaml` and `contracts/types.ts` to understand the shape of data before writing any implementation. This eliminates guesswork. Define the OpenAPI spec and TypeScript interfaces *before* asking an AI to scaffold the implementation.

**2. Domain-based grouping, not layer-based.**
All inventory-related files live in `src/inventory/`. An AI searching for "how does inventory work" finds everything in one place -- service, controller, repository, types, and tests. Compare this with a layer-based structure where the AI has to hopscotch between `services/inventory.ts`, `controllers/inventory.ts`, `types/inventory.ts`, and `tests/inventory.test.ts` across four directories.

**3. Co-located tests.**
`inventory.test.ts` sits right next to `inventory.service.ts`. An AI writing or modifying the service can immediately see and update the tests. No hunting through a separate `__tests__/` tree.

**4. Descriptive file names with the `[domain].[layer].ts` convention.**
`inventory.service.ts` tells you exactly what's inside without opening the file. An AI navigating the codebase can reason about file purposes from names alone.

**5. A `PATTERNS.md` and `templates/` directory define the golden path.**
When there's only one right way to add a new endpoint, the AI will follow it consistently. Without this, the AI might invent a different pattern each time, or pick inconsistently from multiple existing styles.

**6. Typed errors in `shared/errors.ts`.**
Instead of `throw new Error("not found")`, define classes like `InventoryNotFoundError`, `InsufficientStockError`. This gives AI-generated code clear error handling paths and makes error flows greppable.

**7. `CLAUDE.md` at the project root.**
This is where you put instructions that persist across AI sessions: coding standards, naming conventions, "never do X" rules, preferred libraries. AI tools read this at session start. Example content:

```markdown
# CLAUDE.md

## Stack
- Runtime: Node.js 20+, TypeScript 5.x strict mode
- Framework: Fastify (or Express -- pick one, document it here)
- Testing: Vitest
- Linting: ESLint + Prettier

## Conventions
- All new endpoints follow the pattern in `templates/new-endpoint.ts.template`
- Domain types go in `[domain].types.ts`, not in the service file
- All errors extend the base classes in `shared/errors.ts`
- Environment variables are accessed only through `shared/config.ts`

## Testing
- Every service method has a corresponding test
- Tests are co-located: `foo.test.ts` next to `foo.service.ts`
- Use dependency injection for testability (pass repositories to services)
```

**8. ADRs in `.planning/adr/` capture the "why."**
When you decide "REST over gRPC because the orders service uses REST," write a short ADR. This prevents an AI from later "helpfully" suggesting you migrate to gRPC, and it gives future sessions context about constraints they can't infer from code alone.

## Step 3: Memory Management for Multi-Session Work

Since you'll be building this over multiple sessions, set up memory from day one:

- **`SPEC.md`** -- the source of truth for what you're building
- **`CLAUDE.md`** -- persistent coding rules and conventions
- **`.planning/adr/`** -- architectural decisions and their rationale
- **`PATTERNS.md`** -- the golden paths for common tasks

At the end of each work session, update `CLAUDE.md` or a dedicated `MEMORY.md` with:
- What was completed
- What's next (concrete, actionable items)
- Any gotchas or non-obvious discoveries
- Key files that were modified

This means the next session -- whether it's you, a teammate, or a fresh AI context window -- can pick up exactly where work left off.

## Step 4: Orders Service Integration

For the REST integration with your orders service, a few specific recommendations:

- **Define the orders client contract in `contracts/orders-client.types.ts`** before writing the client. Include the request/response shapes you expect from the orders API.
- **Isolate the integration in `src/orders-integration/`** as its own domain. This keeps the inventory domain clean and makes the integration surface explicit.
- **Use dependency injection** so tests can swap in a mock orders client without hitting the real service.

## The AI-Friendly Architecture Checklist

Before you start building, verify your setup against this checklist:

- [ ] Contracts/interfaces defined before implementations
- [ ] One golden path per component type (documented in `PATTERNS.md`)
- [ ] Domain-based directory structure
- [ ] Descriptive file and function names (`[domain].[layer].ts`)
- [ ] Co-located tests
- [ ] Explicit imports (minimal barrel files)
- [ ] Key architectural decisions documented (ADRs)
- [ ] README breadcrumbs in complex directories
- [ ] Typed errors (not string-based error handling)
- [ ] Environment config with clear names and defaults

## What to Do Next

Following the Vibe Engineering pipeline:

1. **Finalize the spec** -- take the draft above, customize it to your actual requirements, and save it as `SPEC.md`.
2. **Brainstorm the plan** -- explore specific questions like: which HTTP framework? How will you handle auth? What does the data model look like?
3. **Write the plan** -- map concrete tasks to your success criteria.
4. **Build with TDD** -- start with contracts, then scaffold the first domain module with tests, then iterate.

The key insight: the 30 minutes you spend on structure and contracts up front will save hours of AI-generated code that misses the mark. Speed is not how fast you type -- it is how fast your system tells you the truth.
