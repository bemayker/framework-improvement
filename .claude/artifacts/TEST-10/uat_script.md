# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- `.env` present in the repository root (copy `.env.example`; defaults are usable).
- Nothing else bound to ports `5183` (frontend) or `8010` (backend).
- `backend/pyproject.toml` reads `version = "0.1.0"`.
- Frontend dependencies installed (`npm --prefix frontend install`) for criterion 3.

## Test Environment Setup

1. From the repository root run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build`.
2. Wait until services `db`, `backend` and `frontend` are up.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal run `curl -s http://localhost:8010/api/version` | It prints `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` in a browser and scroll to the bottom of the page | The footer reads exactly `Task Notes v0.1.0 (0123456)`: seven characters of the commit, in parentheses, directly after the version | [ ] Pass [ ] Fail |

### Criterion 2: When no commit is available, the footer shows the version alone, never `undefined` or an error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | With `BUILD_COMMIT` not set in your shell, run `docker compose up -d --force-recreate backend`, then `curl -s http://localhost:8010/api/version` | It prints `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 4 | Reload `http://localhost:5183/` and scroll to the footer | The footer reads exactly `Task Notes v0.1.0`, with no parentheses and none of the words `unknown`, `undefined`, `null` or `error` | [ ] Pass [ ] Fail |
| 5 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes` (the request failed, so neither version nor commit is known), with no error text | [ ] Pass [ ] Fail |
| 6 | Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` prints a response, then reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

The pending state lasts only until the request answers and is not reliably observable by hand; it is checked in criterion 3.

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | From the repository root run `npm --prefix frontend test` | Vitest runs `AppFooter.test.tsx` and `version.test.ts` among the suite, and the summary reports `0 failed` | [ ] Pass [ ] Fail |
| 8 | Open `frontend/src/components/AppFooter.test.tsx` | It holds a success test expecting `Task Notes v0.1.0 (0123456)`, a pending test (never-resolving client) expecting exactly `Task Notes`, failure tests (rejected client, `null` result) expecting exactly `Task Notes`, and a test where the commit is `null` expecting exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
