# Reconstruction Guide

How Claude analyzes captured data and generates faithful website code.

---

## 0. Prime Directive — Design Fidelity

**Your only goal is maximum visual similarity to the reference.**

The similarity metric cannot be gamed. The only way to score higher is to actually make the output look more like the original. There are no shortcuts.

Rules that follow from this:

- **Large and small features get equal energy.** A subtle drop shadow matters as much as the overall grid layout. A 2px border radius difference is worth fixing. A nav link hover color is worth getting right.
- **Do not approximate when you have data.** If `tokens.json` or `animations.json` contains the exact value, use it — never substitute a guess.
- **Do not skip details because they seem minor.** Spacing, letter-spacing, line-height, font-weight, border styles, box-shadows, gradient directions — all of it.
- **Do not implement things minimally.** "Close enough" is not the standard. Implement each section until it matches the screenshot, not until it compiles.
- **Never placeholder a section.** Every section visible in the screenshot must appear in the output. A `<!-- TODO: pricing section -->` comment is a failure.
- **Hover states, focus states, active states** — if visible in the screenshots or inferrable from the DOM, implement them.
- **Responsive breakpoints** — implement the actual mobile layout from `screenshot-mobile.png`, not just a generic stack.

If you find yourself thinking "this detail is too small to matter" — implement it anyway. The reference is the judge, not your intuition about what users notice.

---

## 1. Systematic Visual Analysis

Read screenshots **outer-to-inner, desktop then mobile**.

### Step 1 — Page-level layout (desktop)
- Count major sections top-to-bottom (hero, features, testimonials, CTA, footer)
- Note background colors per section
- Identify the max-width container (usually 1200–1440px)
- Note if content is full-bleed or boxed

### Step 2 — Navigation
- Fixed or sticky? Transparent over hero?
- Logo position (left/center)
- Nav items count and alignment
- CTA button in nav (color, shape)
- Mobile: hamburger vs. visible nav?

### Step 3 — Hero section
- Text hierarchy: eyebrow → H1 → subtitle → CTA(s)
- Background: solid color / gradient / image / video
- Illustration or screenshot placement (left/right/below/overlay)
- Vertical padding estimate

### Step 4 — Repeated components
- Card grids: columns (desktop vs. mobile), gap, border/shadow
- Feature rows: icon + text, alternating layout?
- Testimonial cards: avatar, quote, name/role
- Pricing cards: highlight the "featured" tier

### Step 5 — Footer
- Column count, link density
- Brand/copyright line
- Social icons

### Step 6 — Mobile diff
- Compare mobile screenshot: stacking order, hidden elements, font size changes
- Note hamburger menu, full-width buttons, reordered sections

---

## 2. Design Token Translation

After reading `tokens.json`, map tokens to the target framework:

### Plain HTML / CSS Modules
```css
:root {
  --color-brand: <from tokens.json colors[0]>;
  --color-bg: <from colors>;
  --color-text: <from colors>;
  --font-body: <from fonts.body.family>;
  --font-heading: <from fonts.h1.family>;
  --radius-card: 8px; /* APPROXIMATED if not in cssVars */
}
```

