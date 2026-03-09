# Stack Patterns

Detection confidence guide, output templates, component patterns, and CSS framework mapping.

---

## 1. Detection Confidence Guide

When `stack.json` shows multiple detected frameworks, use this priority order:

| Priority | Rule |
|----------|------|
| 1 | **User explicitly specified** a target stack → always override detection |
| 2 | Site builder detected (Webflow, Framer, WordPress, Shopify) → output **plain HTML** unless user says otherwise |
| 3 | Meta-framework detected (Next.js, Nuxt, Gatsby, Remix, Astro) → use that framework |
| 4 | Base framework only (React, Vue, Angular, Svelte) → use React+Vite or Vue 3 |
| 5 | No framework detected → **plain HTML** |

**Confidence threshold:** Trust detections ≥ 0.75. Below 0.75, treat as "uncertain" and default to plain HTML unless user specifies.

**When multiple frameworks conflict** (e.g., React 0.8 + Vue 0.7): ask the user which to output.

---

## 2. Framework Output Templates

Minimum viable file listing per stack. Expand based on the number of sections detected.

### Plain HTML
```
index.html
styles.css
```
- Single `<style>` block acceptable for small pages
- Use CSS custom properties for all colors/fonts

### React + Vite
```
package.json
vite.config.js
index.html
src/main.jsx
src/App.jsx
src/components/<Section>.jsx   (one per section)
src/index.css                  (globals + :root vars)
```

### React + Vite + Tailwind
Add:
```
tailwind.config.js
postcss.config.js
```

### Next.js (App Router + TypeScript)
```
package.json
tsconfig.json
tailwind.config.ts
next.config.ts
app/layout.tsx
app/page.tsx
app/globals.css
components/<Section>.tsx       (one per section)
```

### Vue 3 + Vite
```
package.json
vite.config.ts
index.html
src/main.ts
src/App.vue
src/components/<Section>.vue   (one per section)
src/assets/main.css
```

### Astro
```
package.json
astro.config.mjs
src/layouts/Layout.astro
src/pages/index.astro
src/components/<Section>.astro (one per section)
src/styles/global.css
```

---

## 3. Common Component Patterns

Six essential patterns. Each shown in React (JSX) — adapt syntax for other stacks.

### Navbar

```jsx
// Navbar.jsx
export function Navbar({ logo, links, cta }) {
  return (
    <nav className="navbar">
      <div className="navbar__container">
        <a href="/" className="navbar__logo">{logo}</a>
        <ul className="navbar__links">
          {links.map(l => <li key={l.href}><a href={l.href}>{l.label}</a></li>)}
        </ul>
        {cta && <a href={cta.href} className="btn btn--primary">{cta.label}</a>}
      </div>
    </nav>
  )
}
```

### Hero

```jsx
// Hero.jsx
export function Hero({ eyebrow, heading, subtext, primaryCta, secondaryCta, media }) {
  return (
    <section className="hero">
      <div className="hero__content">
        {eyebrow && <p className="hero__eyebrow">{eyebrow}</p>}
        <h1 className="hero__heading">{heading}</h1>
        <p className="hero__subtext">{subtext}</p>
        <div className="hero__ctas">
          <a href={primaryCta.href} className="btn btn--primary">{primaryCta.label}</a>
          {secondaryCta && <a href={secondaryCta.href} className="btn btn--ghost">{secondaryCta.label}</a>}
        </div>
      </div>
      {media && <div className="hero__media">{media}</div>}
    </section>
  )
}
```

### Card Grid

