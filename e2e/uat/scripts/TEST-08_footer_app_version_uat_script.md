# UAT Script: TEST-08 Footer shows the app version from the backend

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- `backend/pyproject.toml` has `version = "0.1.0"` and `frontend/package.json` has `version` `0.0.0`. If either differs when you start, substitute the real values in the expected results below; the two must differ for step 6 to prove anything.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Wait until the `db`, `backend` and `frontend` services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Run `curl -s http://localhost:8010/api/version` in a terminal | A JSON body is printed whose `version` is `0.1.0` | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` in a browser | The landing page with the "Task Notes" heading is shown | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the footer at the bottom of the page | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 4 | 1 | Inspect the footer in browser dev tools | The `<footer>` has `data-testid="app-footer"` and the version sits in an element with `data-testid="app-version"` | [ ] Pass [ ] Fail |
| 5 | 2 | Open `frontend/package.json` | Its `version` is `0.0.0`, which differs from the backend's `0.1.0` | [ ] Pass [ ] Fail |
| 6 | 2 | Reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0`, the backend's value, and not `v0.0.0` | [ ] Pass [ ] Fail |
| 7 | 2 | Edit `backend/pyproject.toml` to `version = "0.1.1"` and run `docker compose up -d --build backend` (backend only, no frontend rebuild) | The backend container restarts | [ ] Pass [ ] Fail |
| 8 | 2 | Reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.1` without any frontend rebuild | [ ] Pass [ ] Fail |
| 9 | 2 | Revert `backend/pyproject.toml` to `version = "0.1.0"` and run `docker compose up -d --build backend`, then reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 10 | 3 | Run `docker compose stop backend` | The backend container stops | [ ] Pass [ ] Fail |
| 11 | 3 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing space or gap | [ ] Pass [ ] Fail |
| 12 | 3 | Open the browser dev tools Network tab and reload | The `version` request shows as failed | [ ] Pass [ ] Fail |
| 13 | 3 | Run `docker compose start backend` and reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 14 | 4 | Run `npm --prefix frontend test` from the repository root | The suite passes with `0 failed`, including `AppFooter.test.tsx`, `version.test.ts` and `LandingPage.test.tsx` | [ ] Pass [ ] Fail |
| 15 | 4 | Read `frontend/src/components/AppFooter.test.tsx` | It contains a test for the version present (`renders the version the backend reports`) and one for it absent (`renders the app name without a version when the request fails`) | [ ] Pass [ ] Fail |
| 16 | 5 | In dev tools Network, set throttling to `Slow 3G`, then reload `http://localhost:5183/` and watch the footer | The footer first reads `Task Notes` with no version and no placeholder (no "Loading", no ellipsis) | [ ] Pass [ ] Fail |
| 17 | 5 | Wait for the `version` request to finish | The footer then reads `Task Notes v0.1.0`; afterwards set throttling back to `No throttling` | [ ] Pass [ ] Fail |
| 18 | Edge | From the repository root, run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts` | Both specs pass: the backend version is shown, and an unreachable `/api/version` leaves `Task Notes` alone | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 18 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
