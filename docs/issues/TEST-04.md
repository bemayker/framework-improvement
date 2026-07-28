---
id: TEST-04
type: feature
title: Page footer with app version
status: done
branch: feature/TEST-04-page-footer
depends_on: [TEST-01]
scaffold: false
---

## Description / expected behaviour

Add a footer to the landing page showing the application name and its version, read from `frontend/package.json` rather than hardcoded. Frontend only; no backend or database work. Deliberately trivial, and deliberately disjoint from TEST-02's backend files so the two can run concurrently in a batch.

## Acceptance criteria

- [ ] The landing page renders a footer containing the application name and the version string from `frontend/package.json`.
- [ ] The footer is a semantic `<footer>` element and carries a `data-testid` so E2E specs can target it.
- [ ] The existing landing-page heading and subtitle, and their `data-testid` values, are unchanged.
