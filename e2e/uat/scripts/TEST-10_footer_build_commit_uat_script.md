# UAT Script: TEST-10 Footer shows the build commit

Criteria 1 and 2 are checked in a browser against the running stack. The default compose build leaves `BUILD_COMMIT` empty, so the backend reports `unknown` and the footer would show no commit: step 1 therefore builds the backend with `BUILD_COMMIT` set. Criterion 3 is checked by the test run.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or, once merged, on `main`).
- `.env` copied from `.env.example`, with no `BUILD_COMMIT` value set in it.
- Host ports `5183` (frontend), `8010` (backend) and `5442` (database) free.
- A browser with dev tools; a terminal with `curl`; `npm` installed for step 11.

## Test Environment Setup

1. From the repository root, build the backend with a commit set (see README "Running the project"):
   ```bash
   BUILD_COMMIT=3f9c2a71b0de4c5e8a9f00112233445566778899 docker compose build backend
   ```
2. Run `docker compose up -d`.
3. Run `docker compose ps` until `db` reports healthy and `backend` and `frontend` report running.

## Steps

Note: the frontend runs in React.StrictMode under the Vite dev server, so the browser may show two `GET /api/version` requests on one page load. That is expected; do not fail a step on the request count.

### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/version` | Body is `{"version":"0.1.0","commit":"3f9c2a71b0de"}` (version as declared in `backend/pyproject.toml`) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` and look at the footer at the bottom of the landing page | The footer reads `Task Notes v0.1.0 (3f9c2a7)`: the first 7 characters of the commit, in parentheses, directly after the version | [ ] Pass [ ] Fail |
| 3 | Inspect the footer element in dev tools | A span with `data-testid="app-commit"` holds ` (3f9c2a7)` and follows the span with `data-testid="app-version"` | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes`; no commit, no `undefined`, `null`, `unknown` or error text, and the rest of the page still renders | [ ] Pass [ ] Fail |
| 5 | In dev tools Network tab set throttling to `Slow 3G`, run `docker compose start backend`, and reload `http://localhost:5183/` | While the `/api/version` request is in flight the footer reads `Task Notes` only | [ ] Pass [ ] Fail |
| 6 | Wait for the request to complete | The footer reads `Task Notes v0.1.0 (3f9c2a7)` | [ ] Pass [ ] Fail |
| 7 | Edge, no commit configured: set throttling back to `No throttling`, run `docker compose build backend` with `BUILD_COMMIT` unset in the shell and absent from `.env`, then `docker compose up -d backend` | Build completes and the backend restarts | [ ] Pass [ ] Fail |
| 8 | Run `curl -s http://localhost:8010/api/version` | Body contains `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 9 | Reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0`, the version alone with no parentheses and no `unknown` | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Not a UI behaviour: the observable check is the test run. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | Summary shows `0 failed` | [ ] Pass [ ] Fail |
| 11 | Read the test output | It lists `renders the first 7 characters of the commit next to the version`, `renders only the app name while the version request is pending` and `renders only the app name when the version request fails` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
