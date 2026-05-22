---
name: ai-service-architecture
description: Use when designing, reviewing, or refactoring AI agent systems, multi-agent orchestration, LLM tool-calling architectures, or AI service backends. Triggers on "AI architecture", "agent system design", "sub-agent spawning", "agent orchestration", "RAG design", "document intelligence".
---

# AI Service Architecture Patterns

Proven patterns (and gotchas) from production AI agent systems. **Platform-agnostic** — works on Cloudflare, AWS, GCP, or bare metal.

## When to Use

- Designing multi-agent or tool-calling AI systems
- Reviewing agent architecture for flaws
- Choosing orchestration patterns (swarm, sequential, agentic)
- Building document/RAG or voice pipelines
- Evaluating embeddings vs structured metadata for retrieval

## Core Patterns

### 1. Brain vs Hands

```
Stateful Brain   ← History, memory, MCP. Decides WHAT.
Stateless Hands  ← (agent, task) → result. Just DOES.
```

**Rule**: A sub-agent gets a **task**, never a **context**. Sub-agents are ephemeral sandboxes — create per invocation, discard after. Faults are contained. Testing is trivial (pure function).

### 2. Metacognitive Tools

**Don't** build confirmation dialogs. **Do** make guardrails tools the LLM navigates:

```
LLM calls delete → returns { confirmation_required: true, id }  → LLM explains why
User confirms    → LLM calls delete WITH id                       → executes
```

Server enforces: id integrity, 2-min expiry, args match. LLM handles: explaining, negotiating.

### 3. Composability Pyramid

```
Workflow  ← DAG, graph-validated. References agents.
  Agent   ← Strategy (parallel|sequential|router|agentic) + skills.
  Skill   ← Atomic: LLM prompt or service handler.
```

Each layer consumes ONLY the layer below. Adding a "voting" strategy touches only Agent.

### 4. Metadata-First RAG (No Embeddings)

Pre-compute structured metadata at ingestion (sections, entities, findings, tags via LLM). At query time, inject only the metadata. LLM navigates via `fetch_content(page, line)` tool.

**Use when**: <10K docs, can afford ingestion-time LLM cost. No embeddings needed.
**Skip when**: Web-scale search, real-time content.

### 5. Swarm Dispatch

```typescript
// LLM makes ONE call:
dispatch({ tasks: [{agent: "review", task: "..."}, {agent: "comply", task: "..."}] })
// System fans out via Promise.allSettled. Individual failures don't stop the swarm.
```

**Rule**: LLMs decompose; systems parallelize. Don't ask the LLM to orchestrate concurrency.

### 6. Depth-Budgeted Recursion

```typescript
{ depth: 0, visited: [], maxInvocations: 15, count: 0 }
```

Carry immutable budget through every spawn. Check at entry. Increment before spawn. Fail fast.

**Critical**: Budget MUST be propagated. A single `depth: 0` hardcode undoes the entire safety net.

### 7. Dual Storage by Access Pattern

| Read-heavy, single-tenant | → Local/embedded DB |
| Write-heavy, multi-tenant | → Central DB (Postgres) |

Cache the secondary. Source of truth can differ per subsystem.

## Top Gotchas

| # | Gotcha | Fix |
|---|--------|-----|
| 1 | Swarm/agent tools hardcode `depth: 0, visited: []` — recursion budget bypassed | Accept and propagate budget from calling context |
| 2 | Memory mirror is fire-and-forget HTTP with no retry/DLQ — silent data loss | Route through a queue, not direct HTTP |
| 3 | Ephemeral sandboxes have cold start latency compounding with depth | Pass configs inline; use lightweight calls for leaf nodes |
| 4 | Every message triggers a separate LLM call for memory extraction (2x cost) | Extract in same pass with structured output, or batch |
| 5 | Limits defined in constants but never enforced on the hot path | Wire every limit or delete the constant |
| 6 | Keyword-only document retrieval — no semantic search, no synonyms | Add lightweight embeddings or LLM synonyms at ingestion |
| 7 | Voice pipeline completely isolated — no tools, memory, or orchestrator access | Route transcribed text through same orchestrator |
| 8 | No shared code between apps — types duplicated across ai-worker/be-core/portal | Extract `packages/shared` with types and Zod schemas |

## Design Principles

1. **Compose platform primitives; skip frameworks.** DOs + Queues + KV + AI SDK is an entire agent framework.
2. **Separate what remembers from what computes.** Stateful orchestrator + stateless runners.
3. **Let the LLM navigate guardrails.** Confirmation as a tool, not a dialog.
4. **Pre-compute structure; retrieve precisely.** TOC + fetch tool beats vector search at moderate scale.
5. **Propagate budgets; don't centralize.** Three counters through every spawn > distributed rate limiter.
6. **Match storage to access pattern.** Different subsystems, different primary stores.
7. **LLM describes work; system executes.** "Dispatch many" tool > sequential tool calls.
8. **Enforce or delete every limit.** Dead constants create false confidence.
