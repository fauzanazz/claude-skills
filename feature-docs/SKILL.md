---
name: feature-docs
description: Use when the user finishes implementing a feature, module, or component and needs documentation — changelogs, ADRs, developer notes, onboarding guides, or any post-implementation writeup. Also trigger on "document this feature", "write up what we built", "create docs for this", "ADR", "changelog entry", "feature notes", or when capturing decisions, trade-offs, or context about recently completed work. Works for any codebase or framework.
---

# Feature Documentation Skill

Generate rich, interconnected documentation after completing a feature. Inspired by Stefango's (Obsidian CEO) note-taking philosophy: minimal structure, heavy cross-referencing, composable templates, and speed-first capture.

## Core Philosophy

Three principles govern every doc this skill produces:

1. **File over app** — Output plain markdown. No proprietary format. Docs outlast tools.
2. **Speed over perfection** — Capture context NOW while it's fresh. Polish later. Use templates to eliminate blank-page friction.
3. **Link over organize** — Don't build deep folder trees. Instead, cross-reference aggressively. Link every first mention of a concept, module, person, or decision. Connections compound over time.

## When to Use

Trigger after any of these:
- A feature, bugfix, or refactor is complete and needs a writeup
- The user asks for an ADR (Architecture Decision Record)
- A changelog or release note is needed
- The user wants to capture "why we built it this way"
- Post-implementation developer notes or onboarding context is requested
- The user says "document this", "write up what we built", "capture the decisions"

## Step 1: Determine Document Type

Ask the user (or infer from context) which document type(s) they need. Multiple types can apply to the same feature — templates are composable.

| Type | Purpose | When to use |
|------|---------|-------------|
| **Feature Note** | What was built, how it works, key files | Default for any new feature |
| **ADR** | Why a decision was made, alternatives considered | Architectural choices, tech selection |
| **Changelog Entry** | User-facing summary of changes | Releases, deployments |
| **Developer Onboarding** | How to work with this code | Complex modules, team handoffs |
| **Retrospective Note** | What went well/wrong, lessons learned | Post-sprint, post-incident |

If unclear, default to **Feature Note**. Offer to layer additional types on top (composable templates).

## Step 2: Gather Context

Before writing, extract from the conversation history and any available code:

- **What changed** — Files modified, modules added, APIs introduced
- **Why** — The problem being solved, user story, or business driver
- **Decisions made** — Tech choices, patterns adopted, trade-offs accepted
- **Alternatives rejected** — What was considered but not chosen, and why
- **Dependencies** — Other modules, services, or teams affected
- **Gotchas** — Non-obvious behaviors, edge cases, known limitations

Don't ask the user to fill in everything manually. Extract what you can from the conversation, then confirm gaps.

## Step 3: Write the Documentation

Read `references/templates.md` for the exact template formats. Key rules:

### Linking Strategy (Critical)

Cross-reference aggressively using markdown links. Link the **first mention** of:
- Every module, service, or component name
- Every person or team mentioned
- Every related feature or ADR
- Every external tool, library, or API
- Every concept that has or could have its own doc

Use relative links for internal docs, URLs for external references. Unresolved links are fine — they signal future documentation opportunities, just like Obsidian's unresolved links set "indirect intentions."

**Example:**
```markdown
The [AuthService](../modules/auth-service.md) now supports [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
flow, replacing the previous [implicit grant](./adr-003-remove-implicit-grant.md) approach.
This was requested by the [Platform Team](../teams/platform.md) after the
[Q3 Security Audit](../notes/q3-security-audit.md) flagged token exposure risks.
```

### Properties / Frontmatter

Every doc gets YAML frontmatter with structured metadata. Properties replace folder organization — they make docs findable via search and tooling.

```yaml
---
title: Feature Name
type: feature-note        # feature-note | adr | changelog | onboarding | retro
created: 2026-03-23
status: completed          # draft | in-progress | completed | superseded
categories: [auth, security, api]  # domains this touches
related:                   # links to other docs
  - ./adr-005-pkce-adoption.md
  - ./feature-session-management.md
author: belle
rating: null               # 1-7 scale, optional — how impactful was this?
---
```

### Writing Style

- Lead with a **one-sentence summary** (the "what" in ≤ 20 words)
- Use **prose paragraphs** for narrative context, not bullet dumps
- Reserve bullets only for file lists, API endpoints, or genuinely list-shaped data
- Write for a developer joining 6 months from now — they have zero context
- Comments explain "why", prose explains "what" and "how"

### Composability

If a feature note also involves a major decision, don't create two separate files. Add both the Feature Note and ADR sections to the same document — just like applying multiple Obsidian templates to one note. Each section retains its own structure. The `type` frontmatter becomes a list: `type: [feature-note, adr]`.

## Step 4: Output

1. Create the markdown file(s) in the appropriate docs directory
2. If multiple docs are generated (e.g., feature note + changelog), present them all
3. Suggest where in the user's project these files should live (e.g., `docs/features/`, `docs/adr/`, `CHANGELOG.md`)
4. Offer a "what to document next" suggestion — identify unresolved links or areas that could benefit from their own note

## Rhythm Suggestion

After generating docs, briefly remind the user of a healthy documentation cadence:
- **Per feature** — Feature note + ADR if architectural decisions were made
- **Per release** — Changelog entry
- **Monthly** — Review recent feature notes, spot patterns, write a summary note
- **Quarterly** — Random-revisit old docs, update stale content, archive superseded ADRs

## Anti-Patterns to Avoid

- **Folder-first thinking** — Don't ask "where should this go?" Use categories/tags instead.
- **Documentation without links** — Isolated docs are dead docs. Every doc must link to at least 2 other things.
- **Template worship** — Templates are scaffolding, not forms. Skip sections that don't apply.
- **Perfectionism** — A rough doc written today beats a polished doc never written. Capture context while it's fresh.
