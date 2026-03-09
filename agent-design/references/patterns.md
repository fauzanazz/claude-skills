# Agent Design Patterns — Deep Reference

## Tool Parameter Design

### Naming Conventions
- Tool names should be verb-noun: `SearchFiles`, `CreateTask`, `AskUserQuestion`
- Parameters use snake_case and descriptive names
- Avoid generic names like `data`, `input`, `options` — be specific about what the parameter represents

### Parameter Schema Guidelines
- Prefer flat schemas over nested objects — models handle flat parameters more reliably
- Use enums for constrained choices instead of free-text with instructions
- Required vs. optional: only require what the tool genuinely can't function without
- Default values should represent the most common use case

### Error Handling in Tools
- Return structured errors the model can act on, not raw stack traces
- Include a `suggestion` field in error responses so the model knows what to try next
- Distinguish between retryable errors (timeout, rate limit) and terminal errors (bad input)

---

## Claude API Tool Calling Specifics

### Tool Definition Structure
Tools are defined with `name`, `description`, and `input_schema` (JSON Schema). The description
is what the model reads to decide whether to call the tool — invest time in writing clear,
specific descriptions.

### Tool Use Flow
1. Model returns a `tool_use` content block with `name` and `input`
2. Your harness executes the tool and returns a `tool_result`
3. Model processes the result and decides next action

### Common Pitfalls
- Don't return massive tool results — truncate or summarize. The model's context window is finite.
- If a tool result is empty, say so explicitly ("No results found") rather than returning nothing.
- Tool descriptions that overlap cause the model to pick the wrong tool. Test for this.

---

## MCP Integration Patterns

MCP (Model Context Protocol) servers extend an agent's capabilities without modifying the core
tool set. Design considerations:

- MCP tools appear alongside native tools — ensure descriptions don't conflict
- MCP adds latency per tool call — factor this into agent loop design
- Use MCP for external integrations (APIs, databases, services) rather than core agent logic
- Test MCP tool discovery: does the model find and use MCP tools when appropriate?

---

## Prompt Caching for Agent Loops

Agent loops make many API calls with overlapping context. Prompt caching reduces cost and latency:

- System prompt and tool definitions are cached across turns
- Structure your system prompt so the stable parts come first (tools, instructions) and dynamic
  parts (conversation history, task state) come last
- Cache breakpoints: place them after your tool definitions and static instructions
- Monitor cache hit rates — low hit rates suggest your prompt structure isn't cache-friendly

---

## Progressive Disclosure Implementation Patterns

### Skill File Pattern
```
skill/
├── SKILL.md          ← Always loaded on trigger (~metadata + core instructions)
└── references/
    ├── api-guide.md  ← Loaded when model encounters API questions
    ├── examples.md   ← Loaded when model needs concrete examples
    └── edge-cases.md ← Loaded when model hits unusual situations
```

SKILL.md contains pointers: "For API-specific guidance, read `references/api-guide.md`."
The model reads deeper files only when needed.

### Search-Based Discovery
Give the model search tools (grep, file search, web search) and let it find context itself.
This works well for capable models and scales to large codebases or knowledge bases.

### Subagent Specialist
For complex knowledge domains, create a subagent whose sole job is retrieving relevant context.
The main agent delegates "find out about X" to the specialist, which returns a concise summary.
This keeps the main agent's context clean.

---

## Evaluation Framework

### Trace Analysis Template

When reading agent traces, fill in:

1. **Task given**: What was the agent asked to do?
2. **Tools called** (in order): List each tool call with key parameters
3. **Decision points**: Where did the model choose between alternatives?
4. **Wasted steps**: Any tool calls that didn't contribute to the final result?
5. **Missing capabilities**: Did the model try to do something it couldn't?
6. **Final outcome**: Did it succeed? Partially? How many turns?

### Regression Testing

After changing tools or prompts:
- Rerun previous test cases to catch regressions
- Compare tool call sequences, not just final output
- Track token usage and latency — tool changes can have surprising cost implications
- Keep a log of what changed and why, so you can roll back if needed
