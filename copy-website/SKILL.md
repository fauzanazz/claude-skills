---
name: copy-website
description: Use when the user wants to copy, clone, replicate, recreate, rip, steal the design of, or build something like a live website or URL. Also triggers on "same layout as", "inspired by", "make it look like", or when a screenshot is attached and the user asks to recreate it. Applies to any target stack output (HTML, React, Next.js, Vue, Astro).
---

# copy-website

## Overview

Reverse-engineers any live website into runnable code via a 6-phase pipeline: Playwright capture → optional Firecrawl content → CSS/animation/design token extraction → tech stack detection → Claude Vision reconstruction → iterative visual scoring loop (scores 5 metrics, fixes until ≥ 90/100 each or `max_iterations` reached).

**Reading pointers:**
- Before Phase 5 (reconstruction): open `references/reconstruction-guide.md`
- When picking an output framework: open `references/stack-patterns.md`

---

## Phase Pipeline

### Phase 1 — Playwright Capture

Run the capture script to take screenshots and extract DOM/tokens:

```bash
node ~/.claude/skills/copy-website/scripts/capture.js <URL> <OUTPUT_DIR>
```

`OUTPUT_DIR` should be `~/copy-website-outputs/<hostname>-<YYYYMMDD-HHMMSS>/`

Create the parent directory if needed: `mkdir -p ~/copy-website-outputs/`

Produces:
- `screenshot-desktop.png` (1440px, full-page)
- `screenshot-mobile.png` (390px, full-page)
- `dom.html` (raw DOM snapshot)
- `tokens.json` (CSS vars, fonts, deduplicated colors)
- `animations.json` (keyframes, transitions, scroll-trigger classes, library detection)
- `media.json` (videos, iframes, canvases, animated GIFs, Lottie containers)
- `layout.json`  (computed grid/flex structure of all major layout elements)
- `stack.json` (detected frameworks + confidence scores)
- `capture-status.json` (which phases succeeded — read this to confirm fidelity tier)

**Fallback if Playwright fails:** script auto-falls back to `curl` for DOM-only capture and exits 0. Read `capture-status.json` to see what succeeded.

---

### Phase 2 — Firecrawl Content (Optional)

```bash
FIRECRAWL_API_KEY=<key> node ~/.claude/skills/copy-website/scripts/firecrawl.js <URL> <OUTPUT_DIR>
```

If `FIRECRAWL_API_KEY` is not set, the script exits 0 with setup instructions — **pipeline continues regardless**.

Produces (when available):
- `content.md` (clean markdown of page content)
- `metadata.json` (title, OG tags, description)

**Fallback if Firecrawl unavailable:** extract text content from `dom.html` using `grep` or read the DOM directly.

---

### Phase 3 — Design Token & Animation Review

Read `tokens.json`. Note:
- CSS custom properties (color palette, spacing, radii)
- Font families (body + headings)
- Font sizes
- Sampled colors from header/footer/main/buttons

Read `animations.json`. Note:
- `libraries` — animation deps to install or replicate
- `keyframes` — `@keyframes` rules to copy verbatim
- `transitions` — element-level transition properties
- `scrollAnimations` — scroll-triggered entries (AOS attrs or reveal classes)

Read `media.json`. Note:
- `videos` — each video's role (background vs content), poster URL, dimensions
- `iframes` — platform (youtube/vimeo) and `embedId` for real iframe reconstruction
- `canvases` — WebGL vs plain canvas, dimensions
- `animatedGifs` — src, dimensions
- `lottieContainers` — Lottie animation dimensions and src

Read `layout.json`. For each entry, note:
- `display` — grid or flex
- `gridTemplateColumns` — the column pattern (e.g. `repeat(3, 1fr)`, `2fr 1fr`)
- `flexDirection`, `justifyContent`, `alignItems` — flex axis and alignment
- `gap` — spacing between grid/flex children
- `maxWidth` — container width constraints

These values are the ground truth for the Layout Blueprint in Phase 5.

All four files become the source of truth for the reconstruction's design system, motion, rich media, and layout structure.

---

### Phase 4 — Tech Stack Assessment

Read `stack.json`. Use confidence scores to select output framework:
- If user specified a target framework → use that
- If Next.js/React detected with high confidence → output React+Vite or Next.js
- If Vue/Nuxt detected → output Vue 3
- If Webflow/Framer/WordPress → output plain HTML (safest equivalent)
- If unclear → ask the user or default to plain HTML

**Now open `references/stack-patterns.md` to select the output template.**

---

### Phase 5 — Claude Vision Reconstruction

**Now open `references/reconstruction-guide.md` and follow it exactly.**

**Design fidelity is the only metric.** The only way to improve it is to make the output actually look like the reference — not to approximate, skip details, or placeholder sections. Large and small features get equal energy. No section is skipped. No detail is "too minor."

High-level summary:
1. Analyze screenshots systematically (outer-to-inner, desktop then mobile)
2. Map extracted tokens to the chosen framework's design system
3. Analyze `animations.json` — implement keyframes, transitions, and scroll animations (never skip)
4. **Determine writing strategy before touching code** — count sections; 6+ sections requires skeleton-first progressive writing (see Step 8 in guide). Never write 500+ lines in one shot.
5. Reconstruct component by component, one section at a time for large sites
6. Annotate approximations with `/* APPROXIMATED */`
7. Write all files into `<OUTPUT_DIR>/code/`

---

