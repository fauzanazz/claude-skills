#!/usr/bin/env node
/**
 * firecrawl.js — Phase 2 of copy-website pipeline (optional)
 * Usage: node firecrawl.js <URL> <OUTPUT_DIR>
 *
 * Requires: FIRECRAWL_API_KEY environment variable
 * If key is missing, prints setup instructions and exits 0 (pipeline continues).
 *
 * Produces:
 *   content.md      (clean markdown of page content)
 *   metadata.json   (title, og tags, description)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [,, url, outputDir] = process.argv;

if (!url || !outputDir) {
  console.error('Usage: node firecrawl.js <URL> <OUTPUT_DIR>');
  process.exit(1);
}

const apiKey = process.env.FIRECRAWL_API_KEY;

if (!apiKey) {
  console.log('');
  console.log('Firecrawl not configured (FIRECRAWL_API_KEY not set).');
  console.log('Skipping Phase 2 — pipeline will continue with DOM-only content extraction.');
  console.log('');
  console.log('To enable Firecrawl:');
  console.log('  1. Get an API key at https://firecrawl.dev');
  console.log('  2. Set: export FIRECRAWL_API_KEY=fc-<your-key>');
  console.log('  3. Re-run: FIRECRAWL_API_KEY=fc-<your-key> node firecrawl.js <URL> <OUTPUT_DIR>');
  console.log('');
  process.exit(0);
}

fs.mkdirSync(outputDir, { recursive: true });

// Install @mendable/firecrawl-js on-demand in the output dir
const pkgDir = path.join(outputDir, '.firecrawl-pkg');
if (!fs.existsSync(path.join(pkgDir, 'node_modules', '@mendable', 'firecrawl-js'))) {
  console.log('Installing @mendable/firecrawl-js...');
  fs.mkdirSync(pkgDir, { recursive: true });
  execSync(`npm install --prefix ${pkgDir} @mendable/firecrawl-js`, { stdio: 'pipe' });
}

async function run() {
  const { FirecrawlAppV1: FirecrawlApp } = require(path.join(pkgDir, 'node_modules', '@mendable', 'firecrawl-js'));

  const app = new FirecrawlApp({ apiKey });

  console.log(`Scraping ${url} with Firecrawl...`);

  const result = await app.scrapeUrl(url, {
    formats: ['markdown', 'html'],
    actions: [
      { type: 'scroll', direction: 'down', amount: 3000 },
      { type: 'wait', milliseconds: 1500 },
    ],
  });

  if (!result.success) {
    console.error('Firecrawl scrape failed:', result.error || 'unknown error');
    process.exit(1);
  }

  // Write content.md
  const markdown = result.markdown || result.content || '';
  fs.writeFileSync(path.join(outputDir, 'content.md'), markdown, 'utf8');

  // Write metadata.json
  const metadata = {
    title: result.metadata?.title || '',
    description: result.metadata?.description || '',
    ogTitle: result.metadata?.ogTitle || '',
    ogDescription: result.metadata?.ogDescription || '',
    ogImage: result.metadata?.ogImage || '',
    url: result.metadata?.sourceURL || url,
    language: result.metadata?.language || '',
    keywords: result.metadata?.keywords || '',
    statusCode: result.metadata?.statusCode || 200,
  };
  fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');

  console.log('Firecrawl complete. Files written:');
  console.log('  content.md  (' + markdown.length + ' chars)');
  console.log('  metadata.json');
  console.log('  Title:', metadata.title);
}

run().catch(err => {
  console.error('firecrawl.js failed:', err.message);
  // Non-fatal — exit 0 so pipeline continues
  console.log('Continuing pipeline without Firecrawl content.');
  process.exit(0);
});
