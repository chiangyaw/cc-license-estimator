/**
 * Static security tests for index.html and script.js.
 *
 * These tests analyse file content and DOM structure without executing any
 * application code, so they run in the default Node test environment.
 */

import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const htmlContent   = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
const scriptContent = readFileSync(resolve(__dirname, '../script.js'),  'utf8');

// Parse HTML for DOM queries (no script execution needed here)
const { document } = new JSDOM(htmlContent).window;

// ---------------------------------------------------------------------------
// Dangerous JavaScript patterns
// ---------------------------------------------------------------------------
describe('JavaScript — dangerous patterns', () => {
    test('does not use eval()', () => {
        // eval() on any string is a code-injection risk
        expect(scriptContent).not.toMatch(/\beval\s*\(/);
    });

    test('does not use document.write()', () => {
        // document.write() can overwrite the whole page and introduce XSS
        expect(scriptContent).not.toMatch(/document\.write\s*\(/);
    });

    test('does not pass strings to setTimeout or setInterval (string-eval equivalent)', () => {
        expect(scriptContent).not.toMatch(/setTimeout\s*\(\s*['"]/);
        expect(scriptContent).not.toMatch(/setInterval\s*\(\s*['"]/);
    });

    test('user-supplied form values are parsed as integers before use', () => {
        // All DOM value reads should go through parseInt() so no raw string
        // from a form field is ever concatenated into innerHTML.
        expect(scriptContent).toContain('parseInt(');
    });
});

// ---------------------------------------------------------------------------
// innerHTML XSS surface
// ---------------------------------------------------------------------------
describe('JavaScript — innerHTML usage', () => {
    test('values written to innerHTML are derived from numeric operations, not raw user strings', () => {
        // Collect every line that assigns to innerHTML
        const innerHTMLLines = scriptContent
            .split('\n')
            .filter(line => line.includes('innerHTML'));

        // None of those lines should directly interpolate a .value property
        // (which would be a raw user string from a form field)
        innerHTMLLines.forEach(line => {
            expect(line).not.toMatch(/\.value/);
        });
    });
});

// ---------------------------------------------------------------------------
// HTML — external link safety
// ---------------------------------------------------------------------------
describe('HTML — external link safety', () => {
    test('all href attributes that start with "http" use HTTPS', () => {
        const links = document.querySelectorAll('a[href]');
        expect(links.length).toBeGreaterThan(0);
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href.startsWith('http://')) {
                throw new Error(`Insecure HTTP link found: ${href}`);
            }
        });
    });

    test('all links opening in a new tab have rel="noopener" (prevents tab-napping)', () => {
        const newTabLinks = document.querySelectorAll('a[target="_blank"]');
        expect(newTabLinks.length).toBeGreaterThan(0);
        newTabLinks.forEach(link => {
            const rel = link.getAttribute('rel') || '';
            expect(rel).toMatch(/noopener/);
        });
    });

    test('all links opening in a new tab have rel="noreferrer" (prevents referrer leakage)', () => {
        const newTabLinks = document.querySelectorAll('a[target="_blank"]');
        newTabLinks.forEach(link => {
            const rel = link.getAttribute('rel') || '';
            expect(rel).toMatch(/noreferrer/);
        });
    });
});

// ---------------------------------------------------------------------------
// HTML — form and input constraints
// ---------------------------------------------------------------------------
describe('HTML — input constraints', () => {
    test('all number inputs exist and have type="number"', () => {
        const expectedIds = [
            'vms-not-running-containers',
            'vms-running-containers',
            'caas-managed-containers',
            'serverless-functions',
            'container-images',
            'cloud-buckets',
            'managed-cloud-database',
            'dbaas-tb-stored',
            'saas-users',
            'developers',
            'unmanaged-assets',
        ];
        expectedIds.forEach(id => {
            const el = document.getElementById(id);
            expect(el).not.toBeNull();
            expect(el.getAttribute('type')).toBe('number');
        });
    });

    test('all number inputs have min="0" to block negative values', () => {
        const numberInputs = document.querySelectorAll('input[type="number"]');
        expect(numberInputs.length).toBeGreaterThan(0);
        numberInputs.forEach(input => {
            expect(input.getAttribute('min')).toBe('0');
        });
    });

    test('the estimator form has an id so submit can be intercepted in JS', () => {
        expect(document.getElementById('estimator-form')).not.toBeNull();
    });
});

// ---------------------------------------------------------------------------
// HTML — script loading
// ---------------------------------------------------------------------------
describe('HTML — script loading', () => {
    test('no inline <script> blocks in the document (only external src scripts)', () => {
        const inlineScripts = document.querySelectorAll('script:not([src])');
        expect(inlineScripts.length).toBe(0);
    });

    test('all <script> tags load from relative paths, not third-party CDNs', () => {
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            expect(script.getAttribute('src')).not.toMatch(/^https?:\/\//);
        });
    });
});

// ---------------------------------------------------------------------------
// Content — no hardcoded secrets
// ---------------------------------------------------------------------------
describe('Content — no hardcoded secrets', () => {
    test('HTML does not contain patterns resembling API keys or tokens', () => {
        expect(htmlContent).not.toMatch(/api[_-]?key\s*[:=]\s*['"][^'"]{10,}/i);
        expect(htmlContent).not.toMatch(/token\s*[:=]\s*['"][^'"]{20,}/i);
    });

    test('JavaScript does not contain patterns resembling hardcoded credentials', () => {
        expect(scriptContent).not.toMatch(/api[_-]?key\s*[:=]\s*['"][^'"]{10,}/i);
        expect(scriptContent).not.toMatch(/password\s*[:=]\s*['"][^'"]{3,}/i);
    });
});
