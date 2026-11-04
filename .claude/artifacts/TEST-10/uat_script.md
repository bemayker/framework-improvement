# UAT Script: TEST-10 Footer shows the build commit

The footer on the landing page shows the first 7 characters of the commit reported by `GET /api/version`, next to the version. The backend only reports a real commit when `BUILD_COMMIT` is set on it, so the environment setup below sets it. Without it the backend answers `"unknown"` and the footer correctly shows the version alone.

## Prerequisites

- Docker running; repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or, once merged, on `main`).
- `.env` copied from `.env.example`, with the line `BUILD_COMMIT=0515c74d9e2f1a3b` set in it. `docker-compose.yml` passes it to the backend.
- Host ports `5183` and `8010` free.
- A browser with dev tools, and a terminal.

## Test Environment Setup

1. From the repository root run `docker compose up --build`.
2. Confirm the `db`, `backend` and `frontend` services are running. Leave them running.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` | The page shows `{"version":"0.1.0","commit":"0515c74d9e2f"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` and read the footer at the bottom of the landing page | It reads `Task Notes v0.1.0 (0515c74)`: the version, then the first 7 characters of the commit from step 1 | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error

Prerequisites: the stack from Test Environment Setup running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | On `http://localhost:5183/`, open dev tools, Network tab, set throttling to `Slow 3G`, reload, and watch the footer before the `/api/version` request completes | It reads exactly `Task Notes`; after the request completes it reads `Task Notes v0.1.0 (0515c74)` | [ ] Pass [ ] Fail |
| 4 | Reset throttling. Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes`, with no `v`, no parentheses, no `undefined`, no `null`, no `unknown` and no error text | [ ] Pass [ ] Fail |

### Edge case: the commit is unavailable, so the version shows alone

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Run `docker compose start backend`; in `.env` empty the line to `BUILD_COMMIT=`; run `docker compose up -d backend`; open `http://localhost:8010/api/version` | It shows `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 6 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`: the version alone, no parentheses and no `unknown` | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts src/components/LandingPage.test.tsx` | The run reports `0 failed` | [ ] Pass [ ] Fail |
| 8 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a test where the client resolves a version and commit and the footer shows the 7-character commit, a test where the client never settles and the footer reads `Task Notes`, and a test where the client rejects and the footer reads `Task Notes` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
