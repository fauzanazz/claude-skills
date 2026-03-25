---
name: agent-design
description: >
  Use when the user asks
  about building agents, designing tool sets for LLMs, structuring agent workflows, reviewing
  existing agent architectures, creating action spaces, coordinating subagents, or evaluating
  agent behavior. Also trigger when you see terms like "agent harness", "tool calling design",
  "action space", "agent loop", "progressive disclosure", "subagent", "elicitation", or when
  the user asks how to make an LLM interact with external tools effectively. Applies to
  Claude API agents primarily, but principles are model-agnostic. Do NOT use for
  generating AGENTS.md files — use the AgentsMD skill instead.
---

# Agent Design Skill

Help users design, review, and evaluate AI agent architectures. This skill draws heavily from
lessons learned building Claude Code and is grounded in one core philosophy:

> **See like an agent.** The best tool designs come from understanding what the model can
> actually do — not what you assume it can do. Read outputs, experiment, iterate.

## When to use this skill

- Designing a new agent's tool set / action space
- Reviewing or critiquing an existing agent architecture
- Planning multi-agent coordination patterns
- Creating evaluation frameworks for agent behavior
- Making decisions about tool granularity, naming, or parameters

## Core Principles

### 1. Tool Design — Shape Tools to the Model's Abilities

The fundamental question: *what tools would the model want in order to solve this problem, given its actual abilities?*

**The Granularity Spectrum.** Every tool design sits on a spectrum from "one god tool" (like bash) to "one tool per task" (50+ narrow tools). Neither extreme is ideal:

- Too few tools → the model has power but must figure out how to use general-purpose tools for specific tasks. Works well for capable models, badly for weaker ones.
- Too many tools → the model spends tokens deciding which tool to call. Each new tool adds cognitive load. The bar to add a tool should be high.

**Design heuristics:**

- Start minimal. Add tools only when you see the model struggling without them.
- A tool that the model doesn't understand how to call is worse than no tool at all.
- Name tools clearly — the model reads the name and description to decide whether to call it.
- Parameters should map to the model's natural way of thinking about the task. If you find yourself writing complex parameter schemas, the tool might be doing too much.
- When a tool conflates two concerns (like planning + questioning), split them.

**The AskUserQuestion lesson.** Claude Code tried three approaches to improve elicitation:
1. Adding question parameters to the ExitPlanTool → confused the model (two concerns in one tool)
2. Custom markdown output format → unreliable (model drifted from format)
3. Dedicated AskUserQuestion tool → worked well (structured output, clear purpose, model liked calling it)

The takeaway: a dedicated, well-scoped tool beats overloading an existing tool or relying on output format hacking.

### 2. Progressive Disclosure — Context Without Bloat

Not everything belongs in the system prompt. Progressive disclosure lets agents discover context on demand instead of carrying it all upfront.

**The pattern:**
- Give the agent a way to *search* for information rather than *receiving* all information
- Layer context: metadata always available → instructions on trigger → deep references on demand
- Skill files can reference other files that the model reads recursively — nested search across layers

**Why it matters:**
- Avoids context rot (irrelevant context degrades performance on the main task)
- Scales better than cramming everything into the prompt
- Models are increasingly good at building their own context when given search tools

**Example — Claude Code Guide Agent.** Instead of putting all docs in the system prompt, Claude Code gives the model a link to search its docs. When even that loaded too much irrelevant context, they built a specialized subagent for doc search. Result: new capability added without adding a tool.

**When to use progressive disclosure vs. a new tool:**
- If the model needs to *do something new* → consider a tool
- If the model needs to *know something new* → prefer progressive disclosure
- Progressive disclosure is cheaper to add and doesn't increase tool-selection cognitive load

### 3. Multi-Agent Coordination

When a single agent loop isn't enough, subagents let you decompose work. But coordination is hard.

**The TodoWrite → Task Tool evolution.** Claude Code started with a simple todo list to keep the model on track. Problems emerged:
- System reminders every 5 turns made the model think the list was rigid
- Smarter models found the reminders constraining rather than helpful
- Subagents couldn't share or coordinate on todos

The Task Tool replaced it with: dependencies between tasks, shared state across subagents, ability for agents to alter/delete tasks dynamically.

**Coordination patterns:**

