#!/usr/bin/env node
/**
 * capture.js — Phase 1 of copy-website pipeline
 * Usage: node capture.js <URL> <OUTPUT_DIR>
 *
 * Produces (best-effort — each phase has isolated error handling):
 *   screenshot-desktop.png  (1440px, full-page)
 *   screenshot-mobile.png   (390px, full-page)
 *   dom.html                (raw DOM snapshot)
 *   tokens.json             (CSS vars, fonts, deduplicated colors)
 *   stack.json              (detected frameworks + confidence scores)
 *   capture-status.json     (which phases succeeded/failed)
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [,, url, outputDir] = process.argv;

if (!url || !outputDir) {
  console.error('Usage: node capture.js <URL> <OUTPUT_DIR>');
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

// Track which phases completed so caller knows fidelity tier
const status = {
  screenshotDesktop: false,
  screenshotMobile: false,
  dom: false,
  tokens: false,
  animations: false,
  media: false,
  layout: false,
  stack: false,
  errors: [],
};

// ---------------------------------------------------------------------------
// Playwright bootstrap
// ---------------------------------------------------------------------------

const PW_INSTALL_DIR = '/tmp/pw-install';

function ensurePlaywright() {
  // Check if already importable from global or project node_modules
  try {
    require.resolve('playwright');
    return; // already available
  } catch { /* fall through to install */ }

  // Check if cached install exists
  if (fs.existsSync(path.join(PW_INSTALL_DIR, 'node_modules', 'playwright'))) {
    module.paths.unshift(path.join(PW_INSTALL_DIR, 'node_modules'));
    return;
  }

  console.log('Installing playwright (one-time, ~100 MB)...');
  const installResult = spawnSync(
    'npm', ['install', '--prefix', PW_INSTALL_DIR, 'playwright'],
    { stdio: 'inherit', timeout: 120_000 }
  );
  if (installResult.status !== 0) {
    throw new Error(
      'npm install playwright failed.\n' +
      'If you are on Linux, system dependencies may be missing.\n' +
      'Run: npx playwright install-deps chromium\n' +
      'Or install manually: sudo apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1'
    );
  }
  module.paths.unshift(path.join(PW_INSTALL_DIR, 'node_modules'));

  // Install chromium browser binary (separate from npm package)
  console.log('Downloading Chromium browser binary...');
  const chromiumResult = spawnSync(
    'npx', ['playwright', 'install', 'chromium'],
    { stdio: 'inherit', timeout: 180_000, cwd: PW_INSTALL_DIR }
  );
  if (chromiumResult.status !== 0) {
    throw new Error(
      'Chromium download failed. This may require system dependencies.\n' +
      'Try: npx playwright install-deps chromium\n' +
      'Or on Linux: sudo apt-get install -y $(npx playwright install-deps chromium --dry-run)'
    );
  }
}

// ---------------------------------------------------------------------------
// Color deduplication — cluster near-duplicate colors by HSL proximity
// ---------------------------------------------------------------------------

