# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- The expected version is the backend's `[project].version` in `backend/pyproject.toml`. At the time of writing it is `0.1.0`; `frontend/package.json` reads `0.0.0`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Wait until the `db`, `backend` and `frontend` services are all up.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The landing page shows the heading "Task Notes" | [ ] Pass [ ] Fail |
| 2 | Scroll to the bottom of the page and read the footer (criterion 1) | The footer reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/api/version` in the browser (criterion 2) | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 4 | Open `frontend/package.json` in the repository | Its `"version"` reads `0.0.0` | [ ] Pass [ ] Fail |
| 5 | Reload `http://localhost:5183/` and read the footer | The footer reads `Task Notes v0.1.0`, the backend's value, not `v0.0.0` | [ ] Pass [ ] Fail |
| 6 | Open dev tools, Network tab, and reload the page | One request to `http://localhost:8010/api/version` with status 200 | [ ] Pass [ ] Fail |
| 7 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal such as `0.1.0` and no import of `package.json` | [ ] Pass [ ] Fail |
| 8 | Run `docker compose stop backend` (criterion 3) | The backend container is stopped | [ ] Pass [ ] Fail |
| 9 | Reload `http://localhost:5183/` and read the footer | The footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend` and reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 11 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` (criterion 4) | The run lists the version-present test and the version-absent tests (pending, rejected, `unknown`) and reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
