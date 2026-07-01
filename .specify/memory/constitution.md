<!--
SYNC IMPACT REPORT
- Version change: 0.0.0 -> 1.0.0
- List of modified principles:
  - [PRINCIPLE_1_NAME] -> I. Code Quality & Maintainability
  - [PRINCIPLE_2_NAME] -> II. Automated Testing Discipline
  - [PRINCIPLE_3_NAME] -> III. User Experience Consistency
  - [PRINCIPLE_4_NAME] -> IV. Performance & Efficiency
- Added sections:
  - Development Workflow & Verification
- Removed sections:
  - None
- Templates requiring updates:
  - None
- Follow-up TODOs:
  - None
-->

# Ahilney Constitution

## Core Principles

### I. Code Quality & Maintainability
All contributions MUST be strictly typed, follow the modular package architecture, and introduce zero new linting or formatting errors. Functions MUST remain small and single-purpose. Complex, over-engineered abstractions are prohibited unless accompanied by a written justification detailing why simpler options are insufficient.

### II. Automated Testing Discipline
Every new feature, API endpoint, or distinct user story MUST have associated automated tests. Critical business logic requires unit tests, while cross-component integrations require contract or integration tests. Pull Requests MUST not be merged with failing tests.

### III. User Experience Consistency
All user interface elements MUST adhere to the global design system tokens (spacing, typography, color palette, and interactive states). Custom styling overrides are prohibited. Every asynchronous operation MUST provide immediate visual feedback (e.g., loading states or progress indicators) to guarantee user responsiveness.

### IV. Performance & Efficiency
Features MUST be designed and optimized to keep initial page load times under 1.5 seconds and API response latencies under 200ms for p95 requests. Codebases MUST prevent memory leaks, unoptimized bundle sizes, and redundant network requests.

## Development Workflow & Verification
All development cycles follow the branch-per-feature model. Merging code into the main branch requires:
1. All automated checks (linting, typechecking, tests) passing successfully.
2. At least one peer review approval.
3. Verification of UX compliance against the design criteria.

## Governance
This Constitution is the source of truth for all project standards. Any changes to these principles or workflows require a version bump in this document. Any Pull Request violating these principles MUST be blocked from merging until compliant or granted an explicit architectural exception.

**Version**: 1.0.0 | **Ratified**: 2026-06-30 | **Last Amended**: 2026-06-30
