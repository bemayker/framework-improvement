# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, on `main`).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Node dependencies installed for step 11: `npm --prefix frontend ci`.

## Test Environment Setup

1. From the repository root, start the stack with a known commit:
   ```bash
   BUILD_COMMIT=0123456789abcdef0123 docker compose up -d --build
   ```
2. Wait until the `db`, `backend` (port 8010) and `frontend` (port 5183) services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Run `curl -s http://localhost:8010/api/version` | The JSON shows `"commit":"0123456789ab"` and a `version`, for example `"version":"0.1.0"`; note the version | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` in a browser | The landing page with the "Task Notes" heading loads | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the footer | It reads `Task Notes v0.1.0 (0123456)`: the version from step 1, then exactly the first 7 characters `0123456` in parentheses | [ ] Pass [ ] Fail |
| 4 | 2 | Restart the stack without a commit: unset `BUILD_COMMIT` in your shell and run `docker compose up -d --build` | The services report as started | [ ] Pass [ ] Fail |
| 5 | 2 | Run `curl -s http://localhost:8010/api/version` | The JSON shows `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 6 | 2 | Open `http://localhost:5183/` and read the footer | It reads `Task Notes v0.1.0`, with no parentheses and no `unknown`, `undefined` or `null` | [ ] Pass [ ] Fail |
| 7 | 2 | In DevTools Network, block the request URL `*/api/version` and reload | The footer reads `Task Notes` only, with no error text and no `undefined` | [ ] Pass [ ] Fail |
| 8 | 2 | Remove the block, set throttling to `Slow 3G` and reload; watch the footer while `/api/version` is loading | The footer reads `Task Notes` only | [ ] Pass [ ] Fail |
| 9 | 2 | Wait for the request to complete | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 10 | 2 | Set throttling back to `No throttling` | The footer shows `Task Notes v0.1.0` after a reload | [ ] Pass [ ] Fail |
| 11 | 3 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | `0 failed` | [ ] Pass [ ] Fail |
| 12 | 3 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a success test asserting `Task Notes v9.9.9 (abc1234)`, a pending test (never-settling promise) asserting `Task Notes` with no commit span, and a failure test (rejected promise) asserting `Task Notes` with no version or commit span | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
