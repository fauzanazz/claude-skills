# Response: Structuring a TypeScript Microservice for AI-Friendly Development

Great question. Here's how I'd structure an inventory management microservice that's both well-architected and easy to work with using AI tools like Claude Code.

## Recommended Project Structure

```
inventory-service/
├── src/
│   ├── index.ts                  # Entry point, server bootstrap
│   ├── config/
│   │   └── index.ts              # Environment config with validation
│   ├── routes/
│   │   ├── index.ts              # Route registration
│   │   ├── inventory.routes.ts   # Inventory endpoints
│   │   └── health.routes.ts      # Health check
│   ├── handlers/
│   │   ├── inventory.handler.ts  # Request/response handling
│   │   └── health.handler.ts
│   ├── services/
│   │   ├── inventory.service.ts  # Business logic
│   │   └── orders.client.ts      # REST client for orders service
│   ├── repositories/
│   │   └── inventory.repo.ts     # Data access layer
│   ├── models/
│   │   ├── inventory.ts          # Domain types/interfaces
│   │   └── orders.ts             # Types for orders service responses
│   ├── middleware/
│   │   ├── error-handler.ts      # Global error handling
│   │   ├── auth.ts               # Auth middleware
│   │   └── validation.ts         # Request validation
│   ├── errors/
│   │   └── index.ts              # Custom error classes
│   └── utils/
│       └── logger.ts             # Structured logging
├── tests/
│   ├── unit/
│   │   └── services/
│   │       └── inventory.service.test.ts
│   ├── integration/
│   │   └── routes/
│   │       └── inventory.routes.test.ts
│   └── fixtures/
│       └── inventory.fixtures.ts
├── CLAUDE.md                     # Instructions for Claude Code
├── tsconfig.json
├── package.json
├── .env.example
└── Dockerfile
```

## Key Principles

### 1. One concern per file, clear naming

AI tools navigate by file names and grep. When a file is called `inventory.service.ts` and lives in `services/`, any AI agent can find it immediately. Avoid barrel files that re-export everything -- they obscure where code actually lives.

### 2. Explicit types, no inference for public APIs

```typescript
// Good -- AI can read the contract without tracing through implementations
export interface InventoryItem {
  sku: string;
  quantity: number;
  warehouseId: string;
  lastUpdated: Date;
}

export interface InventoryService {
  getItem(sku: string): Promise<InventoryItem | null>;
  adjustQuantity(sku: string, delta: number): Promise<InventoryItem>;
  reserveStock(sku: string, orderId: string, quantity: number): Promise<Reservation>;
}
```

Explicit interfaces mean AI tools can understand the contract from a single file read, without needing to trace through the implementation.

### 3. Dependency injection via constructor parameters

```typescript
export function createInventoryService(
  repo: InventoryRepository,
  ordersClient: OrdersClient,
  logger: Logger
): InventoryService {
  return {
    async getItem(sku) {
      // ...
    },
  };
}
```

This makes dependencies visible in one place. AI tools can see what a service needs without scanning for imports scattered across the file. It also makes testing straightforward.

### 4. Separate the orders client cleanly

```typescript
// src/services/orders.client.ts
export interface OrdersClient {
  getOrder(orderId: string): Promise<Order>;
  getOpenOrdersForSku(sku: string): Promise<Order[]>;
}

export function createOrdersClient(config: { baseUrl: string; apiKey: string }): OrdersClient {
  // Implementation using fetch or axios
}
```

Keep the external service integration behind an interface. This gives you a clear seam for mocking in tests and makes the dependency on the orders service explicit.

### 5. Add a CLAUDE.md file

This is the single highest-impact thing you can do for AI-assisted development. Put a `CLAUDE.md` at the project root with:

```markdown
# Inventory Service

## Quick start
npm install && npm run dev

## Test commands
npm test              # all tests
npm run test:unit     # unit tests only
npm run test:int      # integration tests (needs DB)

## Architecture
- Framework: Hono (or Express/Fastify -- whatever you pick)
- Database: PostgreSQL via Drizzle ORM
- External deps: Orders service at ORDERS_SERVICE_URL

## Conventions
- All business logic in src/services/, never in handlers
- Handlers only do: parse request, call service, format response
- Use Zod schemas for request validation
- Errors: throw typed errors from src/errors/, middleware catches them
- Tests mirror src/ structure under tests/unit/ and tests/integration/

## Environment
Copy .env.example to .env for local development.
```

### 6. Use Zod for runtime validation with type inference

```typescript
import { z } from "zod";

export const AdjustQuantitySchema = z.object({
  sku: z.string().min(1),
  delta: z.number().int(),
  reason: z.string().optional(),
});

export type AdjustQuantityRequest = z.infer<typeof AdjustQuantitySchema>;
```

Zod gives you runtime validation and TypeScript types from a single source. AI tools can read one schema definition and understand both the validation rules and the types.

### 7. Keep tests next to what they test (mirrored structure)

The mirrored `tests/` structure makes it trivial for AI tools to find relevant tests. When working on `src/services/inventory.service.ts`, the tests are predictably at `tests/unit/services/inventory.service.test.ts`.

### 8. Config validation at startup

```typescript
// src/config/index.ts
const ConfigSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  ORDERS_SERVICE_URL: z.string().url(),
  ORDERS_API_KEY: z.string().min(1),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  return ConfigSchema.parse(process.env);
}
```

Fail fast on missing config. This also serves as living documentation of what environment variables the service needs.

## Framework Recommendation

For a new microservice in 2026, I'd suggest **Hono** -- it's lightweight, has excellent TypeScript support, and works well with AI tools because its API surface is small and predictable. Fastify is another solid choice if you want a more established ecosystem.

## Summary of What Makes This AI-Friendly

| Practice | Why it helps AI tools |
|---|---|
| One file per concern | Grep and file search work immediately |
| Explicit interfaces | Contract readable from a single file |
| Constructor injection | Dependencies visible in one place |
| Zod schemas | Types + validation in one readable definition |
| CLAUDE.md | AI knows how to build, test, and navigate |
| Mirrored test structure | Predictable test file locations |
| Flat-ish directories | Fewer levels to navigate |
| .env.example | AI can set up the project without guessing |

The core idea: make everything discoverable and explicit. AI tools are great at reading code but struggle when behavior is hidden behind magic, decorators, or deep inheritance hierarchies. The more "what you see is what you get" your codebase is, the better AI assistance you'll get.
