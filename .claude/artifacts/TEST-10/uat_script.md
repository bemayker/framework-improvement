# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- No other stack on ports 8010 and 5183.
- Chromium-based browser (needed for request blocking and throttling).
- Frontend dependencies installed (`npm --prefix frontend install`) for the test steps.

## Test Environment Setup

1. From the repository root, run `git rev-parse HEAD` and note the first 7 characters (example: `5796772`).
2. Run `BUILD_COMMIT=$(git rev-parse HEAD) docker compose up -d --build`.
3. Wait until `db`, `backend` (http://localhost:8010) and `frontend` (http://localhost:5183) are up (`docker compose ps`).

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/version` (criterion 1) | Prints `{"version":"0.1.0","commit":"..."}` where `commit` is the first 12 characters of the sha from setup | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` and scroll to the footer | Footer reads exactly `Task Notes v0.1.0 (5796772)`, with your 7 characters inside the parentheses and none of the remaining 5 characters from step 1 | [ ] Pass [ ] Fail |
| 3 | In DevTools Elements, inspect the footer | A span `app-version` with text ` v0.1.0`, followed by a span `app-commit` with text ` (5796772)` | [ ] Pass [ ] Fail |
| 4 | In DevTools Network, block the request URL pattern `localhost:8010/api/version` and reload (criterion 2, failure) | Footer reads exactly `Task Notes`: no version, no parentheses, no `undefined`, `null` or error text; Network shows `/api/version` blocked | [ ] Pass [ ] Fail |
| 5 | Remove the block, set throttling to "Slow 3G" and reload (criterion 2, pending) | While `/api/version` is pending the footer reads exactly `Task Notes`; once complete it reads `Task Notes v0.1.0 (5796772)` | [ ] Pass [ ] Fail |
| 6 | Set throttling back to "No throttling", then run `docker compose up -d --build backend` without `BUILD_COMMIT` set, and run `curl -s http://localhost:8010/api/version` (edge case) | Response shows `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 7 | Reload `http://localhost:5183/` | Footer reads exactly `Task Notes v0.1.0`, with no `unknown`, no empty `()` and no `app-commit` span | [ ] Pass [ ] Fail |
| 8 | Run `npm --prefix frontend test` from the repository root (criterion 3) | Ends with `0 failed`; `AppFooter.test.tsx` and `version.test.ts` are among the files run | [ ] Pass [ ] Fail |
| 9 | Open `frontend/src/components/AppFooter.test.tsx` | Tests assert exact footer texts `Task Notes v9.9.9 (abc1234)` (success), `Task Notes v9.9.9` (no commit), `Task Notes` for a never-settling promise (pending) and `Task Notes` for a rejected promise (failure) | [ ] Pass [ ] Fail |
| 10 | Run `docker compose down` | The stack stops | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