function parseRgb(color) {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return null;
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function deduplicateColors(rawColors) {
  const parsed = rawColors
    .map(c => ({ raw: c, rgb: parseRgb(c) }))
    .filter(c => c.rgb !== null);

  const clusters = [];
  for (const color of parsed) {
    const [h, s, l] = rgbToHsl(...color.rgb);
    // Skip near-black, near-white, and fully transparent
    if (l < 3 || l > 97 || s < 3) continue;

    const match = clusters.find(cl => {
      const hueDiff = Math.min(Math.abs(cl.h - h), 360 - Math.abs(cl.h - h));
      return hueDiff <= 12 && Math.abs(cl.l - l) <= 15 && Math.abs(cl.s - s) <= 20;
    });

    if (match) {
      match.count++;
    } else {
      clusters.push({ raw: color.raw, h, s, l, count: 1 });
    }
  }

  // Sort by frequency desc, return up to 15 representative colors
  return clusters
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map(c => c.raw);
}

// ---------------------------------------------------------------------------
// Layout extraction — grid/flex structure of major layout elements
// ---------------------------------------------------------------------------

async function extractLayout(page) {
  return await page.evaluate(() => {
    const targets = [
      'header', 'nav', 'main', 'footer', 'section', 'article',
      '[class*="hero"]', '[class*="container"]', '[class*="wrapper"]',
      '[class*="grid"]', '[class*="flex"]', '[class*="row"]',
      '[class*="pricing"]', '[class*="features"]', '[class*="cards"]',
    ];

    const layouts = [];

    for (const sel of targets) {
      let elements;
      try { elements = document.querySelectorAll(sel); } catch { continue; }

      elements.forEach((el, i) => {
        const s = window.getComputedStyle(el);
        const display = s.display;
        if (!['grid', 'inline-grid', 'flex', 'inline-flex'].includes(display)) return;

        const entry = {
          selector: sel,
          index: elements.length > 1 ? i : 0,
          tagName: el.tagName.toLowerCase(),
          classList: el.className.slice(0, 120),
          display,
          width: s.width,
          maxWidth: s.maxWidth,
          padding: s.padding,
        };

        if (display.includes('grid')) {
          entry.gridTemplateColumns = s.gridTemplateColumns;
          entry.gridTemplateRows = s.gridTemplateRows;
          entry.gridAutoFlow = s.gridAutoFlow;
          entry.gap = s.gap;
          entry.alignItems = s.alignItems;
          entry.justifyItems = s.justifyItems;
        } else {
          entry.flexDirection = s.flexDirection;
          entry.flexWrap = s.flexWrap;
          entry.justifyContent = s.justifyContent;
          entry.alignItems = s.alignItems;
          entry.gap = s.gap;
        }

        layouts.push(entry);
      });
    }

    return layouts;
  });
}

// ---------------------------------------------------------------------------
// Media extraction — videos, iframes, canvas, animated GIFs, Lottie
// ---------------------------------------------------------------------------

async function extractMedia(page) {
  return await page.evaluate(() => {
    function getBounds(el) {
      const r = el.getBoundingClientRect();
      return { width: Math.round(r.width), height: Math.round(r.height), top: Math.round(r.top) };
    }

    function videoRole(el) {
      const style = getComputedStyle(el);
      if (style.position === 'absolute' || style.position === 'fixed') return 'background';
      if (el.closest('[class*="hero"]') || el.closest('[class*="banner"]') || el.closest('[class*="cover"]')) return 'hero-background';
      return 'content';
    }

    const videos = [];
    for (const el of document.querySelectorAll('video')) {
      const source = el.querySelector('source');
      const bounds = getBounds(el);
      if (bounds.width === 0) continue;
      videos.push({
        src: el.src || source?.src || null,
        poster: el.poster || null,
        autoplay: el.autoplay,
        loop: el.loop,
        muted: el.muted,
        role: videoRole(el),
        width: bounds.width,
        height: bounds.height,
      });
    }

    const iframes = [];
    for (const el of document.querySelectorAll('iframe')) {
      const src = el.src || '';
      const bounds = getBounds(el);
      if (bounds.width === 0) continue;
      let platform = 'unknown';
      let embedId = null;
      const ytMatch = src.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const vmMatch = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (ytMatch) { platform = 'youtube'; embedId = ytMatch[1]; }
      else if (vmMatch) { platform = 'vimeo'; embedId = vmMatch[1]; }
      else if (/loom\.com/.test(src)) platform = 'loom';
      else if (/maps\.google|google\.com\/maps/.test(src)) platform = 'google-maps';
      iframes.push({ src, platform, embedId, width: bounds.width, height: bounds.height, title: el.title || null });
    }

    const canvases = [];
    for (const el of document.querySelectorAll('canvas')) {
      const bounds = getBounds(el);
      if (bounds.width === 0) continue;
      // Detect WebGL context without consuming it (already initialized)
      const isWebGL = el.getContext('webgl') !== null || el.getContext('webgl2') !== null;
      canvases.push({
        id: el.id || null,
        className: el.className || null,
        width: bounds.width,
        height: bounds.height,
        isWebGL,
      });
    }

    const animatedGifs = [];
    for (const el of document.querySelectorAll('img')) {
      if (!el.src || !/\.gif(\?|$)/i.test(el.src)) continue;
      const bounds = getBounds(el);
      if (bounds.width === 0) continue;
      animatedGifs.push({ src: el.src, alt: el.alt || null, width: bounds.width, height: bounds.height });
    }

    const lottieContainers = [];
    const lottieSelectors = ['lottie-player', '[class*="lottie"]', '[data-animation-type="lottie"]', 'dotlottie-player'];
    for (const sel of lottieSelectors) {
      for (const el of document.querySelectorAll(sel)) {
        const bounds = getBounds(el);
        if (bounds.width === 0) continue;
        lottieContainers.push({
          tag: el.tagName.toLowerCase(),
          src: el.getAttribute('src') || el.getAttribute('data-src') || null,
          width: bounds.width,
          height: bounds.height,
        });
      }
    }

    return { videos, iframes, canvases, animatedGifs, lottieContainers };
  });
}

// ---------------------------------------------------------------------------
// Animation extraction (runs in browser context)
// ---------------------------------------------------------------------------

async function extractAnimations(page) {
  const raw = await page.evaluate(() => {
    const keyframes = {};
    const transitions = {};
    const animationProps = [];
    const scrollAnimationClasses = [];

    // Extract @keyframes and CSS animation/transition properties from all stylesheets
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          // Capture @keyframes
          if (rule instanceof CSSKeyframesRule) {
            const frames = {};
            for (const keyframe of rule.cssRules) {
              frames[keyframe.keyText] = keyframe.style.cssText;
            }
            keyframes[rule.name] = frames;
          }
          // Capture animation/transition declarations on selectors
          if (rule instanceof CSSStyleRule) {
            const style = rule.style;
            if (style.animation || style.transition) {
              animationProps.push({
                selector: rule.selectorText,
                animation: style.animation || null,
                transition: style.transition || null,
                transform: style.transform || null,
              });
            }
          }
        }
      } catch { /* cross-origin sheet — skip */ }
    }

    // Sample computed transitions/animations on key elements
    const sampleSelectors = [
      'header', 'nav', 'button', 'a', '[class*="hero"]',
      '[class*="card"]', '[class*="btn"]', '[class*="cta"]',
      '[class*="fade"]', '[class*="slide"]', '[class*="animate"]',
      '[class*="scroll"]', '[data-aos]', '[class*="motion"]',
    ];
    for (const sel of sampleSelectors) {
      try {
        const els = document.querySelectorAll(sel);
        for (const el of Array.from(els).slice(0, 2)) {
          const style = getComputedStyle(el);
          if (style.animationName !== 'none' || style.transitionDuration !== '0s') {
            transitions[sel] = {
              animationName: style.animationName,
              animationDuration: style.animationDuration,
              animationTimingFunction: style.animationTimingFunction,
              animationDelay: style.animationDelay,
              animationFillMode: style.animationFillMode,
              transitionProperty: style.transitionProperty,
              transitionDuration: style.transitionDuration,
              transitionTimingFunction: style.transitionTimingFunction,
            };
            break; // one representative sample per selector
          }
        }
      } catch { /* skip */ }
    }

    // Detect scroll-triggered animation markers
    const aosEls = document.querySelectorAll('[data-aos]');
    for (const el of Array.from(aosEls).slice(0, 20)) {
      scrollAnimationClasses.push({
        type: 'AOS',
        animation: el.getAttribute('data-aos'),
        duration: el.getAttribute('data-aos-duration'),
        delay: el.getAttribute('data-aos-delay'),
        tag: el.tagName,
      });
    }

    // Detect Intersection Observer usage hints (elements with reveal classes)
    const revealPatterns = ['fade-in', 'fade-up', 'slide-in', 'reveal', 'animate-on-scroll', 'is-visible', 'in-view'];
    const revealEls = document.querySelectorAll(revealPatterns.map(p => `[class*="${p}"]`).join(','));
    for (const el of Array.from(revealEls).slice(0, 10)) {
      scrollAnimationClasses.push({
        type: 'CSS-class',
        classes: el.className,
        tag: el.tagName,
      });
    }

    // Detect animation libraries from globals and script tags
    const libraryHints = [];
    if (typeof window.gsap !== 'undefined') libraryHints.push('GSAP');
    if (typeof window.ScrollTrigger !== 'undefined') libraryHints.push('GSAP ScrollTrigger');
    if (typeof window.AOS !== 'undefined') libraryHints.push('AOS');
    if (typeof window.anime !== 'undefined') libraryHints.push('anime.js');
    if (typeof window.lottie !== 'undefined') libraryHints.push('Lottie');
    if (typeof window.MotionObserver !== 'undefined') libraryHints.push('Motion Observer');

    // Check script src attributes for library fingerprints
    const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    if (scripts.some(s => /gsap|greensock/i.test(s))) libraryHints.push('GSAP (via script)');
    if (scripts.some(s => /framer-motion|framer\.com/i.test(s))) libraryHints.push('Framer Motion');
    if (scripts.some(s => /aos\.js|aos\.min/i.test(s))) libraryHints.push('AOS (via script)');
    if (scripts.some(s => /anime\.min|animejs/i.test(s))) libraryHints.push('anime.js (via script)');
    if (scripts.some(s => /lottie/i.test(s))) libraryHints.push('Lottie (via script)');
    if (scripts.some(s => /motion\/dist|@motionone/i.test(s))) libraryHints.push('Motion One');
    if (scripts.some(s => /three\.min|three\.module/i.test(s))) libraryHints.push('Three.js');

    // Check for CSS animation utility classes (Tailwind animate, Animate.css, etc.)
    const styleLinks = Array.from(document.querySelectorAll('link[rel=stylesheet][href]')).map(l => l.href);
    if (styleLinks.some(s => /animate\.min|animate\.css/i.test(s))) libraryHints.push('Animate.css');
    if (document.querySelector('[class*="animate-"]')) libraryHints.push('Tailwind animate utilities');

    return {
      keyframes,
      transitions,
      scrollAnimations: scrollAnimationClasses,
      libraries: [...new Set(libraryHints)],
      animationProps: animationProps.slice(0, 50), // cap to avoid huge output
    };
  });

  return raw;
}

