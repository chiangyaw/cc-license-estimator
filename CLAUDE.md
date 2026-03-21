# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a static web application — a Cortex Cloud License Estimator for Palo Alto Networks. It has no build step, no package manager, and no test framework. Development is done by editing files directly and opening `index.html` in a browser.

## Files

- [index.html](index.html) — Full UI: tab navigation (Estimator, Questions, Script, About), workload input form, results display
- [script.js](script.js) — All calculation logic and tab switching
- [style.css](style.css) — Dark theme styles

## Calculation Logic (script.js)

The core `calculateLicenses()` function works in four steps:

1. **Workload-to-billable-unit conversion** using `RATIOS` (e.g., 10 CaaS containers = 1 workload, 25 serverless functions = 1 workload)
2. **Container image free quota**: `totalDeployedWorkloads × 10` images are free; only excess images are billed
3. **License determination** based on which features are selected (Posture, Runtime, Application Security):
   - MOQ (Minimum Order Quantity) = 200 workloads
   - Posture-only: MOQ applies to the combined posture+runtime workload sum
   - Runtime (with or without Posture): Runtime license = max(runtime workloads, MOQ); Posture license = posture workloads as-is
   - Application Security: add-on only (requires Posture or Runtime); minimum 5 developer licenses
4. **Error checks**: no features selected; Application Security selected standalone; developers > 0 without Application Security

The `RATIOS` object in `script.js` is the single source of truth for all conversion rates. Any licensing rule changes start there.

## Testing

```
npm install        # first time only
npm test           # run all tests
npm run test:logic     # logic tests only
npm run test:security  # security tests only
```

**[tests/logic.test.js](tests/logic.test.js)** — loads `index.html` + `script.js` into a fresh jsdom window per test and calls `calculateLicenses()` directly. Covers: validation errors, Posture/Runtime/combined scenarios, MOQ enforcement, Application Security add-on, container image free quota, and workload ratio conversions.

**[tests/security.test.js](tests/security.test.js)** — static analysis of file content and DOM structure (no script execution). Checks for: dangerous JS patterns (`eval`, `document.write`), raw user strings reaching `innerHTML`, HTTP vs HTTPS links, `rel="noopener noreferrer"` on `target="_blank"` links, `min="0"` on all number inputs, no inline scripts, no third-party CDN scripts, and no hardcoded credentials.

GitHub Actions runs both suites on every push/PR to `main` via [.github/workflows/test.yml](.github/workflows/test.yml).
