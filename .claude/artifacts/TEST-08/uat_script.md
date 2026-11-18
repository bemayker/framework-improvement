# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Frontend dependencies installed (`npm --prefix frontend install`) for step 10.
- Chrome (developer tools are used in steps 4, 5 and 14).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` in the browser | The page shows `{"version":"0.1.0"}` (or whatever `[project].version` in `backend/pyproject.toml` reads); note the value | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | The landing page shows the heading "Task Notes" | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the bottom of the page | The footer reads `Task Notes v0.1.0`, the value noted in step 1 | [ ] Pass [ ] Fail |
| 4 | 2 | Reload `http://localhost:5183/` with developer tools open on the Network tab | A `GET` request to `http://localhost:8010/api/version` appears with status 200 | [ ] Pass [ ] Fail |
| 5 | 2 | Click that request and open its Response | It reads `{"version":"0.1.0"}`, the same value the footer shows | [ ] Pass [ ] Fail |
| 6 | 2 | Open `frontend/src/components/AppFooter.tsx` in an editor | It contains no `package.json` import and no version literal such as `0.1.0` | [ ] Pass [ ] Fail |
| 7 | 3 | Stop the backend only: `docker compose stop backend` | `http://localhost:8010/api/version` no longer loads | [ ] Pass [ ] Fail |
| 8 | 3 | Reload `http://localhost:5183/` | The page still loads and the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing space or gap | [ ] Pass [ ] Fail |
| 9 | 3 | Restart it with `docker compose start backend`, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 10 | 4 | Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` | The run passes: no failed test and the command exits 0 | [ ] Pass [ ] Fail |
| 11 | 4 | In the output, find `renders the version fetched from the backend` and `renders the app name alone when the version request fails` | Both are listed as passed | [ ] Pass [ ] Fail |
| 12 | 5 | Open `frontend/package.json` and `backend/pyproject.toml` | The frontend `version` reads `0.0.0` and the backend `version` reads `0.1.0` | [ ] Pass [ ] Fail |
| 13 | 5 | Open `http://localhost:5183/` | The footer reads `Task Notes v0.1.0`, the backend's value, and nowhere reads `v0.0.0` | [ ] Pass [ ] Fail |
| 14 | 6 | In the Network tab set throttling to a custom profile with 5000 ms latency (or "Slow 3G") and reload `http://localhost:5183/` | While the `/api/version` request is pending, the footer reads exactly `Task Notes`, with no "loading" text and no blank footer | [ ] Pass [ ] Fail |
| 15 | 6 | Wait for the request to complete | The footer changes to `Task Notes v0.1.0` without the page layout jumping | [ ] Pass [ ] Fail |
| 16 | 6 | Set throttling back to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 16 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
