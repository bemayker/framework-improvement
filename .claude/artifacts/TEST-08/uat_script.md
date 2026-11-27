# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, on `main`).
- From the repository root, `docker compose up -d --build` has finished; frontend at `http://localhost:5183`, backend at `http://localhost:8010`.
- Frontend dependencies installed (`npm --prefix frontend install`) for the test-run steps.
- The expected version is the backend's `[project].version` in `backend/pyproject.toml` (currently `0.1.0`), not a value in this document.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser tab | The page shows `{"version":"0.1.0"}` (or the current `[project].version`); note the value | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page with the "Task Notes" heading loads | [ ] Pass [ ] Fail |
| 3 | Scroll to the bottom and read the footer | It reads `Task Notes v0.1.0`, the value noted in step 1 | [ ] Pass [ ] Fail |
| 4 | Open `frontend/package.json` and read `"version"` | It is `0.0.0`, which differs from the backend's version | [ ] Pass [ ] Fail |
| 5 | Re-read the footer | It shows the backend version and the text `0.0.0` appears nowhere in it | [ ] Pass [ ] Fail |
| 6 | Open dev tools, Network tab, reload the page | One `GET http://localhost:8010/api/version` request with status 200 is listed | [ ] Pass [ ] Fail |
| 7 | Run `grep -n "package.json" frontend/src/components/AppFooter.tsx` from the repository root | No output: the component no longer imports the frontend package metadata | [ ] Pass [ ] Fail |
| 8 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The page still loads, heading and note form visible | [ ] Pass [ ] Fail |
| 9 | Read the footer | It reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend`, wait a few seconds, reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 11 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repository root | The run passes with no failed test and exits 0 | [ ] Pass [ ] Fail |
| 12 | Open `frontend/src/components/AppFooter.test.tsx` | It contains `renders the version the backend reports` and `renders the app name without a version when the backend is unreachable` | [ ] Pass [ ] Fail |
| 13 | In Chrome or Edge dev tools on `http://localhost:5183/`, set Network throttling to "Slow 3G" and reload | While `GET /api/version` is pending, the footer reads `Task Notes` with no placeholder such as "loading" or "..." | [ ] Pass [ ] Fail |
| 14 | Wait until the request completes | The footer changes to `Task Notes v0.1.0` without the rest of the page moving | [ ] Pass [ ] Fail |
| 15 | Set throttling back to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
