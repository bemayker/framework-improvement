# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/TEST-10-footer-build-commit` (or `main` once merged), repository root as the working directory.
- `backend/pyproject.toml` has `version = "0.1.0"`.
- Frontend dependencies installed (`npm --prefix frontend ci`).
- Frontend at http://localhost:5183, backend at http://localhost:8010.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` | The backend, frontend and database containers are running (criterion 1) | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/version` | `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 3 | Open http://localhost:5183/ in Chrome and scroll to the bottom | The footer reads `Task Notes v0.1.0 (0123456)`: seven characters of the commit, in parentheses, after the version | [ ] Pass [ ] Fail |
| 4 | Set DevTools Network throttling to "Slow 3G" and reload http://localhost:5183/ | While `/api/version` is pending the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text; once resolved it reads `Task Notes v0.1.0 (0123456)` (criterion 2). Set throttling back to "No throttling" | [ ] Pass [ ] Fail |
| 5 | Run `docker compose stop backend`, then reload http://localhost:5183/ | The footer is visible and reads exactly `Task Notes`, with no error text | [ ] Pass [ ] Fail |
| 6 | Run `docker compose up -d --force-recreate backend` (no `BUILD_COMMIT`), wait until `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0","commit":"unknown"}`, then reload the page | The footer reads `Task Notes v0.1.0`: the version alone, no parentheses and no `unknown` (edge case) | [ ] Pass [ ] Fail |
| 7 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | 0 failed; the AppFooter test names include a success case with the commit, a pending case and a failure case (criterion 3) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
