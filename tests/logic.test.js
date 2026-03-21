/**
 * Logic tests for calculateLicenses().
 *
 * Strategy: load the real HTML into a jsdom window, then eval script.js inside
 * that window so all globals (calculateLicenses, openTab) are attached to it.
 * Each test gets a fresh DOM via beforeEach to avoid state leakage.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const htmlContent   = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
const scriptContent = readFileSync(resolve(__dirname, '../script.js'),  'utf8');

let dom;

function setInput(id, value) {
    dom.window.document.getElementById(id).value = String(value);
}

function setFeatures({ posture = false, runtime = false, application = false } = {}) {
    dom.window.document.getElementById('feature-posture').checked = posture;
    dom.window.document.getElementById('feature-runtime').checked = runtime;
    dom.window.document.getElementById('feature-application').checked = application;
}

function getResult() {
    return dom.window.document.getElementById('results-section').innerHTML;
}

function calculate() {
    dom.window.calculateLicenses();
    return getResult();
}

beforeEach(() => {
    // Fresh DOM + fresh script execution for every test
    dom = new JSDOM(htmlContent, { runScripts: 'dangerously' });
    dom.window.eval(scriptContent);
    // All number inputs already default to "0" per the HTML
});

// ---------------------------------------------------------------------------
// Error validation
// ---------------------------------------------------------------------------
describe('Error validation', () => {
    test('shows error when no features are selected', () => {
        expect(calculate()).toContain('None of the features are chosen');
    });

    test('shows error when Application Security is selected without Posture or Runtime', () => {
        setFeatures({ application: true });
        expect(calculate()).toContain('Application Security can only be added as add-ons');
    });

    test('shows error when developers > 0 but Application Security is not selected', () => {
        setFeatures({ posture: true });
        setInput('developers', 5);
        expect(calculate()).toContain('Application Security is not chosen');
    });
});

// ---------------------------------------------------------------------------
// Posture Security only
// ---------------------------------------------------------------------------
describe('Posture Security only', () => {
    test('returns no license required when all inputs are zero', () => {
        setFeatures({ posture: true });
        expect(calculate()).toContain('No license required');
    });

    test('applies MOQ of 200 when effective workload is below minimum (100 VMs → effective 100)', () => {
        setFeatures({ posture: true });
        setInput('vms-not-running-containers', 100); // runtime workload = 100; effective posture = 0+100 = 100
        expect(calculate()).toContain('Posture Security License Required: 200');
    });

    test('uses actual workload count when above MOQ (300 VMs)', () => {
        setFeatures({ posture: true });
        setInput('vms-not-running-containers', 300);
        expect(calculate()).toContain('Posture Security License Required: 300');
    });

    test('calculates posture workloads from cloud resources: 3000 buckets = 300 workloads', () => {
        setFeatures({ posture: true });
        setInput('cloud-buckets', 3000); // 3000 / 10 = 300
        expect(calculate()).toContain('Posture Security License Required: 300');
    });

    test('calculates posture workloads from PaaS databases: 2 databases = 1 workload', () => {
        setFeatures({ posture: true });
        setInput('managed-cloud-database', 600); // 600 / 2 = 300
        expect(calculate()).toContain('Posture Security License Required: 300');
    });
});

// ---------------------------------------------------------------------------
// Runtime Security only
// ---------------------------------------------------------------------------
describe('Runtime Security only', () => {
    test('applies MOQ of 200 when no workloads are entered', () => {
        setFeatures({ runtime: true });
        expect(calculate()).toContain('Runtime Security License Required: 200');
    });

    test('applies MOQ of 200 when workload is below minimum (100 VMs)', () => {
        setFeatures({ runtime: true });
        setInput('vms-not-running-containers', 100);
        expect(calculate()).toContain('Runtime Security License Required: 200');
    });

    test('uses actual workload count when above MOQ (300 VMs)', () => {
        setFeatures({ runtime: true });
        setInput('vms-not-running-containers', 300);
        expect(calculate()).toContain('Runtime Security License Required: 300');
    });

    test('10 CaaS managed containers = 1 runtime workload unit (250 → 25 → MOQ 200)', () => {
        setFeatures({ runtime: true });
        setInput('caas-managed-containers', 250); // 250 / 10 = 25 → MOQ
        expect(calculate()).toContain('Runtime Security License Required: 200');
    });

    test('25 serverless functions = 1 runtime workload unit (5025 → 201)', () => {
        setFeatures({ runtime: true });
        setInput('serverless-functions', 5025); // 5025 / 25 = 201
        expect(calculate()).toContain('Runtime Security License Required: 201');
    });
});

// ---------------------------------------------------------------------------
// Posture + Runtime Security
// ---------------------------------------------------------------------------
describe('Posture + Runtime Security', () => {
    test('runtime meets MOQ, posture uses its actual count', () => {
        setFeatures({ posture: true, runtime: true });
        setInput('vms-not-running-containers', 100); // runtime = 100 → max(100, 200) = 200
        setInput('cloud-buckets', 1000);             // posture = 100
        const result = calculate();
        expect(result).toContain('Posture Security License Required: 100');
        expect(result).toContain('Runtime Security License Required: 200');
    });

    test('large runtime workload with zero posture workloads suppresses posture line', () => {
        setFeatures({ posture: true, runtime: true });
        setInput('vms-running-containers', 500);
        const result = calculate();
        expect(result).toContain('Runtime Security License Required: 500');
        expect(result).not.toContain('Posture Security License Required');
    });

    test('4 unmanaged assets = 1 posture workload unit (1000 → 250)', () => {
        setFeatures({ posture: true, runtime: true });
        setInput('unmanaged-assets', 1000); // 1000 / 4 = 250 posture workloads
        const result = calculate();
        expect(result).toContain('Posture Security License Required: 250');
        expect(result).toContain('Runtime Security License Required: 200'); // MOQ (0 runtime)
    });
});

// ---------------------------------------------------------------------------
// Application Security add-on
// ---------------------------------------------------------------------------
describe('Application Security add-on', () => {
    test('enforces minimum of 5 developer licenses when developer count is below 5', () => {
        setFeatures({ posture: true, application: true });
        setInput('developers', 3);
        expect(calculate()).toContain('Application Security License Required: 5');
    });

    test('uses actual developer count when above the minimum of 5', () => {
        setFeatures({ posture: true, application: true });
        setInput('developers', 20);
        expect(calculate()).toContain('Application Security License Required: 20');
    });

    test('defaults to 5 developer licenses when developer input is 0', () => {
        setFeatures({ posture: true, application: true });
        // developers stays at default 0
        expect(calculate()).toContain('Application Security License Required: 5');
    });

    test('can be combined with Runtime Security', () => {
        setFeatures({ runtime: true, application: true });
        setInput('vms-not-running-containers', 300);
        setInput('developers', 10);
        const result = calculate();
        expect(result).toContain('Runtime Security License Required: 300');
        expect(result).toContain('Application Security License Required: 10');
    });
});

// ---------------------------------------------------------------------------
// Container image free quota
// ---------------------------------------------------------------------------
describe('Container image free quota', () => {
    test('images within free quota (10x deployed workloads) are not billed', () => {
        setFeatures({ posture: true });
        setInput('vms-not-running-containers', 100); // deployed = 100, quota = 1000
        setInput('container-images', 500);           // 500 < 1000 → 0 billable images
        // Posture workload = 0; runtime workload = 100; effective = 100 → MOQ 200
        expect(calculate()).toContain('Posture Security License Required: 200');
    });

    test('images exceeding free quota are billed at 10 images per workload unit', () => {
        setFeatures({ posture: true, runtime: true });
        setInput('vms-not-running-containers', 100); // runtime = 100; quota = 1000
        setInput('container-images', 1500);          // 500 excess → 50 posture workloads
        const result = calculate();
        expect(result).toContain('Posture Security License Required: 50');
        expect(result).toContain('Runtime Security License Required: 200');
    });

    test('all images are billed when there are no deployed workloads', () => {
        setFeatures({ posture: true });
        setInput('container-images', 300); // no deployed VMs → quota = 0 → all 300 billed → 30 workloads
        // effectivePostureWorkload = 30 → MOQ 200
        expect(calculate()).toContain('Posture Security License Required: 200');
    });
});
