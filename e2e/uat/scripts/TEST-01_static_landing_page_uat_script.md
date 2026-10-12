# UAT Script: TEST-01 Static landing page

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-01-static-landing-page` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5173` (frontend) or `8000` (backend).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (the `frontend` log shows the Vite dev server listening on port 5173).

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open a browser and navigate to `http://localhost:5173` | Page loads without errors | [ ] Pass [ ] Fail |
| 2 | Observe the page content | A landing page is shown with the title "Task Notes" prominently displayed | [ ] Pass [ ] Fail |
| 3 | Observe the subtitle text beneath the title | A short subtitle describing the app is visible | [ ] Pass [ ] Fail |
| 4 | Open browser dev tools and inspect the title element | The heading element has `data-testid="landing-title"` and its container has `data-testid="landing-page"` | [ ] Pass [ ] Fail |
| 5 | Refresh the page (or open `http://localhost:5173` directly in a new tab) | The same landing page renders immediately, with no navigation step required | [ ] Pass [ ] Fail |
| 6 | Resize the browser window to a mobile width (e.g. 375px) | The title and subtitle remain readable and centered (no horizontal scroll, no overlapping text) | [ ] Pass [ ] Fail |
| 7 | In the repository root, run `docker compose ps` | All three services (`db`, `backend`, `frontend`) show status "running" (or "healthy" for `db`) | [ ] Pass [ ] Fail |
| 8 | In a separate terminal, run `cd backend && uv run pytest` | Unit tests pass; integration tests pass or report "no tests collected" (clean no-op) | [ ] Pass [ ] Fail |
| 9 | In a separate terminal, run `cd frontend && npm test` | Vitest suite passes, including the `LandingPage` render test | [ ] Pass [ ] Fail |
| 10 | From the repository root, run `npx playwright test e2e/tests/TEST-01_static_landing_page.spec.ts` | The E2E spec passes, confirming the "Task Notes" title is visible at the root URL | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
