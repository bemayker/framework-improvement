# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- `backend/pyproject.toml` declares `version = "0.1.0"`. If a later bump changes it, adjust the expected text accordingly.
- Frontend dependencies installed (`npm --prefix frontend install`) for the test-run step.
- No other process bound to ports `5183` (frontend) or `8010` (backend).

## Test Environment Setup

The compose file passes `BUILD_COMMIT` to the backend (default empty). A stack started without it reports commit `unknown`, so the footer then shows the version alone. To get the commit-present check, set `BUILD_COMMIT` in the shell command that starts the stack.

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build
   ```
2. Wait until the `db`, `backend` and `frontend` services are running.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser tab | The page shows `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page renders with the footer at the bottom | [ ] Pass [ ] Fail |
| 3 | Read the footer text | It reads exactly `Task Notes v0.1.0 (0123456)`: the version, a space, then the first 7 characters of the commit in parentheses | [ ] Pass [ ] Fail |
| 4 | In DevTools, Network, filter on `version` and reload | Exactly one `GET http://localhost:8010/api/version` request (status 200) appears, and the footer still reads `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 5 | In DevTools, Elements, inspect the footer | It contains a `data-testid="app-footer-version"` span with ` v0.1.0` followed by a `data-testid="app-footer-commit"` span with ` (0123456)` | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | In DevTools, Network, set throttling to "Slow 3G" and reload `http://localhost:5183/` | Until `/api/version` completes the footer reads exactly `Task Notes` (no `undefined`, no `null`, no placeholder word); when it completes it changes to `Task Notes v0.1.0 (0123456)`. Reset throttling to "No throttling" afterwards | [ ] Pass [ ] Fail |
| 7 | Run `docker compose stop backend` from the repository root, then hard-reload `http://localhost:5183/` (Cmd+Shift+R) | The footer reads exactly `Task Notes`: no commit, no `undefined`, no `null`, no error text | [ ] Pass [ ] Fail |
| 8 | Run `docker compose up -d --build backend` from the repository root with no `BUILD_COMMIT` set, wait until `http://localhost:8010/api/version` shows `{"version":"0.1.0","commit":"unknown"}`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`, the version alone, with no parentheses and no `unknown` | [ ] Pass [ ] Fail |
| 9 | In DevTools, Elements, inspect the footer | There is no `app-footer-commit` span | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repository root | The run lists `AppFooter.test.tsx` and `version.test.ts` and reports 0 failed | [ ] Pass [ ] Fail |
| 11 | Open `frontend/src/components/AppFooter.test.tsx` | A success test has the mocked client resolve a version and commit and expects `Task Notes v0.1.0 (abc1234)`; a pending test with a never-settling promise expects exactly `Task Notes`; a failure test where the client rejects expects exactly `Task Notes` with no commit span | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
