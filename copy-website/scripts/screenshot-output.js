#!/usr/bin/env node
/**
 * screenshot-output.js — Phase 6 of copy-website pipeline
 * Usage: node screenshot-output.js <OUTPUT_DIR> [ITERATION]
 *
 * Screenshots the generated output at 1440px for scoring comparison.
 * Saves: <OUTPUT_DIR>/iteration-<N>-output.png
 *
 * Supports:
 *   - Plain HTML: opens code/index.html via file:// URL
 *   - Framework (React/Vue/Astro): builds dist/, serves with npx serve, screenshots
 *   - Next.js static export: builds to out/, serves, screenshots
 */

const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const [,, outputDir, iterationArg] = process.argv;
const iteration = parseInt(iterationArg || '1');

if (!outputDir) {
  console.error('Usage: node screenshot-output.js <OUTPUT_DIR> [ITERATION]');
  process.exit(1);
}

const codeDir = path.join(outputDir, 'code');
const outFile = path.join(outputDir, `iteration-${iteration}-output.png`);

const PW_INSTALL_DIR = '/tmp/pw-install';

function ensurePlaywright() {
  try { require.resolve('playwright'); return; } catch {}
  if (fs.existsSync(path.join(PW_INSTALL_DIR, 'node_modules', 'playwright'))) {
    module.paths.unshift(path.join(PW_INSTALL_DIR, 'node_modules'));
    return;
  }
  console.log('Playwright not found at /tmp/pw-install — run capture.js first to install it.');
  process.exit(1);
}

async function waitForPort(port, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const http = require('http');
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}`, resolve);
        req.on('error', reject);
        req.setTimeout(500, () => { req.destroy(); reject(new Error('timeout')); });
      });
      return; // port is up
    } catch {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  throw new Error(`Port ${port} did not respond within ${timeoutMs}ms`);
}

async function run() {
  if (!fs.existsSync(codeDir)) {
    console.error(`code/ directory not found in ${outputDir}`);
    process.exit(1);
  }

  const htmlFile  = path.join(codeDir, 'index.html');
  const pkgFile   = path.join(codeDir, 'package.json');
  const port      = 4173 + (iteration - 1); // avoid conflicts across iterations

  let targetUrl;
  let serverProcess = null;

  // -------------------------------------------------------------------------
  // Detect output type
  // -------------------------------------------------------------------------

  if (fs.existsSync(htmlFile) && !fs.existsSync(pkgFile)) {
    // Plain HTML — no build needed
    targetUrl = `file://${path.resolve(htmlFile)}`;
    console.log('Plain HTML detected →', targetUrl);

  } else if (fs.existsSync(pkgFile)) {
    // Framework project — look for pre-built static output first
    const distCandidates = [
      path.join(codeDir, 'dist',  'index.html'),
      path.join(codeDir, 'out',   'index.html'),
      path.join(codeDir, 'build', 'index.html'),
    ];

    let distDir = null;
    for (const candidate of distCandidates) {
      if (fs.existsSync(candidate)) {
        distDir = path.dirname(candidate);
        break;
      }
    }

    if (!distDir) {
      // Build the project
      console.log('No pre-built output found. Running npm install + npm run build...');

      const install = spawnSync('npm', ['install', '--prefer-offline'], {
        cwd: codeDir, stdio: 'inherit', timeout: 120_000,
      });
      if (install.status !== 0) {
        console.error('npm install failed — fix dependencies first.');
        process.exit(1);
      }

      const build = spawnSync('npm', ['run', 'build'], {
        cwd: codeDir, stdio: 'inherit', timeout: 180_000,
      });
      if (build.status !== 0) {
        console.error(
          'npm run build failed.\n' +
          'For Next.js: add `output: "export"` to next.config.js then rebuild.\n' +
          'Or start the dev server manually and set TARGET_URL env var:\n' +
          '  TARGET_URL=http://localhost:3000 node screenshot-output.js <OUTPUT_DIR> <ITERATION>'
        );
        process.exit(1);
      }

      // Re-check after build
      for (const candidate of distCandidates) {
        if (fs.existsSync(candidate)) {
          distDir = path.dirname(candidate);
          break;
        }
      }

      if (!distDir) {
        // Allow caller to override with TARGET_URL env var
        if (process.env.TARGET_URL) {
          targetUrl = process.env.TARGET_URL;
          console.log('Using TARGET_URL from environment:', targetUrl);
        } else {
          console.error(
            'Build succeeded but no dist/index.html found.\n' +
            'Start the dev server manually, then re-run with:\n' +
            `  TARGET_URL=http://localhost:PORT node screenshot-output.js ${outputDir} ${iteration}`
          );
          process.exit(1);
        }
      }
    }

    if (!targetUrl && distDir) {
      console.log(`Serving ${distDir} on port ${port}...`);
      serverProcess = spawn(
        'npx', ['serve', '-p', String(port), '--no-clipboard', distDir],
        { stdio: 'pipe' }
      );

      serverProcess.on('error', (err) => {
        console.error('serve failed to start:', err.message);
      });

      try {
        await waitForPort(port);
      } catch (err) {
        console.error('Server did not start in time:', err.message);
        serverProcess.kill();
        process.exit(1);
      }

      targetUrl = `http://localhost:${port}`;
      console.log('Server ready →', targetUrl);
    }

  } else if (process.env.TARGET_URL) {
    targetUrl = process.env.TARGET_URL;
    console.log('Using TARGET_URL from environment:', targetUrl);
  } else {
    console.error(`No index.html or package.json found in ${codeDir}`);
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Screenshot
  // -------------------------------------------------------------------------

  try {
    ensurePlaywright();

    let playwright;
    try { playwright = require('playwright'); }
    catch { playwright = require(path.join(PW_INSTALL_DIR, 'node_modules', 'playwright')); }

    const browser = await playwright.chromium.launch({ headless: true });
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();

    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(2000); // let animations finish their first run

    await page.screenshot({ path: outFile, fullPage: true });
    await browser.close();

    console.log(`\nOutput screenshot → ${outFile}`);
  } finally {
    if (serverProcess) {
      serverProcess.kill();
      console.log('Serve process stopped.');
    }
  }
}

run().catch(err => {
  console.error('screenshot-output.js fatal error:', err.message);
  process.exit(1);
});