| Pattern | Use when | Example |
|---|---|---|
| Sequential handoff | Tasks have hard dependencies | Parse → Validate → Transform |
| Parallel fan-out | Independent subtasks | Run N test cases simultaneously |
| Shared task board | Agents need mutual awareness | Multi-agent codebase refactor |
| Specialist subagent | One subtask needs deep context | Doc search agent, code review agent |

**Key insight:** As models improve, tools that were once necessary may become constraining. Constantly revisit whether your coordination primitives still serve the model or limit it.

### 4. Evaluation & Iteration — "See Like an Agent"

Building an agent is an empirical process. The only way to know if your design works is to run it and read the outputs.

**The iteration loop:**
1. Design the tool / action space
2. Run the agent on realistic prompts
3. Read the full traces (not just final output — read the tool calls, the reasoning, the failures)
4. Identify where the model struggles, gets confused, or wastes tokens
5. Adjust tools, prompts, or architecture
6. Repeat

**What to look for in traces:**
- Does the model call tools it shouldn't? → Tool descriptions may be ambiguous
- Does the model avoid calling tools it should? → Tool may be poorly named or described
- Does the model call the right tool with wrong parameters? → Parameter schema needs work
- Does the model take many steps for what should be simple? → Missing a tool or context
- Does the model get stuck in loops? → May need a different coordination pattern

**Model-specific behavior matters.** What works for one model may not work for another. Claude Code found that tool designs needed to be revisited when moving between model versions. Stick to a small set of models with similar capability profiles to reduce this burden.

---

## Output Frameworks

When using this skill, produce one or more of the following based on what the user needs.

### Architecture Review

When reviewing an existing agent design, analyze these dimensions:

1. **Tool inventory** — List all tools, their granularity, and whether each earns its place
2. **Context strategy** — How does the agent get the information it needs? System prompt vs. search vs. progressive disclosure
3. **Coordination model** — Single agent? Subagents? How do they communicate?
4. **Failure modes** — Where is the agent likely to get confused, stuck, or wasteful?
5. **Model-fit assessment** — Are the tools shaped to the model's actual abilities?

Provide specific, actionable recommendations — not just "consider simplifying."

### Design Document

When helping design a new agent, structure the output as:

1. **Agent purpose** — One sentence on what the agent does
2. **Action space** — The tools the agent needs, with rationale for each
3. **Context strategy** — What goes in the prompt vs. what's discovered progressively
4. **Coordination model** — Single agent or multi-agent, and why
5. **Evaluation plan** — How to test that the design works, with example prompts
6. **Risks and tradeoffs** — What could go wrong, what you're deliberately not building (YAGNI)

### Evaluation Checklist

A quick-reference checklist for evaluating agent behavior:

- [ ] Model calls the right tools for the right tasks
- [ ] Model doesn't hallucinate tool names or parameters
- [ ] Tool descriptions are unambiguous (no two tools compete for the same query)
- [ ] Context is sufficient without being bloated
- [ ] Agent completes tasks in a reasonable number of steps
- [ ] Agent handles edge cases gracefully (missing input, ambiguous request, errors)
- [ ] Agent asks for clarification when genuinely needed (not excessively)
- [ ] Subagents (if any) coordinate without deadlocks or redundant work
- [ ] System reminders / nudges help rather than constrain the model
- [ ] Design has been tested against the specific model version in use

---

## Anti-Patterns to Flag

When reviewing agent designs, actively flag these common mistakes:

- **The kitchen sink prompt** — Cramming everything into the system prompt instead of using progressive disclosure
- **Tool explosion** — Adding a tool for every edge case instead of designing flexible, composable tools
- **Format hacking** — Asking the model to output special formats instead of using structured tool calls
- **Stale assumptions** — Keeping tools/reminders that were needed for older models but now constrain newer ones
- **Invisible failures** — Not reading agent traces, only checking final output
- **The rigid plan** — Forcing the model to follow a fixed plan instead of letting it adapt
- **Subagent sprawl** — Using multi-agent coordination when a single agent with better tools would suffice

---

## Additional References

For deeper dives on specific patterns, read `references/patterns.md` which covers:
- Detailed tool parameter design guidelines
- Claude API tool calling specifics (tool_use blocks, error handling)
- MCP integration patterns
- Prompt caching strategies for agent loops