// ---------------------------------------------------------------------------
// Token extraction (runs in browser context)
// ---------------------------------------------------------------------------

async function extractTokens(page) {
  const raw = await page.evaluate(() => {
    const cssVars = {};
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
            for (const prop of rule.style) {
              if (prop.startsWith('--')) {
                cssVars[prop] = rule.style.getPropertyValue(prop).trim();
              }
            }
          }
        }
      } catch { /* cross-origin sheet — skip */ }
    }

    const fontElements = {
      body: document.body,
      h1: document.querySelector('h1'),
      h2: document.querySelector('h2'),
      h3: document.querySelector('h3'),
    };
    const fonts = {};
    for (const [key, el] of Object.entries(fontElements)) {
      if (el) {
        const style = getComputedStyle(el);
        fonts[key] = {
          family: style.fontFamily,
          size: style.fontSize,
          weight: style.fontWeight,
          lineHeight: style.lineHeight,
        };
      }
    }

    // Raw color samples — deduplication happens in Node.js
    const rawColors = [];
    const sampleSelectors = [
      'header', 'nav', 'footer', 'main', 'section',
      'button', 'a', 'h1', 'h2', '[class*="hero"]',
      '[class*="card"]', '[class*="btn"]', '[class*="cta"]',
    ];
    for (const sel of sampleSelectors) {
      const els = document.querySelectorAll(sel);
      for (const el of Array.from(els).slice(0, 3)) {
        const style = getComputedStyle(el);
        rawColors.push(style.backgroundColor, style.color);
        if (style.borderColor) rawColors.push(style.borderColor);
      }
    }

    return { cssVars, fonts, rawColors };
  });

  return {
    cssVars: raw.cssVars,
    fonts: raw.fonts,
    colors: deduplicateColors(raw.rawColors),
    spacing: {}, // placeholder — extend if needed
  };
}

