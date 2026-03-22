# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-03-22

### Added
- Download as CSV button in the Results section — exports feature selections, workload inputs, and calculated license counts
- Vite as the build tool (`npm run dev`, `npm run build`, `npm run preview`)
- Vitest test framework with two test suites:
  - `tests/logic.test.js` — 24 tests covering all calculation scenarios, MOQ enforcement, and workload ratio conversions
  - `tests/security.test.js` — 14 tests for static security analysis of HTML and JavaScript
- GitHub Actions CI workflow — runs build and tests on every push and pull request to `main`
- `.gitignore` to exclude `node_modules/` and `dist/` from version control
- `CHANGELOG.md` and semantic versioning

### Changed
- Workload inputs grouped into three labelled sections (Posture / Runtime Security, Posture Security, Application Security) for clearer license mapping
- `script.js` loaded as `type="module"` for proper Vite bundling

### Fixed
- External links missing `rel="noopener noreferrer"` on `target="_blank"` anchors (tab-napping vulnerability)

## [1.0.0] - 2025-01-01

### Added
- Initial release of the Cortex Cloud License Estimator
- Estimator tab with feature selection (Posture, Runtime, Application Security) and workload quantity inputs
- License calculation engine with workload-to-billable-unit ratios and MOQ of 200
- Container image free quota logic (10x deployed workloads)
- Questions tab with sizing guidance
- Script tab linking to the Cortex Cloud Sizing Scripts
- About tab
