# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is).
- Frontend on http://localhost:5183 and backend on http://localhost:8010 are free.
- Chrome with DevTools available.
- Frontend dependencies installed (`npm --prefix frontend install`) for Criterion 3.

## Test Environment Setup

1. From the repository root, run `BUILD_COMMIT=abc1234def567890abc1234def567890abc12345 docker compose up -d --build`.
2. Wait until `curl -s http://localhost:8010/api/version` answers.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/version` | Output is `{"version":"0.1.0","commit":"abc1234def56"}` (version is the current `[project].version` of `backend/pyproject.toml`) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` and scroll to the footer | It reads `Task Notes v0.1.0 (abc1234)`: exactly the first 7 characters of the commit, after the version | [ ] Pass [ ] Fail |
| 3 | In DevTools Elements, inspect the footer | The span `data-testid="app-footer-version"` holds ` v0.1.0` and a separate span `data-testid="app-footer-commit"` holds ` (abc1234)` | [ ] Pass [ ] Fail |

### Criterion 2: Pending or failed request shows no commit, never `undefined` or an error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | In DevTools Network, set throttling to `Slow 3G` and reload `http://localhost:5183/` | While `/api/version` is pending, the footer reads exactly `Task Notes`: no commit, no `undefined`, no loading or error text | [ ] Pass [ ] Fail |
| 5 | Wait for the request to finish, then set throttling back to `No throttling` | The footer changes to `Task Notes v0.1.0 (abc1234)` | [ ] Pass [ ] Fail |
| 6 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes`: no `v`, no parentheses, no `undefined`, no `null`, no error text | [ ] Pass [ ] Fail |
| 7 | Run `docker compose start backend`, then rebuild without a commit: `docker compose up -d --build backend` with `BUILD_COMMIT` unset in the shell and `.env`; run `curl -s http://localhost:8010/api/version` | The output shows `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 8 | Reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0`, the version alone: no parentheses, no `unknown`, no `undefined` | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run passes with no failed or errored test and exits 0 | [ ] Pass [ ] Fail |
| 10 | Open `frontend/src/components/AppFooter.test.tsx` | It contains `renders the first 7 characters of the commit next to the version` (success), `shows no commit while the version request is pending` (pending) and `shows no commit when the version request fails` (failure) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