### Phase 6 — Iterative Scoring & Refinement

**Parameter:** `max_iterations` (default: **3**). Loop runs until all 7 metrics pass or iterations are exhausted.

**Open `references/reconstruction-guide.md` Section 6 and follow it exactly.**

High-level loop:

```
iteration = 1
while iteration ≤ max_iterations:
  1. Verify output runs (fix build errors before scoring)
  2. Screenshot the output:
       node ~/.claude/skills/copy-website/scripts/screenshot-output.js <OUTPUT_DIR> <iteration>
  3. Read both screenshots:
       reference  → <OUTPUT_DIR>/screenshot-desktop.png
       output     → <OUTPUT_DIR>/iteration-<N>-output.png
  4. Score all 7 metrics (3 objective, 4 visual):
       layoutStructure    — source code vs layout.json (30 pts)
       colorTokenFidelity — output CSS vs tokens.json  (20 pts)
       mediaCompleteness  — output HTML vs media.json  (15 pts)
       typographyHierarchy — visual screenshot          (15 pts)
       spacingRhythm       — output CSS vs tokens.json  (10 pts)
       contentPlacement    — visual screenshot           (5 pts)
       responsiveAdaptation — mobile screenshot          (5 pts)
  5. Save scores → <OUTPUT_DIR>/scores-iteration-<N>.json
  6. If all metrics pass → DONE, report to user
  7. If any metric fails → identify specific issues per metric, fix code
  8. Check context window — if critical, save context-state.json and warn user
  9. iteration += 1

If max_iterations exhausted → report final scores + remaining issues to user
```

**Build verification (before first screenshot):**
```bash
# Plain HTML — just open
open <OUTPUT_DIR>/code/index.html

# Framework — verify it builds
cd <OUTPUT_DIR>/code && npm install && npm run build
# Fix any errors (missing package.json fields, bad imports, TS errors on APPROXIMATED values)
```

---

## Fidelity Tiers

| Tier | Data Available | Quality |
|------|---------------|---------|
| 1 | Playwright screenshots + DOM + Firecrawl | Near-pixel-perfect |
| 2 | DOM only (Playwright failed, curl fallback) | Layout accurate, colors/images approximate |
| 3 | Screenshot only (user uploaded image, no URL) | Best-effort visual match |

Always tell the user which tier you're operating at.

---

## Output Structure

```
~/copy-website-outputs/
  <hostname>-<YYYYMMDD-HHMMSS>/
    capture-status.json          # read first — confirms what captured successfully
    screenshot-desktop.png       # reference (1440px full-page)
    screenshot-mobile.png        # reference mobile
    dom.html
    tokens.json
    animations.json
    media.json
    layout.json
    stack.json
    content.md                   # if Firecrawl ran
    metadata.json                # if Firecrawl ran
    iteration-1-output.png       # Phase 6 scoring screenshot, iteration 1
    iteration-2-output.png       # iteration 2 (if needed)
    scores-iteration-1.json      # 5-metric scores + issues list
    scores-iteration-2.json      # iteration 2 scores (if needed)
    context-state.json           # written if context window goes critical
    code/
      <framework-specific files>
```

---

## Ethics & Limitations

**Before running the pipeline:**
- Do not capture sites that require authentication (login walls) — the DOM will be an auth page, not the actual content
- Respect rate limits: run the pipeline once per target, not in loops
- This skill is for design reference and learning, not for deploying copied content verbatim
- If `dom.html` contains a CAPTCHA or bot-detection page, do not retry in a loop — fall back to Tier 3 (user-provided screenshot)

**The skill will refuse to run if:**
- The URL appears to be a private/internal service (localhost, `.internal`, `.corp`, VPN-only domains)
- The user explicitly says the target is a competitor's unreleased product or private staging URL

---

## User Communication

- Announce the pipeline start: "Running 5-phase capture for `<URL>`..."
- After Phase 1: "Captured screenshots and extracted design tokens."
- After Phase 4: "Detected stack: `<frameworks>`. Reconstructing as `<output-stack>`."
- If operating at Tier 2/3: tell the user which data was unavailable.
- Mark every approximation with `/* APPROXIMATED */` in output code.

---

## Eval Test Cases

1. **Implicit trigger, no URL yet** — "Make something like stripe.com's pricing page, same clean layout and card comparison vibe" → extract URL intent, run pipeline, output React component
2. **Explicit clone with target stack** — "Clone https://brittanychiang.com, output as Next.js" → run full pipeline, output Next.js project
3. **Screenshot only** — user attaches image, says "Recreate this landing page in plain HTML" → Tier 3, skip Phases 1–2, reconstruct from image
4. **SPA with no SSR** — target is a React app that renders a `<div id="root"></div>` in DOM → `dom.html` will be nearly empty; rely on screenshots + `stack.json` for reconstruction; note in output that content was client-rendered
5. **Unreachable URL** — `capture.js` fails to connect → `capture-status.json` shows all false; tell user the URL was unreachable and ask for a screenshot fallback (Tier 3)
6. **Rich media elements** — target has video hero background, YouTube embeds, WebGL canvas, Lottie animations → read `media.json`, apply the correct placeholder strategy per type (Section 5 of reconstruction-guide.md): video backgrounds get animated CSS placeholders, YouTube/Vimeo iframes are embedded directly with real URLs, WebGL gets a dimensional placeholder, Lottie gets a CSS animation fallback. Never collapse any of these to an empty div.