// ---------------------------------------------------------------------------
// Stack detection
// ---------------------------------------------------------------------------

function detectStack(html) {
  const patterns = [
    { name: 'Next.js',    regex: /__NEXT_DATA__|_next\/static/,                   confidence: 0.95 },
    { name: 'Nuxt',       regex: /__NUXT__|_nuxt\//,                              confidence: 0.95 },
    { name: 'Gatsby',     regex: /___gatsby|gatsby-/,                             confidence: 0.9  },
    { name: 'Remix',      regex: /__remixContext|remix-/,                         confidence: 0.9  },
    { name: 'Astro',      regex: /astro-island|astro:load/,                       confidence: 0.9  },
    { name: 'React',      regex: /react\.production|__reactFiber|data-reactroot/, confidence: 0.8  },
    { name: 'Vue',        regex: /__vue__|data-v-[a-f0-9]+/,                      confidence: 0.8  },
    { name: 'Angular',    regex: /ng-version|angular\.min\.js/,                   confidence: 0.85 },
    { name: 'Svelte',     regex: /svelte-[a-z0-9]+|__svelte/,                    confidence: 0.85 },
    { name: 'WordPress',  regex: /wp-content|wp-includes/,                        confidence: 0.95 },
    { name: 'Webflow',    regex: /webflow\.com|data-wf-/,                         confidence: 0.95 },
    { name: 'Shopify',    regex: /Shopify\.theme|cdn\.shopify\.com/,              confidence: 0.95 },
    { name: 'Framer',     regex: /framer\.com|framerusercontent/,                 confidence: 0.95 },
    { name: 'Tailwind',   regex: /tailwindcss|class="[^"]*(?:flex|grid|px-|py-|text-|bg-)[^"]*"/, confidence: 0.75 },
    { name: 'Bootstrap',  regex: /bootstrap\.min\.css|class="[^"]*(?:btn|col-|row|container)[^"]*"/, confidence: 0.7 },
    { name: 'MUI',        regex: /MuiButton|MuiTypography|@mui\//,                confidence: 0.85 },
    { name: 'Ant Design', regex: /ant-btn|antd\/|@ant-design/,                    confidence: 0.85 },
    { name: 'Chakra',     regex: /chakra-|@chakra-ui/,                            confidence: 0.85 },
    { name: 'shadcn',     regex: /radix-ui|@radix-ui|data-radix/,                 confidence: 0.75 },
    { name: 'Bulma',      regex: /bulma\.min\.css|class="[^"]*(?:is-primary|column|columns)[^"]*"/, confidence: 0.7 },
  ];

  const detected = patterns
    .filter(({ regex }) => regex.test(html))
    .map(({ name, confidence }) => ({ name, confidence }))
    .sort((a, b) => b.confidence - a.confidence);

  return { detected, html_length: html.length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  // Phase 0 — Playwright bootstrap (fatal if fails)
  try {
    ensurePlaywright();
  } catch (err) {
    console.error('\nPlaywright setup failed:', err.message);
    console.error('\nFalling back to curl for DOM capture only...');
    // Write a minimal status and fall through to curl fallback
    const curlResult = spawnSync('curl', ['-sL', '--max-time', '30', url], { encoding: 'utf8' });
    if (curlResult.status === 0 && curlResult.stdout) {
      fs.writeFileSync(path.join(outputDir, 'dom.html'), curlResult.stdout, 'utf8');
      const stackData = detectStack(curlResult.stdout);
      fs.writeFileSync(path.join(outputDir, 'stack.json'), JSON.stringify(stackData, null, 2), 'utf8');
      status.dom = true;
      status.stack = true;
      status.errors.push(`Playwright unavailable: ${err.message}`);
      console.log('\nFallback capture complete (DOM only, no screenshots).');
    } else {
      status.errors.push(`Playwright unavailable and curl failed: ${curlResult.stderr || 'unknown'}`);
    }
    fs.writeFileSync(path.join(outputDir, 'capture-status.json'), JSON.stringify(status, null, 2), 'utf8');
    process.exit(0); // non-fatal — let pipeline continue at Tier 2
  }

  let playwright;
  try {
    playwright = require('playwright');
  } catch {
    playwright = require(path.join(PW_INSTALL_DIR, 'node_modules', 'playwright'));
  }

  const browser = await playwright.chromium.launch({ headless: true });

  let domHtml = '';
  let tokens = {};
  let stackData = { detected: [], html_length: 0 };

  // Phase 1a — Desktop screenshot + DOM + tokens
  console.log('Capturing desktop (1440px)...');
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
    await page.waitForTimeout(2000); // extra settle time for JS-heavy SPAs

    // Trigger lazy-loaded elements by scrolling the full page
    await page.evaluate(async () => {
      await new Promise(resolve => {
        const distance = 300;
        let scrolled = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          scrolled += distance;
          if (scrolled >= document.body.scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 80);
      });
    });
    await page.waitForTimeout(1200); // let lazy images render after scroll

    await page.screenshot({
      path: path.join(outputDir, 'screenshot-desktop.png'),
      fullPage: true,
    });
    status.screenshotDesktop = true;
    console.log('  screenshot-desktop.png ✓');

    domHtml = await page.content();
    fs.writeFileSync(path.join(outputDir, 'dom.html'), domHtml, 'utf8');
    status.dom = true;
    console.log('  dom.html ✓');

    try {
      tokens = await extractTokens(page);
      fs.writeFileSync(path.join(outputDir, 'tokens.json'), JSON.stringify(tokens, null, 2), 'utf8');
      status.tokens = true;
      console.log('  tokens.json ✓');
    } catch (err) {
      status.errors.push(`Token extraction failed: ${err.message}`);
      fs.writeFileSync(path.join(outputDir, 'tokens.json'), JSON.stringify({ cssVars: {}, fonts: {}, colors: [], spacing: {}, error: err.message }, null, 2), 'utf8');
      console.warn('  tokens.json — extraction failed, empty file written');
    }

    try {
      const animations = await extractAnimations(page);
      fs.writeFileSync(path.join(outputDir, 'animations.json'), JSON.stringify(animations, null, 2), 'utf8');
      status.animations = true;
      console.log('  animations.json ✓');
    } catch (err) {
      status.errors.push(`Animation extraction failed: ${err.message}`);
      fs.writeFileSync(path.join(outputDir, 'animations.json'), JSON.stringify({ keyframes: {}, transitions: {}, scrollAnimations: [], libraries: [], animationProps: [], error: err.message }, null, 2), 'utf8');
      console.warn('  animations.json — extraction failed, empty file written');
    }

    try {
      const media = await extractMedia(page);
      fs.writeFileSync(path.join(outputDir, 'media.json'), JSON.stringify(media, null, 2), 'utf8');
      status.media = true;
      const summary = [
        media.videos.length && `${media.videos.length} video(s)`,
        media.iframes.length && `${media.iframes.length} iframe(s)`,
        media.canvases.length && `${media.canvases.length} canvas(es)`,
        media.animatedGifs.length && `${media.animatedGifs.length} animated GIF(s)`,
        media.lottieContainers.length && `${media.lottieContainers.length} Lottie container(s)`,
      ].filter(Boolean).join(', ');
      console.log(`  media.json ✓${summary ? ' — found: ' + summary : ' — no rich media'}`);
    } catch (err) {
      status.errors.push(`Media extraction failed: ${err.message}`);
      fs.writeFileSync(path.join(outputDir, 'media.json'), JSON.stringify({ videos: [], iframes: [], canvases: [], animatedGifs: [], lottieContainers: [], error: err.message }, null, 2), 'utf8');
      console.warn('  media.json — extraction failed, empty file written');
    }

    try {
      const layout = await extractLayout(page);
      fs.writeFileSync(path.join(outputDir, 'layout.json'), JSON.stringify(layout, null, 2), 'utf8');
      status.layout = true;
      console.log(`  layout.json ✓ — ${layout.length} grid/flex element(s)`);
    } catch (err) {
      status.errors.push(`Layout extraction failed: ${err.message}`);
      fs.writeFileSync(path.join(outputDir, 'layout.json'), JSON.stringify([], null, 2), 'utf8');
      console.warn('  layout.json — extraction failed, empty file written');
    }

    stackData = detectStack(domHtml);
    fs.writeFileSync(path.join(outputDir, 'stack.json'), JSON.stringify(stackData, null, 2), 'utf8');
    status.stack = true;
    console.log('  stack.json ✓');

    await ctx.close();
  } catch (err) {
    status.errors.push(`Desktop capture failed: ${err.message}`);
    console.warn('  Desktop capture failed:', err.message);
    // If we got DOM via this attempt, still proceed
  }

  // Phase 1b — Mobile screenshot (independent of desktop)
  console.log('Capturing mobile (390px)...');
  try {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 30_000 });
    await page.waitForTimeout(1500); // extra settle time for JS-heavy SPAs

    // Trigger lazy-loaded elements by scrolling the full page
    await page.evaluate(async () => {
      await new Promise(resolve => {
        const distance = 300;
        let scrolled = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          scrolled += distance;
          if (scrolled >= document.body.scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 80);
      });
    });
    await page.waitForTimeout(1200); // let lazy images render after scroll

    await page.screenshot({
      path: path.join(outputDir, 'screenshot-mobile.png'),
      fullPage: true,
    });
    status.screenshotMobile = true;
    console.log('  screenshot-mobile.png ✓');

    await ctx.close();
  } catch (err) {
    status.errors.push(`Mobile capture failed: ${err.message}`);
    console.warn('  Mobile capture failed:', err.message);
  }

  await browser.close();

  // Summary
  fs.writeFileSync(path.join(outputDir, 'capture-status.json'), JSON.stringify(status, null, 2), 'utf8');

  console.log('\nCapture complete →', outputDir);
  if (status.errors.length) {
    console.warn('Partial failures (see capture-status.json):');
    status.errors.forEach(e => console.warn(' ', e));
  }

  if (stackData.detected.length) {
    console.log('\nDetected stack:');
    for (const { name, confidence } of stackData.detected) {
      console.log(`  ${name} (${Math.round(confidence * 100)}%)`);
    }
  }
}

run().catch(err => {
  console.error('capture.js fatal error:', err.message);
  fs.writeFileSync(
    path.join(outputDir, 'capture-status.json'),
    JSON.stringify({ ...status, errors: [...status.errors, err.message] }, null, 2),
    'utf8'
  );
  process.exit(1);
});
