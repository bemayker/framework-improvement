# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, on `main`).
- `backend/pyproject.toml` has `version = "0.1.0"` and `frontend/package.json` has `"version": "0.0.0"`.
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- A browser with DevTools.

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Wait until `http://localhost:8010/api/version` answers.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Open `http://localhost:5183/` in a browser | The "Task Notes" heading, the note form and the footer are visible | [ ] Pass [ ] Fail |
| 2 | 1 | Scroll to the footer | It reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | 2 | Open `http://localhost:8010/api/version` in a new tab | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 4 | 2 | Open `http://localhost:5183/` with DevTools, Network tab open, and reload | A `GET` to `http://localhost:8010/api/version` with status 200 appears; the footer reads `Task Notes v0.1.0`, not `Task Notes v0.0.0` | [ ] Pass [ ] Fail |
| 5 | 2 | Edit `backend/pyproject.toml` to `version = "0.1.1"`, run `docker compose up -d --build backend` (do not rebuild the frontend), wait for the backend, reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.1` | [ ] Pass [ ] Fail |
| 6 | 2 | Revert `backend/pyproject.toml` to `version = "0.1.0"`, run `docker compose up -d --build backend`, reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 7 | 3 | Run `docker compose stop backend` | The backend stops | [ ] Pass [ ] Fail |
| 8 | 3 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap; the rest of the page renders | [ ] Pass [ ] Fail |
| 9 | 3 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 10 | 3 | In DevTools Network, set throttling to "Slow 3G" and reload | Until the `/api/version` request completes the footer reads exactly `Task Notes`, then ` v0.1.0` appears after it | [ ] Pass [ ] Fail |
| 11 | 3 | Reset throttling to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |
| 12 | 4 | From the repo root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The output lists `renders the version returned by the backend` and `renders the app name alone when the version request fails` and reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
