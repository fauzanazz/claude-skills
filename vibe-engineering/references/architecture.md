# AI-Friendly Architecture Guide

Codebases that are easy for AI to navigate produce dramatically better AI-assisted results.
This guide covers patterns that make your codebase a force multiplier for AI collaboration.

## Principle: Reduce Ambiguity

AI struggles with the same things junior engineers struggle with: implicit conventions,
hidden dependencies, magic strings, and "you just have to know" patterns. Every piece of
ambiguity you remove makes AI assistance more reliable.

## Contracts First

Define interfaces before implementations. This gives AI (and humans) a clear target to code against.

**Do this:**
- Write OpenAPI/GraphQL/protobuf schemas before implementing endpoints
- Define TypeScript interfaces before implementing classes
- Create type definitions for shared data structures
- Document API contracts in a discoverable location

**Why it matters for AI:**
- AI can scaffold correct implementations from a contract
- Mock generation becomes deterministic
- Type errors surface at compile time, not runtime
- Contract changes are explicit and reviewable

**Pattern:**
```
contracts/
  api.openapi.yaml     # REST API contract
  events.proto         # Event schemas
  types.ts             # Shared type definitions
src/
  services/            # Implementations of contracts
  handlers/            # API endpoint handlers
```

## Golden Paths

Establish one sanctioned way to add each type of component. When there's only one right way
to do something, AI will find it and follow it consistently.

**What to standardize:**
- Adding a new API endpoint
- Adding a new UI component
- Adding a new database migration
- Adding a new background job
- Adding a new test

**How to enforce:**
- Code generators / CLI scaffolding (e.g., `pnpm generate:endpoint`)
- Template files in a `templates/` directory
- A `CONTRIBUTING.md` or `PATTERNS.md` that describes the golden path
- Linting rules that catch deviations

**Anti-pattern:** Multiple valid ways to do the same thing. If your codebase has endpoints
defined in 3 different styles, AI will pick one at random (or worse, invent a 4th).

## Explicit Over Implicit

Favor clarity over cleverness in every dimension:

- **File naming** — `UserAuthService.ts` over `auth.ts`; `createOrderHandler.ts` over `handler.ts`
- **Directory structure** — group by domain/feature, not by file type
- **Imports** — explicit imports over barrel files when possible
- **Configuration** — environment variables with clear names and defaults
- **Error handling** — typed errors with descriptive messages

**Domain-based structure (preferred):**
```
src/
  orders/
    orders.service.ts
    orders.controller.ts
    orders.types.ts
    orders.test.ts
  users/
    users.service.ts
    users.controller.ts
    users.types.ts
    users.test.ts
```

**Type-based structure (harder for AI to navigate):**
```
src/
  services/
    orders.ts
    users.ts
  controllers/
    orders.ts
    users.ts
  types/
    orders.ts
    users.ts
```

## Evented / Pub-Sub Patterns

Event-driven architectures reduce temporal coupling, making it easier for AI to reason
about individual components without understanding the entire call chain.

**Benefits for AI:**
- Each handler can be understood in isolation
- Adding new behavior = adding a new subscriber (no existing code changes)
- Testing is straightforward — emit event, assert handler behavior
- Side effects are explicit and traceable

**When to use:**
- Cross-cutting concerns (logging, analytics, notifications)
- Multi-step workflows where steps are independent
- Integration points between bounded contexts

**When NOT to use:**
- Simple request/response flows
- When you need synchronous guarantees
- When the overhead of an event bus exceeds the complexity it manages

## Self-Documenting Structure

Your file and folder names should tell AI what's inside without reading the contents.

**Naming conventions:**
- Files: `[domain].[layer].[ext]` — e.g., `orders.service.ts`, `orders.controller.ts`
- Directories: domain names, not technical categories
- Test files: co-located with source, named `*.test.*` or `*.spec.*`

**README breadcrumbs:** A short README.md in key directories explaining:
- What this directory contains
- How to add a new component here
- Key files and their purposes

These are cheap to write and enormously helpful for AI navigating the codebase.

## Architecture Decision Records (ADRs)

When you make a non-obvious architectural choice, write a brief ADR:

```markdown
# ADR: [Title]
**Status:** Accepted
**Context:** [What prompted this decision]
**Decision:** [What we decided]
**Rationale:** [Why this over alternatives]
**Consequences:** [What this means going forward]
```

Store in `docs/adr/` or `.planning/adr/`. AI references these when it encounters the pattern
and understands *why* things are the way they are — preventing it from "helpfully" refactoring
toward a different approach.

## Checklist: Is My Codebase AI-Friendly?

- [ ] Contracts/interfaces defined before implementations
- [ ] One golden path per component type
- [ ] Domain-based directory structure
- [ ] Descriptive file and function names
- [ ] Co-located tests
- [ ] Explicit imports (minimal barrel files)
- [ ] Key architectural decisions documented
- [ ] README breadcrumbs in complex directories
- [ ] Typed errors (not string-based error handling)
- [ ] Environment config with clear names and defaults