```jsx
// CardGrid.jsx
export function CardGrid({ cards, columns = 3 }) {
  return (
    <section className="card-grid">
      <div className={`card-grid__grid card-grid__grid--cols-${columns}`}>
        {cards.map((card, i) => (
          <div key={i} className="card">
            {card.icon && <div className="card__icon">{card.icon}</div>}
            <h3 className="card__title">{card.title}</h3>
            <p className="card__body">{card.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

### Testimonials

```jsx
// Testimonials.jsx
export function Testimonials({ items }) {
  return (
    <section className="testimonials">
      <div className="testimonials__grid">
        {items.map((t, i) => (
          <blockquote key={i} className="testimonial">
            <p className="testimonial__quote">"{t.quote}"</p>
            <footer className="testimonial__author">
              {t.avatar && <img src={t.avatar} alt={t.name} className="testimonial__avatar" />}
              <div>
                <cite className="testimonial__name">{t.name}</cite>
                <span className="testimonial__role">{t.role}</span>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}
```

### Pricing Table

```jsx
// Pricing.jsx
export function Pricing({ tiers }) {
  return (
    <section className="pricing">
      <div className="pricing__grid">
        {tiers.map((tier, i) => (
          <div key={i} className={`pricing-card ${tier.featured ? 'pricing-card--featured' : ''}`}>
            <h3 className="pricing-card__name">{tier.name}</h3>
            <div className="pricing-card__price">
              <span className="pricing-card__amount">{tier.price}</span>
              <span className="pricing-card__period">/{tier.period}</span>
            </div>
            <ul className="pricing-card__features">
              {tier.features.map((f, j) => <li key={j}>{f}</li>)}
            </ul>
            <a href={tier.cta.href} className="btn btn--primary">{tier.cta.label}</a>
          </div>
        ))}
      </div>
    </section>
  )
}
```

### Footer

```jsx
// Footer.jsx
export function Footer({ brand, columns, social, copyright }) {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__brand">
          <a href="/">{brand.logo}</a>
          {brand.tagline && <p>{brand.tagline}</p>}
        </div>
        <div className="footer__columns">
          {columns.map((col, i) => (
            <div key={i} className="footer__col">
              <h4 className="footer__col-heading">{col.heading}</h4>
              <ul>
                {col.links.map((l, j) => <li key={j}><a href={l.href}>{l.label}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        {social && (
          <div className="footer__social">
            {social.map((s, i) => <a key={i} href={s.href} aria-label={s.label}>{s.icon}</a>)}
          </div>
        )}
      </div>
      <div className="footer__bottom">
        <p>{copyright}</p>
      </div>
    </footer>
  )
}
```

---

## 4. CSS Framework Mapping

How to translate extracted tokens into each CSS approach.

### Raw CSS (plain HTML or CSS Modules)

```css
:root {
  /* Colors — from tokens.json cssVars or colors[] */
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-bg: #ffffff;
  --color-bg-subtle: #f8fafc;
  --color-text: #0f172a;
  --color-text-muted: #64748b;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-display: 'Cal Sans', 'Inter', sans-serif;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-8: 2rem;
  --space-16: 4rem;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-pill: 9999px;
}
```

### Tailwind Config

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,astro,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#6366f1',
          600: '#4f46e5',
        },
        surface: '#f8fafc',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
}
```

### styled-components / Emotion

```ts
// theme.ts
export const theme = {
  colors: {
    brand: { 500: '#6366f1', 600: '#4f46e5' },
    bg: { default: '#ffffff', subtle: '#f8fafc' },
    text: { default: '#0f172a', muted: '#64748b' },
  },
  fonts: {
    sans: "'Inter', system-ui, sans-serif",
    display: "'Cal Sans', 'Inter', sans-serif",
  },
  radii: {
    sm: '4px', md: '8px', lg: '16px', pill: '9999px',
  },
  space: {
    1: '0.25rem', 2: '0.5rem', 4: '1rem', 8: '2rem', 16: '4rem',
  },
}
```

### CSS Modules

```css
/* Button.module.css */
.btn {
  display: inline-flex;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btnPrimary {
  background-color: var(--color-brand-500);
  color: white;
}

.btnPrimary:hover {
  background-color: var(--color-brand-600);
}
```

---

## 5. Common CSS Framework Detection → Output Guidance

| Detected | Output recommendation |
|----------|-----------------------|
| Tailwind | Use Tailwind utility classes; add `tailwind.config.js` with extracted colors |
| Bootstrap | Use Bootstrap classes OR convert to plain CSS (Bootstrap classes are verbose — ask user) |
| MUI | Use MUI `ThemeProvider` with extracted palette; wrap in `CssBaseline` |
| Ant Design | Use Ant Design `ConfigProvider` with `theme.token` mapped from extracted tokens |
| Chakra UI | Use Chakra `extendTheme` with extracted colors/fonts |
| shadcn/Radix | Use shadcn component primitives; map tokens to `--radius`, `--primary`, etc. in CSS |
| Bulma | Use Bulma classes OR convert to plain CSS with Bulma-style naming |
| None detected | Default to raw CSS with custom properties |