### Tailwind (React/Next.js/Astro)
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      brand: '<hex>',
      // ...
    },
    fontFamily: {
      sans: ['<body font>', 'sans-serif'],
      display: ['<heading font>', 'sans-serif'],
    },
  }
}
```

### styled-components / Emotion
```ts
// theme.ts
export const theme = {
  colors: {
    brand: '<hex>',
    bg: '<hex>',
    text: '<hex>',
  },
  fonts: {
    body: '<family>',
    heading: '<family>',
  },
}
```

**CSS custom property rule:** If `cssVars` in `tokens.json` is non-empty, copy them verbatim into `:root`. These are the exact values the site uses.

---

## 3. Animation Analysis (read `animations.json`)

**This step is mandatory — skip it and you will produce a lifeless static clone.**

### 3a — Identify the animation approach

Check `animations.json.libraries`:
- `GSAP` / `GSAP ScrollTrigger` → reproduce with plain CSS + Intersection Observer (no dep install needed)
- `AOS` → install `aos` or reproduce the same `data-aos` pattern with CSS + IO
- `Framer Motion` → use `framer-motion` if output is React; otherwise CSS transitions
- `Animate.css` → install `animate.css` or copy the relevant keyframes
- `Tailwind animate utilities` → use Tailwind's `animate-*` classes (or add custom keyframes)
- Empty / none → site likely uses hand-written CSS animations — check `keyframes` and `transitions`

### 3b — Map keyframes to output

For every entry in `animations.json.keyframes`, reproduce it verbatim in the output CSS:

```css
/* Copied from animations.json.keyframes */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### 3c — Map element transitions

For every entry in `animations.json.transitions`, apply the captured duration/easing to the matching element class:

```css
.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12);
}
```

### 3d — Implement scroll-triggered animations

If `animations.json.scrollAnimations` is non-empty, implement them with an Intersection Observer:

**Plain HTML / Vanilla JS:**
```js
// animations.js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
```
```css
[data-animate] { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
[data-animate].is-visible { opacity: 1; transform: none; }
```

**React:**
```jsx
// useInView.js
import { useEffect, useRef, useState } from 'react';
export function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}
```

Apply to each component that had `data-aos` or reveal classes in `scrollAnimations`.

### 3e — Decision table

| `animations.json` state | Action |
|--------------------------|--------|
| Has `keyframes` entries | Copy keyframes verbatim, apply to elements |
| Has `transitions` entries | Apply matching `transition` CSS to those selectors |
| Has `scrollAnimations` entries | Add `data-animate` + Intersection Observer |
| Library = AOS | Install AOS or reproduce the `data-aos` attribute pattern |
| Library = GSAP | Reproduce with CSS keyframes + IO (avoid GSAP dep unless React/Vite) |
| All empty | Infer from screenshots: hero section → fade-in; cards → hover lift; nav → backdrop on scroll |
| Truly no animations visible | Skip, no `/* APPROXIMATED */` needed |

**Never output a site where nothing moves.** If `animations.json` is empty, use screenshot inference to add at minimum:
- Hero text: `animation: fadeInUp 0.7s ease both`
- Cards/features: hover `transform: translateY(-4px)` + `transition`
- CTA button: hover brightness/scale
- Nav: `transition: background 0.3s` for scroll-triggered backdrop

---

## 3.5 Layout Blueprint (MANDATORY — write this before any code)

Read `layout.json`. For every grid/flex entry, write out its pattern explicitly.
Do NOT skip this step or proceed to code until the blueprint is written.

Format:

### Layout Blueprint

**<header>** — flex, row
- flex-direction: row; justify-content: space-between; align-items: center
- padding: 0 48px; max-width: 1280px; position: sticky

**section.hero** — grid
- grid-template-columns: 1fr 1fr; gap: 64px; align-items: center
- min-height: 100vh; padding: 120px 80px

**section.features .grid** — grid
- grid-template-columns: repeat(3, 1fr); gap: 32px
- padding: 80px 48px

**<footer>** — grid
- grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px
- padding: 64px 48px

This blueprint is your CSS source of truth. Every layout div must match it exactly.
If layout.json is empty (extraction failed), infer from dom.html class names and screenshot.

---

## 4. Reconstruction Prompt Template

Before writing any code, complete this internal 7-step reasoning sequence:

**Step 1 — Resolve stack conflicts**

User request overrides detection always. If the detected stack and user request conflict (e.g., site uses Tailwind but user wants plain HTML), output the user's requested stack and translate tokens accordingly — do not emit Tailwind classes in plain HTML output.

If the user did not specify and `stack.json` is ambiguous (multiple high-confidence frameworks), prefer in this order: Next.js > React+Vite > Vue 3 > plain HTML.

