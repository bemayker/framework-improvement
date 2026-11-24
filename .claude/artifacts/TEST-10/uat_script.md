# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running; Chrome with DevTools; `npm` installed for the test step.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, on `main`), at the repository root.
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is).
- No other process bound to port `5183` (frontend) or `8010` (backend).
- The expected `version` is the `[project].version` field of `backend/pyproject.toml` (`0.1.0` at the time of writing).

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit from GET /api/version, next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up --build -d` from the repository root | All containers report running; `http://localhost:8010` and `http://localhost:5183` answer | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:8010/api/version` in the browser | The JSON shows `"commit": "0123456789ab"` and the version from `backend/pyproject.toml` (for example `"version": "0.1.0"`) | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading | [ ] Pass [ ] Fail |
| 4 | Scroll to the footer at the bottom of the page | It reads `Task Notes v0.1.0 (0123456)`: exactly 7 commit characters, directly after the version | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error

The stack from criterion 1 must be running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Open `http://localhost:5183/`, open DevTools, go to Network, right-click the request to `localhost:8010/api/version` and choose "Block request URL", then reload | The footer reads `Task Notes` only, with no `undefined`, no `unknown` and no error text | [ ] Pass [ ] Fail |
| 6 | In DevTools, Network, remove the block and set throttling to "Slow 3G", then reload | While the `api/version` request is still pending the footer reads `Task Notes` only; once it completes it reads `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 7 | Run `docker compose down`, then `BUILD_COMMIT= docker compose up --build -d`, and open `http://localhost:5183/` | The footer reads `Task Notes v0.1.0`, with no parentheses, no `unknown` and no `undefined` | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `npm --prefix frontend install`, then `npm --prefix frontend test -- src/components/AppFooter.test.tsx` from the repository root | The summary line reports no failed or errored test; exit code 0 | [ ] Pass [ ] Fail |
| 9 | Open `frontend/src/components/AppFooter.test.tsx` | It contains the tests `renders the first 7 characters of the build commit next to the version`, `renders only the app name while the version request is pending` and `renders only the app name when the version request fails` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
