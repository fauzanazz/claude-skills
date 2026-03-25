# Document Templates Reference

Templates for each document type. Apply one or combine multiple on the same document (composable).

## Feature Note Template

```markdown
---
title: [Feature Name]
type: feature-note
created: [YYYY-MM-DD]
status: completed
categories: [domain1, domain2]
related: []
author: [name]
---

# [Feature Name]

[One-sentence summary: what this feature does and why it exists.]

## Context

[2-3 paragraphs: the problem, who needed it, what triggered the work. Link to relevant tickets, conversations, or prior features.]

## How It Works

[Explain the implementation at a level useful to another developer. Cover the main flow, key abstractions, and how components interact. Use prose, not bullets.]

### Key Files

| File | Role |
|------|------|
| `path/to/file` | Brief description |

### API Surface (if applicable)

[Endpoints, function signatures, or interfaces introduced or changed.]

## Decisions & Trade-offs

[What choices were made and why. What alternatives were considered. This section can be expanded into a full ADR if the decision was significant enough.]

## Known Limitations

[Edge cases, performance caveats, things intentionally deferred. Be honest — future-you will thank present-you.]

## Related

[Bulleted list of links to related docs, features, ADRs, or external resources.]
```

## ADR (Architecture Decision Record) Template

```markdown
---
title: "ADR-[NNN]: [Decision Title]"
type: adr
created: [YYYY-MM-DD]
status: accepted
categories: [domain1, domain2]
related: []
author: [name]
supersedes: null
superseded_by: null
---

# ADR-[NNN]: [Decision Title]

## Status

[Accepted | Proposed | Superseded by ADR-XXX]

## Context

[What situation or problem prompted this decision? Link to the feature, incident, or requirement that triggered it.]

## Decision

[What was decided, stated clearly in 1-3 sentences.]

## Alternatives Considered

### [Alternative A]
[Description, pros, cons, why rejected.]

### [Alternative B]
[Description, pros, cons, why rejected.]

## Consequences

[What follows from this decision — positive outcomes, new constraints, migration needs, tech debt introduced. Be specific.]
```

## Changelog Entry Template

```markdown
---
title: [Version or Release Name]
type: changelog
created: [YYYY-MM-DD]
categories: [release]
related: []
---

# [Version / Date]

## Added
[New capabilities, features, endpoints.]

## Changed
[Modifications to existing behavior.]

## Fixed
[Bug fixes with brief context on what was broken.]

## Removed
[Deprecated features or dead code cleaned up.]

## Migration Notes
[Steps required for consumers/users to adopt this version, if any.]
```

## Developer Onboarding Template

```markdown
---
title: "Guide: [Module/Feature Name]"
type: onboarding
created: [YYYY-MM-DD]
status: completed
categories: [domain1]
related: []
author: [name]
---

# Working with [Module/Feature Name]

## Quick Start

[Minimum steps to get this module running locally or to make a change. Assume the reader has the repo cloned and dependencies installed.]

## Architecture Overview

[How this module fits into the larger system. A paragraph + a simple diagram description if helpful. Link to related feature notes or ADRs.]

## Common Tasks

### [Task 1: e.g., Adding a new endpoint]
[Step-by-step, with file paths and code references.]

### [Task 2: e.g., Running tests]
[Commands, environment setup, gotchas.]

## Troubleshooting

[2-3 common issues and their fixes. Things that tripped up previous developers.]
```

## Retrospective Note Template

```markdown
---
title: "Retro: [Feature/Sprint/Incident Name]"
type: retro
created: [YYYY-MM-DD]
categories: [domain1]
related: []
author: [name]
---

# Retro: [Feature/Sprint/Incident Name]

## Summary

[One paragraph: what was the scope, timeline, and outcome.]

## What Went Well

[Genuine positives — patterns to repeat.]

## What Didn't Go Well

[Honest assessment — not blame, but systemic observations.]

## Lessons Learned

[Actionable takeaways. Link to any ADRs or process changes that resulted.]

## Action Items

[Specific next steps with owners, if applicable.]
```

## Composing Multiple Templates

When a single document needs multiple types, merge sections rather than duplicating frontmatter. Example for a feature note that also records an ADR:

```yaml
---
title: Session Management with Redis
type: [feature-note, adr]
created: 2026-03-23
status: completed
categories: [auth, infrastructure]
related:
  - ./feature-auth-service.md
  - ./adr-003-remove-implicit-grant.md
author: belle
---
```

Then include sections from both templates in a logical order: Context → Decision (ADR) → How It Works (Feature) → Alternatives → Consequences → Known Limitations → Related.