**Step 2 — Section inventory**

List every section top-to-bottom. Example: `Navbar | Hero | 3-col Features | Testimonial Carousel | Pricing Table | CTA Banner | Footer`. This becomes your component list.

**Step 3 — Token mapping**

Confirm you have: primary color, background color, text color, font-body, font-heading. If any are missing from `tokens.json`, use the screenshot to estimate and mark `/* APPROXIMATED */`.

**Step 4 — Component granularity decision**

- Page has ≤ 4 sections → single-file output (one HTML file or one App component) is acceptable
- Page has 5+ sections → split into one file per section component
- Any section that repeats (cards, testimonials, pricing tiers) → extract as a component with props even for small pages

**Step 5 — Responsive strategy**

For each section, note the desktop → mobile transformation:
- Multi-column grid → single column
- Side-by-side text+image → stacked
- Full nav → hamburger (implement as `display:none` toggle for plain HTML; proper state for React/Vue)

**Step 6 — Missing data inventory**

List what's unknown before writing any code. E.g.: "icon library unknown, video background present, font weight unconfirmed." Assign `/* APPROXIMATED */` to each.

**Step 7 — File list**

Write the exact file paths you will create before writing any content. Commit to this list — do not add files mid-reconstruction.

**Step 8 — Writing strategy (CRITICAL — do not skip)**

Determine section count from Step 2:

- **≤ 5 sections** → write each file in full in one pass, then done.
- **6–10 sections** → write CSS + HTML skeleton first (head, nav, footer, empty section containers with correct IDs), then fill each section body with a separate Edit call, one section at a time.
- **11+ sections (large site)** → mandatory progressive writing:
  1. Write `styles.css` with only `:root` variables, reset, and typography — no section styles yet
  2. Write `index.html` skeleton: `<head>`, nav, empty `<section id="...">` stubs for every section, footer, script tags
  3. For **each section** in order: Edit the section stub to add its full markup, then immediately Edit `styles.css` to append its styles
  4. Only move to the next section after the previous one's markup AND styles are written

**Why:** Attempting to write 500+ lines of HTML or CSS in a single Write call causes generation timeout. Writing incrementally keeps each operation small and fast.

**Plain HTML skeleton template (use for 6+ section sites):**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><!-- page title --></title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <nav id="nav"><!-- fill next --></nav>
  <main>
    <section id="hero"><!-- fill next --></section>
    <section id="features"><!-- fill next --></section>
    <!-- one stub per section from Step 2 inventory -->
  </main>
  <footer id="footer"><!-- fill next --></footer>
  <script src="animations.js"></script>
</body>
</html>
```

After writing the skeleton, announce: "Skeleton written. Now filling sections one by one." Then proceed section by section.

Only after completing all 8 steps, write the code.

## 4. Output Structure by Tech Stack

### Plain HTML
```
code/
  index.html          # All sections inline
  styles.css          # :root vars, reset, component styles
  assets/             # Any placeholder images referenced
```

### React + Vite
```
code/
  index.html
  src/
    main.jsx
    App.jsx
    components/
      Navbar.jsx
      Hero.jsx
      <SectionName>.jsx
      Footer.jsx
    styles/
      globals.css     # :root vars + reset
      <Component>.module.css
  tailwind.config.js  # if Tailwind detected
  package.json
```

### Next.js (App Router)
```
code/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    Navbar.tsx
    Hero.tsx
    <SectionName>.tsx
    Footer.tsx
  tailwind.config.ts
  package.json
  tsconfig.json
```

### Vue 3
```
code/
  src/
    App.vue
    components/
      TheNavbar.vue
      HeroSection.vue
      <SectionName>.vue
      TheFooter.vue
    assets/
      main.css
  index.html
  package.json
