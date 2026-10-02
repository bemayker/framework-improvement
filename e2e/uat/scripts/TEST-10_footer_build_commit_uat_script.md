# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- A browser with DevTools (Network tab with request blocking and throttling).

## Test Environment Setup

1. From the repository root run `BUILD_COMMIT=abcdef1234567890 docker compose up -d --build`.
2. Wait until the `db`, `backend` and `frontend` services are started (the frontend log shows Vite listening on port 5183).

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open `http://localhost:8010/api/version` | JSON reads `{"version": "0.1.0", "commit": "abcdef1234567890"}` | [ ] Pass [ ] Fail |
| 1.2 | Open `http://localhost:5183` | The Task Notes landing page loads | [ ] Pass [ ] Fail |
| 1.3 | Scroll to the footer | It reads `Task Notes v0.1.0 (abcdef1)`: exactly 7 commit characters, after the version | [ ] Pass [ ] Fail |
| 1.4 | In DevTools Elements, inspect the footer | `<span data-testid="app-version">0.1.0</span>` followed by `<span data-testid="app-commit">abcdef1</span>` | [ ] Pass [ ] Fail |
| 1.5 | In DevTools Network, reload | Exactly one `GET /api/version` request was made | [ ] Pass [ ] Fail |

### Criterion 2: Pending or failed request shows no commit, no `undefined`, no error

Prerequisite: the stack from Criterion 1 is running; the landing page is open at `http://localhost:5183`.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | In DevTools Network, set throttling to a custom profile with 10000 ms latency and reload | While the request is pending the footer reads `Task Notes`, with no `v`, no parentheses, no `undefined` | [ ] Pass [ ] Fail |
| 2.2 | Wait for the request to complete | The footer changes to `Task Notes v0.1.0 (abcdef1)` | [ ] Pass [ ] Fail |
| 2.3 | Remove throttling; in DevTools Network, block the request URL `http://localhost:8010/api/version` and reload | The footer reads `Task Notes` and stays so; no `undefined`, `null`, `unknown` or error text appears in the footer | [ ] Pass [ ] Fail |
| 2.4 | Unblock the URL. Restart the stack without the commit: `docker compose up -d --build` (no `BUILD_COMMIT`), then open `http://localhost:8010/api/version` | The JSON reads `"commit": "unknown"` | [ ] Pass [ ] Fail |
| 2.5 | Open `http://localhost:5183` | The footer reads `Task Notes v0.1.0` (the version alone): no parentheses and no `unknown` | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

This criterion is verified in the test suite rather than in the UI.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | From the repository root run `npm --prefix frontend test` | Vitest reports all tests passed | [ ] Pass [ ] Fail |
| 3.2 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a success test asserting `Task Notes v9.9.9-test (abcdef1)`, a pending test (never-settling promise) and a failure test (rejected promise), each asserting the footer text | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
