# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- The stack is up with `docker compose up -d` from the repository root; backend answers at `http://localhost:8010`, frontend at `http://localhost:5183`.
- `frontend/package.json` has `"version": "0.0.0"` and `backend/pyproject.toml` has `version = "0.1.0"`; if either has changed, substitute the current values below.
- Frontend dependencies installed for Criterion 4 (`npm --prefix frontend install`).

## Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open `http://localhost:8010/api/version` in the browser | The page shows `{"version":"0.1.0"}` (the `[project].version` of `backend/pyproject.toml`) | [ ] Pass [ ] Fail |
| 1.2 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading | [ ] Pass [ ] Fail |
| 1.3 | Scroll to the bottom of the page | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

## Criterion 2: The version comes from the backend at runtime, not a typed string or the frontend package

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Open `frontend/package.json` and `backend/pyproject.toml` and note both versions | `0.0.0` in the frontend, `0.1.0` in the backend | [ ] Pass [ ] Fail |
| 2.2 | Open `http://localhost:5183/` | The footer reads `Task Notes v0.1.0`, not `v0.0.0` | [ ] Pass [ ] Fail |
| 2.3 | Open DevTools, Network tab, and reload the page | A `GET http://localhost:8010/api/version` request with status 200 is listed | [ ] Pass [ ] Fail |
| 2.4 | Open `frontend/src/components/AppFooter.tsx` | No literal version string such as `0.1.0` and no `package.json` import appear in the file | [ ] Pass [ ] Fail |

## Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | Stop the backend only: `docker compose stop backend` (use the backend service name from `docker-compose.yml`) | The backend container stops; the frontend keeps running | [ ] Pass [ ] Fail |
| 3.2 | Open `http://localhost:5183/` and wait up to 5 seconds | The footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap | [ ] Pass [ ] Fail |
| 3.3 | Run `docker compose start backend` and reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

## Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | `0 failed`; the output lists a test for the version-present path and one for the version-absent path in AppFooter.test.tsx | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