```

### Astro
```
code/
  src/
    layouts/
      Layout.astro
    pages/
      index.astro
    components/
      Navbar.astro
      Hero.astro
      <SectionName>.astro
      Footer.astro
    styles/
      global.css
  astro.config.mjs
  package.json
```

---

## 5. Rich Media Handling (read `media.json`)

**`media.json` tells you exactly what rich media elements exist and their dimensions. Read it before writing any code.**

### Decision table — per media type

| Type | Strategy |
|------|----------|
| `videos[].role === "background"` or `"hero-background"` | See 5a — video background placeholder |
| `videos[].role === "content"` | See 5b — content video placeholder |
| `iframes[].platform === "youtube"` | See 5c — keep real iframe with original embed URL |
| `iframes[].platform === "vimeo"` | See 5c — keep real iframe with original embed URL |
| `iframes[].platform === "unknown"` | Styled placeholder div, same dimensions |
| `canvases[].isWebGL === true` | See 5d — WebGL/Three.js placeholder |
| `canvases[].isWebGL === false` | Styled canvas element, same dimensions, comment |
| `animatedGifs[]` | `<img>` with same dimensions, use `placehold.co`, mark APPROXIMATED |
| `lottieContainers[]` | See 5e — Lottie placeholder with CSS fallback |

---

### 5a — Video background placeholder

When a `<video>` is used as a section/hero background (autoplay, muted, loop):

```html
<!-- APPROXIMATED - original: autoplay muted loop background video (WxH px) -->
<div class="video-bg-placeholder" aria-hidden="true">
  <div class="video-bg-overlay"></div>
</div>
```
```css
.video-bg-placeholder {
  position: absolute; /* or fixed — match original */
  inset: 0;
  background: #1a1a2e; /* sample dominant color from screenshot */
  /* APPROXIMATED - original has a video background */
}
/* Subtle animated gradient to suggest motion */
.video-bg-placeholder::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%);
  animation: videoBgShimmer 4s ease-in-out infinite alternate;
}
@keyframes videoBgShimmer {
  from { opacity: 0.5; }
  to   { opacity: 1; }
}
.video-bg-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4); /* match original overlay if present */
}
```

**Dimensions:** Match the section's height exactly. If `media.json` has `height`, use it. Otherwise infer from screenshot.

**If `poster` URL exists in `media.json`:** use it as `background-image` instead of the color approximation — cross-origin images load fine in static output.

---

### 5b — Content video placeholder (non-background)

For `<video>` elements that are part of content (demos, product walkthroughs):

```html
<!-- APPROXIMATED - original: <video> element (WxH px) -->
<div class="video-placeholder" style="width: {W}px; max-width: 100%; aspect-ratio: {W}/{H};">
  <div class="video-placeholder__icon">▶</div>
  <p class="video-placeholder__label">Video content</p>
</div>
```
```css
.video-placeholder {
  background: #111;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.5);
  font-family: inherit;
}
.video-placeholder__icon { font-size: 3rem; margin-bottom: 0.5rem; }
.video-placeholder__label { font-size: 0.875rem; }
```

---

### 5c — YouTube / Vimeo embeds

**Keep the real iframe.** These embed URLs are public and work cross-origin:

```html
<!-- YouTube: embedId from media.json -->
<iframe
  width="{width}" height="{height}"
  src="https://www.youtube.com/embed/{embedId}"
  title="Video embed"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
></iframe>

<!-- Vimeo: embedId from media.json -->
<iframe
  width="{width}" height="{height}"
  src="https://player.vimeo.com/video/{embedId}"
  title="Video embed"
  frameborder="0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
></iframe>
```

If the original `src` is in `media.json`, use it verbatim — don't reconstruct it.

---

### 5d — WebGL / Canvas placeholder

Canvas/Three.js scenes cannot be reproduced. Use a visually honest placeholder that fills the same space:

```html
<!-- APPROXIMATED - original: WebGL canvas (WxH px, Three.js/custom WebGL) -->
<div
  class="canvas-placeholder"
  style="width: {W}px; height: {H}px;"
  aria-label="3D/WebGL content"
