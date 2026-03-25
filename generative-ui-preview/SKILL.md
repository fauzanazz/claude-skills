---
name: generative-ui-preview
description: Use when the user wants to see a visual preview or mockup before implementation, or when confirming UI design before writing real components. Triggers on "preview first", "show me what it looks like", "mockup", "what will it look like", or when the user describes a UI and visual confirmation would prevent rework. Do NOT trigger on all frontend work — only when a preview step adds value.
---

# Generative UI Preview

## Overview

Generate a live HTML preview of a frontend feature before writing implementation code. The user reviews it in their browser, gives feedback, and you iterate until approved — then implement in the project's actual stack.

**Core principle:** A 30-second preview loop beats a 30-minute code-then-fix loop.

## When to Use

- Building any new UI component, page, or layout
- User describes a feature and you want to confirm the design
- Refactoring UI where visual regression matters
- User says "show me first" or "preview"

**When NOT to use:**
- Pure logic/API changes with no visual output
- Fixing a single CSS property (just fix it)
- User explicitly says "just build it"

## Checklist

You MUST create a task for each item and complete in order:

1. **Detect project stack** — read `package.json`, tailwind config, CSS variables, existing components
2. **Extract design tokens** — colors, fonts, spacing, border-radius from the project's config
3. **Generate preview HTML** — standalone file using project's design tokens + Tailwind CDN
4. **Open in browser** — show the user
5. **Collect feedback** — iterate until user approves
6. **Implement for real** — translate approved preview into actual project components

## Preview Generation

### Stack Detection

```bash
# Check what the project uses
cat package.json          # React? Vue? Svelte? Next.js?
cat tailwind.config.*     # Design tokens
cat src/**/*.css          # CSS variables
```

### Generate Preview File

Write to `.preview/<feature-name>.html`. This directory is gitignored.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview: [Feature Name]</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          // Inject project's design tokens here
          colors: { /* from tailwind.config or CSS vars */ },
          fontFamily: { /* from project */ },
        }
      }
    }
  </script>
  <style>
    /* Any project CSS variables */
    :root {
      /* --primary: #...; extracted from project */
    }
  </style>
</head>
<body>
  <!-- Generated UI matching user's description -->
  <!-- Use project's actual color scheme, typography, spacing -->
</body>
</html>
```

### Open Preview

```bash
# macOS
open .preview/feature-name.html

# Linux
xdg-open .preview/feature-name.html
```

### Ensure Gitignore

Add `.preview/` to `.gitignore` if not already present.

## Feedback Loop

After opening the preview, ask the user:

> Preview is open in your browser. What would you like to change?
> - Layout/structure
> - Colors/typography
> - Component sizing/spacing
> - Add/remove elements
> - Or: "looks good, implement it"

Each round: edit the preview HTML, re-save (browser auto-refreshes or user refreshes), collect feedback again.

## Implementation Translation

Once approved, translate the preview into the project's actual stack:

| Preview Element | React/Next.js | Vue | Svelte |
|---|---|---|---|
| HTML section | Component file (.tsx) | SFC (.vue) | .svelte file |
| Tailwind classes | Keep as-is (if project uses Tailwind) | Keep as-is | Keep as-is |
| Inline styles | Convert to styled-components/CSS modules | Scoped styles | Scoped styles |
| Static data | Props + types | Props + types | Props + types |
| Interactivity | Event handlers + state | Event handlers + reactive | Event handlers + stores |

## Common Mistakes

| Mistake | Fix |
|---|---|
| Preview uses different colors than project | Always extract design tokens first |
| Preview too high-fidelity, sets wrong expectations | State clearly: "this is a layout/design preview" |
| Skipping preview for "simple" components | Simple components still benefit from 10-second visual check |
| Not gitignoring `.preview/` | Add it before first preview |
| Generating preview without reading existing components | Check existing patterns first to stay consistent |
