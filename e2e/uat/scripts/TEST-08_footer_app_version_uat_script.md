# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Chromium-based browser (needed for the request-blocking step).
- Frontend dependencies installed (`npm --prefix frontend install`) for the test steps.

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Wait until `db`, `backend` (http://localhost:8010) and `frontend` (http://localhost:5183) are up.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/version` and note the `version` value | Prints `{"version":"0.1.0"}` (a `commit` field may also appear) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` and scroll to the bottom | Landing page shows the "Task Notes" heading and note form; the footer is visible | [ ] Pass [ ] Fail |
| 3 | Read the footer (criterion 1) | It reads exactly `Task Notes v0.1.0`, the value from step 1 | [ ] Pass [ ] Fail |
| 4 | Read `version` in `frontend/package.json` and `[project].version` in `backend/pyproject.toml` (criterion 2) | Frontend is `0.0.0`, backend is `0.1.0` | [ ] Pass [ ] Fail |
| 5 | Compare the footer to those values | The footer shows the backend's `0.1.0`; `0.0.0` appears nowhere in it | [ ] Pass [ ] Fail |
| 6 | Open DevTools Network, reload, filter on `version` | A `GET http://localhost:8010/api/version` request with status 200 and body `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 7 | Open `frontend/src/components/AppFooter.tsx` | It has no `package.json` import and no literal version string | [ ] Pass [ ] Fail |
| 8 | Run `docker compose stop backend`, then reload the page (criterion 3) | Page still renders; footer reads exactly `Task Notes`, with no `v`, `undefined`, `null`, `unknown` or trailing gap | [ ] Pass [ ] Fail |
| 9 | Inspect the `footer` element in DevTools Elements | It holds the text `Task Notes` and no `app-version` span | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend`, wait a few seconds, reload | Footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 11 | Run `npm --prefix frontend test` (criterion 4) | Ends with `0 failed`; `AppFooter.test.tsx` and `version.test.ts` are among the files run | [ ] Pass [ ] Fail |
| 12 | Open `frontend/src/components/AppFooter.test.tsx` | One test asserts `Task Notes v9.9.9` (present); at least one asserts exactly `Task Notes` with no `app-version` (absent) | [ ] Pass [ ] Fail |
| 13 | In DevTools Network, block the request URL pattern `localhost:8010/api/version` and reload (criterion 5, failure) | Footer reads exactly `Task Notes`; Network shows `/api/version` blocked | [ ] Pass [ ] Fail |
| 14 | Remove the block, set throttling to "Slow 3G" and reload (criterion 5, loading) | While `/api/version` is pending the footer reads exactly `Task Notes`; once complete it reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 15 | Set throttling back to "No throttling" | Nothing else on the page changed in either state | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