>
  <span>Interactive 3D scene</span>
</div>
```
```css
.canvas-placeholder {
  background: radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a14 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.3);
  font-size: 0.875rem;
  border-radius: inherit;
  /* Subtle particle-like shimmer to suggest 3D content */
  animation: canvasGlow 6s ease-in-out infinite alternate;
}
@keyframes canvasGlow {
  from { filter: brightness(0.8); }
  to   { filter: brightness(1.2); }
}
```

Match the dominant background color from the screenshot, not a generic dark.

---

### 5e — Lottie animation placeholder

If `animations.json.libraries` contains `Lottie`, Lottie containers appear in `media.json.lottieContainers`. Use a CSS animation fallback that approximates the visual weight:

```html
<!-- APPROXIMATED - original: Lottie animation (WxH px) -->
<div class="lottie-placeholder" style="width: {W}px; height: {H}px;" aria-hidden="true"></div>
```
```css
.lottie-placeholder {
  /* Match the dominant hue from the screenshot for this element's area */
  background: conic-gradient(from 0deg, #6366f1, #8b5cf6, #ec4899, #6366f1);
  border-radius: 50%;
  animation: lottieSpin 3s linear infinite;
  opacity: 0.85;
}
@keyframes lottieSpin {
  to { transform: rotate(360deg); }
}
```

Adjust shape (border-radius) and colors from the screenshot — a Lottie icon on a white card looks very different from one on a dark hero.

---

## 6. Handling Missing Information

### When to approximate vs. ask

| Situation | Action |
|-----------|--------|
| Exact hex color not extractable | Sample from screenshot visually, mark `/* APPROXIMATED */` |
| Font not identified | Use closest system/Google Font match, mark `/* APPROXIMATED */` |
| Images/illustrations | Use placeholder (e.g., `https://placehold.co/600x400`), comment with description |
| Icon library not clear | Use inline SVG or lucide-react equivalent |
| CSS animation / scroll reveal | **Implement it** — read `animations.json` first |
| Video background | Use Section 5a placeholder — never omit the section |
| Content video | Use Section 5b placeholder — preserve dimensions |
| YouTube/Vimeo embed | Keep real iframe with original embed URL (Section 5c) |
| Canvas / WebGL | Use Section 5d placeholder — preserve dimensions |
| Lottie animation | Use Section 5e CSS fallback — preserve dimensions |
| Copy text not readable | Use lorem ipsum placeholder |
| Exact spacing values | Estimate from visual proportion, mark `/* APPROXIMATED */` |

**Never ask the user** for information that can be reasonably approximated — just mark it.

**Do ask** when:
- Target framework is genuinely ambiguous and the choice affects file structure significantly
- The page has a critical interactive feature (auth, cart, search) that needs real implementation decisions

### `/* APPROXIMATED */` Convention

Always use this exact comment string so the user can grep for it:

```css
--color-brand: #6366f1; /* APPROXIMATED - extracted from screenshot */
```

```jsx
<img src="https://placehold.co/600x400/6366f1/white?text=Hero+Image" alt="Hero" />
{/* APPROXIMATED - replace with actual asset */}
```

---

## 6. Iterative Scoring & Refinement

**This section governs Phase 6. Run after initial reconstruction. Repeat until all metrics ≥ 90 or `max_iterations` (default 3) is exhausted.**

---

### 6a — Screenshot the output

```bash
node ~/.claude/skills/copy-website/scripts/screenshot-output.js <OUTPUT_DIR> <ITERATION>
# Produces: <OUTPUT_DIR>/iteration-<N>-output.png
```

---

### 6b — Score via Claude Vision

Read both images side by side:
- **Reference**: `<OUTPUT_DIR>/screenshot-desktop.png`
- **Output**: `<OUTPUT_DIR>/iteration-<N>-output.png`

Score all 7 metrics using the rubrics below. Objective metrics (1–3) are scored by comparing source code/CSS against extracted JSON files — do NOT use screenshots for these. Visual metrics (4–7) use screenshot comparison.

#### Objective Checks (no screenshot needed)

**1. layoutStructure (0–30)**
Read `layout.json` and your own output CSS side by side. For each section in the blueprint:
- Correct: `grid-template-columns` or `flex-direction` + `gap` matches extracted value
- Incorrect: column count wrong, flex axis wrong, missing grid entirely

Scoring:
- 28–30: All major sections match layout.json exactly
- 20–27: 1 section has wrong column count or flex axis; overall structure correct
- 10–19: 2+ sections wrong, or a full-page-width section uses wrong display type
- 0–9:   Fundamental structure mismatch — grid rendered as stacked divs, etc.

**2. colorTokenFidelity (0–20)**
Read `tokens.json → cssVars`. Read your output CSS. Cross-check each color token:
- Primary, accent, background, text, border, gradient stops

Do NOT use screenshots for this metric.

- 18–20: All token colors match (within ±5 HSL lightness)
- 13–17: 1 token off (wrong hue or value)
- 7–12:  2–3 tokens wrong or using hardcoded fallbacks instead of var()
- 0–6:   Default browser colors, or palette completely wrong

**3. mediaCompleteness (0–15)**
Read `media.json`. Count every video, iframe, canvas, animatedGif, lottieContainer.
Find each in your output HTML. A valid placeholder must: (a) exist in the DOM, (b) have aspect-ratio or padding-bottom set, (c) not be an empty div.

- 13–15: Every media item has a correct placeholder
- 8–12:  1 item missing or collapsed to empty div
- 0–7:   2+ items missing, or video/canvas placeholders have no dimensions

#### Visual Checks (screenshot comparison)

**4. typographyHierarchy (0–15)**
- 13–15: Font family correct, h1/h2/h3 size ratios match, weights correct
- 9–12:  Font family correct, scale slightly off (h1 too small/large)
- 4–8:   Wrong font family on headings, or weights all the same
- 0–3:   System fallback fonts, completely different scale

**5. spacingRhythm (0–10)**
Cross-check output CSS padding/margin/gap values against `tokens.json → spacing`.
- 9–10: Section padding, card padding, and gap values follow extracted scale
- 6–8:  Minor deviations (one section padded differently)
- 0–5:  Spacing arbitrary, no clear scale

**6. contentPlacement (0–5)**
- 4–5:  Hero heading, nav items, CTAs all in correct position
- 2–3:  One element misplaced
- 0–1:  Major content blocks in wrong order

**7. responsiveAdaptation (0–5)**
Compare `screenshot-mobile.png` to mobile output.
- 4–5:  Mobile layout collapses correctly (single column, stacked sections)
- 2–3:  Mostly correct, minor overflow or wrong breakpoint
- 0–1:  Desktop layout on mobile, overflow, or broken

---
Total: 100 points. Pass threshold: layoutStructure ≥ 24, colorTokenFidelity ≥ 16, mediaCompleteness ≥ 12, typographyHierarchy ≥ 12, spacingRhythm ≥ 8, contentPlacement ≥ 4, responsiveAdaptation ≥ 4 (≥ 80% of each metric's max).

---

### 6c — Save score JSON

Write `<OUTPUT_DIR>/scores-iteration-<N>.json` with this exact format:

```json
{
  "iteration": 1,
  "layoutBlueprint": "written",
  "scores": {
    "layoutStructure":      22,
    "colorTokenFidelity":   18,
    "mediaCompleteness":    15,
    "typographyHierarchy":  12,
    "spacingRhythm":         7,
    "contentPlacement":      4,
    "responsiveAdaptation":  4
  },
  "overall": 82,
  "passed": false,
  "issues": [
    {
      "metric": "layoutStructure",
      "score": 22,
      "problems": [
        "Features section uses flex-wrap instead of grid — layout.json shows repeat(3, 1fr)",
        "Hero grid gap is 24px, layout.json shows 64px"
      ],
      "fixes": [
        "Change .features-grid to display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px",
        "Set .hero { gap: 64px }"
      ]
    }
  ]
}
```

`overall` = sum of all 7 scores (max 100). `passed` = each metric ≥ 80% of its max (layoutStructure ≥ 24, colorTokenFidelity ≥ 16, mediaCompleteness ≥ 12, typographyHierarchy ≥ 12, spacingRhythm ≥ 8, contentPlacement ≥ 4, responsiveAdaptation ≥ 4).

---

### 6d — Decision & fix strategy

**If `passed: true`** → stop the loop. Report to user:
```
Iteration N complete. All metrics passed:
  Layout Structure:      28/30
  Color Token Fidelity:  19/20
  Media Completeness:    15/15
  Typography Hierarchy:  13/15
  Spacing Rhythm:         9/10
  Content Placement:      5/5
  Responsive Adaptation:  5/5
  Overall: 94/100
Output is at <OUTPUT_DIR>/code/
```

**If `passed: false` and iterations remain:**

For each metric below 90:
1. Address every problem listed in `issues[metric].problems`
2. Apply every fix in `issues[metric].fixes`
3. Do not move to the next iteration until all listed fixes are applied
4. For problems with no concrete fix yet (e.g., "font unknown") — research the font from `tokens.json` or `dom.html` and commit to a specific fix rather than leaving it

After applying fixes: increment iteration, go back to 6a.

**If `passed: false` and max_iterations exhausted:**

Report to user with the full final scores JSON and a list of remaining issues. Do not silently stop — explain what was not achieved and why.

---

### 6e — Context window handling

**Check context pressure after every fix round** (before screenshotting again). Signs of critical context:
- You are being warned about context length
- Your responses are getting noticeably shorter/truncated
- You have completed more than 2 full fix rounds

**When context is critical — immediately save state and warn the user:**

Write `<OUTPUT_DIR>/context-state.json`:
```json
{
  "outputDir": "<OUTPUT_DIR>",
  "targetUrl": "<original URL>",
  "currentIteration": 2,
  "maxIterations": 3,
  "lastScores": {
    "layoutStructure": 22,
    "colorTokenFidelity": 18,
    "mediaCompleteness": 15,
    "typographyHierarchy": 12,
    "spacingRhythm": 7,
    "contentPlacement": 4,
    "responsiveAdaptation": 4
  },
  "remainingIssues": [
    "layoutStructure: features grid uses flex-wrap, needs repeat(3, 1fr) grid",
    "spacingRhythm: hero padding is 40px, layout.json shows 120px"
  ],
  "filesModified": [
    "code/styles.css",
    "code/index.html"
  ],
  "nextTodos": [
    "Fix nav link font-weight to 500",
    "Add third testimonial card",
    "Re-screenshot with iteration 3",
    "Score and compare"
  ]
}
```

Then output this exact warning to the user:

```
⚠️  Context window critical — state saved.

Scores so far (iteration 2):
  Layout Structure:      22/30  ← needs work
  Color Token Fidelity:  18/20  ✓
  Media Completeness:    15/15  ✓
  Typography Hierarchy:  12/15  ✓
  Spacing Rhythm:         7/10  ← needs work
  Content Placement:      4/5   ✓
  Responsive Adaptation:  4/5   ✓

Remaining issues and next steps saved to:
  <OUTPUT_DIR>/context-state.json

To continue in a new session, run:
  /copy-website --continue <OUTPUT_DIR>

Or paste this message to Claude Code in a fresh session:
  "Continue copy-website refinement from <OUTPUT_DIR>/context-state.json.
   Read context-state.json, apply the fixes in nextTodos, then re-score."
```
