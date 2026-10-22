# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version`.
- `frontend/package.json` declares `"version": "0.0.0"` and `backend/pyproject.toml` declares `version = "0.1.0"` (the footer's expected version comes from the backend value).
- Frontend dependencies installed (`npm --prefix frontend install`) for steps 11 and 12.

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Wait until the `db`, `backend` (port 8010) and `frontend` (port 5183) services are up.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser (criterion 1) | The Task Notes landing page loads with the heading "Task Notes" | [ ] Pass [ ] Fail |
| 2 | Scroll to the bottom of the page | The footer reads "Task Notes v0.1.0" | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/api/version` (criterion 2) | The page shows `{"version":"0.1.0"}` (possibly with a `commit` field) | [ ] Pass [ ] Fail |
| 4 | Reload `http://localhost:5183/` and read the footer | It reads "Task Notes v0.1.0", the backend's value, and not "Task Notes v0.0.0" | [ ] Pass [ ] Fail |
| 5 | In the developer tools Network tab, reload the page | One GET to `http://localhost:8010/api/version` with status 200 appears, and the footer version matches its response | [ ] Pass [ ] Fail |
| 6 | Run `docker compose stop backend` (criterion 3) | The backend container stops; the frontend keeps running | [ ] Pass [ ] Fail |
| 7 | Hard-reload `http://localhost:5183/` | The page loads and the footer reads exactly "Task Notes", with no "v", "undefined", "null", "unknown" or trailing gap | [ ] Pass [ ] Fail |
| 8 | Check the Network tab | The GET to `http://localhost:8010/api/version` is shown as failed | [ ] Pass [ ] Fail |
| 9 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload the page | The footer reads "Task Notes v0.1.0" again | [ ] Pass [ ] Fail |
| 10 | In the Network tab, throttle or block the `/api/version` request and reload | While the request is pending, the footer reads "Task Notes" with no placeholder text | [ ] Pass [ ] Fail |
| 11 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` (criterion 4) | Both files run and the summary reports 0 failed | [ ] Pass [ ] Fail |
| 12 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a resolved-version test ("Task Notes v" plus the mocked version) and absent-version tests (pending, rejected, null) that each assert the footer reads only "Task Notes" | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
