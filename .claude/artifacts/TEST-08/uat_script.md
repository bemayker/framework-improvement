# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, on `main`).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Frontend dependencies installed for the last step: `npm --prefix frontend ci`.
- The expected version is the `[project].version` in `backend/pyproject.toml` (`0.1.0` at the time of writing). `frontend/package.json` declares `0.0.0`, which must never appear in the footer.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Wait until `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0"}` (or the current `backend/pyproject.toml` version).

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 2 | Read the footer text | It reads `Task Notes v0.1.0`, the same value the curl printed | [ ] Pass [ ] Fail |
| 3 | Open DevTools on the Network tab and reload the page | A GET to `http://localhost:8010/api/version` appears with status 200 and response `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 4 | Read the footer again | It reads `Task Notes v0.1.0`, not `Task Notes v0.0.0` | [ ] Pass [ ] Fail |
| 5 | In `backend/pyproject.toml` change `version = "0.1.0"` to `version = "0.1.1"`, run `docker compose up -d --build backend`, and wait until `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.1"}` | The frontend container is untouched | [ ] Pass [ ] Fail |
| 6 | Reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.1` without the frontend being rebuilt | [ ] Pass [ ] Fail |
| 7 | Revert `backend/pyproject.toml` to `0.1.0` and run `docker compose up -d --build backend` again | `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 8 | In DevTools, Network tab, set throttling to "Slow 3G" and reload the page | While the `/api/version` request is pending the footer reads exactly `Task Notes`, with no "v", no "undefined", no "loading" text | [ ] Pass [ ] Fail |
| 9 | Wait for the request to complete, then set throttling back to "No throttling" | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 10 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The `/api/version` request fails in the Network tab and the footer reads exactly `Task Notes`: not blank, no "v", no "undefined", "null" or "unknown", no trailing gap | [ ] Pass [ ] Fail |
| 11 | Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers, then reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 12 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | Vitest reports `0 failed`, and the AppFooter output lists a version-present test, a loading test and a failure test | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
