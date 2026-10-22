# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit`.
- Frontend dependencies installed (`npm --prefix frontend install`) for steps 6 and 7.

## Test Environment Setup

1. From the repository root, run `BUILD_COMMIT=0123456789abcdef docker compose up -d --build`.
2. Wait until the `db`, `backend` (port 8010) and `frontend` (port 5183) services are up.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser (criterion 1) | The page shows `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` and scroll to the footer | The footer reads "Task Notes v0.1.0 (0123456)": the commit's first 7 characters, in parentheses, after the version | [ ] Pass [ ] Fail |
| 3 | Run `docker compose stop backend` (criterion 2), then hard-reload `http://localhost:5183/` | The footer reads exactly "Task Notes", with no version, no commit, no "undefined", no "null" and no error text | [ ] Pass [ ] Fail |
| 4 | Run `docker compose up -d backend` in a shell where `BUILD_COMMIT` is not set, wait until `http://localhost:8010/api/version` shows `{"version":"0.1.0","commit":"unknown"}`, then reload `http://localhost:5183/` | The footer reads "Task Notes v0.1.0", the version alone, with no "(unknown)" and no "undefined" | [ ] Pass [ ] Fail |
| 5 | Optional: in the developer tools Network tab set throttling to "Slow 3G" and reload | Until the `/api/version` request completes the footer reads "Task Notes" only, then the version appears | [ ] Pass [ ] Fail |
| 6 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` (criterion 3) | Both files run and the summary reports 0 failed | [ ] Pass [ ] Fail |
| 7 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a success test (footer "Task Notes v1.2.3 (0123456)" from a 12-character commit), a pending test, a rejected-request test and an unusable-commit test, each asserting no "undefined", "null" or "unknown" | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 7 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
