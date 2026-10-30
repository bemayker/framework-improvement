# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, on `main`).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Frontend dependencies installed for the last steps: `npm --prefix frontend ci`.
- The expected version is the `[project].version` in `backend/pyproject.toml` (`0.1.0` at the time of writing).

## Test Environment Setup

1. From the repository root, build the backend with a known commit and start the stack:
   ```bash
   docker compose build --build-arg BUILD_COMMIT=abc1234def5678 backend
   docker compose up -d
   ```
2. Wait until `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0","commit":"abc1234def56"}` (version as in `backend/pyproject.toml`).

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 2 | Read the footer text | It reads `Task Notes v0.1.0 (abc1234)`: the version, then exactly the first 7 characters of the commit the curl printed | [ ] Pass [ ] Fail |
| 3 | Run `docker compose build backend`, then `docker compose up -d backend`, and wait until `curl -s http://localhost:8010/api/version` prints `"commit":"unknown"` | The backend now answers with the `unknown` commit | [ ] Pass [ ] Fail |
| 4 | Reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0 (unknown)` | [ ] Pass [ ] Fail |
| 5 | Rebuild with the known commit again: `docker compose build --build-arg BUILD_COMMIT=abc1234def5678 backend`, then `docker compose up -d backend`, and wait until the curl prints `"commit":"abc1234def56"` | The backend answers with the known commit | [ ] Pass [ ] Fail |
| 6 | In DevTools, Network tab, set throttling to "Slow 3G" and reload `http://localhost:5183/` | While the `/api/version` request is pending the footer reads exactly `Task Notes`: no commit, no parentheses, no "undefined" | [ ] Pass [ ] Fail |
| 7 | Wait for the request to complete, then set throttling back to "No throttling" | The footer reads `Task Notes v0.1.0 (abc1234)` | [ ] Pass [ ] Fail |
| 8 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The `/api/version` request fails in the Network tab and the footer reads exactly `Task Notes`: no "undefined", "null" or "Error", no empty parentheses | [ ] Pass [ ] Fail |
| 9 | Run `docker compose start backend`, wait until the curl answers, then reload | The footer reads `Task Notes v0.1.0 (abc1234)` again | [ ] Pass [ ] Fail |
| 10 | A commit-less 200 answer cannot be produced from the running backend through the UI. With the stack up, run `npx playwright test e2e/tests/TEST-10_footer_build_commit.spec.ts` from the repository root | `0 failed`, including the spec "shows the version alone when the response carries no commit" | [ ] Pass [ ] Fail |
| 11 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | Vitest reports `0 failed`, and the AppFooter output lists a success test, a pending test, a failure test and a version-without-commit test | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
