# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- The stack is up (`docker compose up -d --build` from the repository root): backend on `http://localhost:8010`, frontend on `http://localhost:5183`.
- The expected version is whatever `GET http://localhost:8010/api/version` returns (the `version` in `backend/pyproject.toml`, `0.1.0` at the time of writing). `frontend/package.json` says `0.0.0` and must not appear in the footer.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/version` | It prints `{"version":"0.1.0"}` (note the value) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` in a browser | The landing page with the "Task Notes" heading is shown | [ ] Pass [ ] Fail |
| 3 | Scroll to the footer | It reads `Task Notes v0.1.0`, the value from step 1 (criterion 1) | [ ] Pass [ ] Fail |
| 4 | Open `frontend/package.json` | Its `version` is `0.0.0`, and the footer from step 3 does not show it (criterion 2) | [ ] Pass [ ] Fail |
| 5 | In DevTools Network, reload the page | One `GET http://localhost:8010/api/version` with status 200 and body `{"version":"0.1.0"}` appears (criterion 2) | [ ] Pass [ ] Fail |
| 6 | In `frontend/src/components/AppFooter.tsx`, search for `package.json` and `0.1.0` | Neither occurs (criterion 2) | [ ] Pass [ ] Fail |
| 7 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The page still renders and the footer reads exactly `Task Notes`, with no `v`, `undefined`, `null`, `unknown` or trailing gap (criterion 3) | [ ] Pass [ ] Fail |
| 8 | In DevTools Network, find the `/api/version` request | It failed (connection refused) | [ ] Pass [ ] Fail |
| 9 | Run `docker compose start backend` and reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 10 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run passes with no failed test and exits 0 (criterion 4) | [ ] Pass [ ] Fail |
| 11 | Open `frontend/src/components/AppFooter.test.tsx` | It contains `renders the version the backend reports` and `renders the app name without a version when the request fails` (criterion 4) | [ ] Pass [ ] Fail |
| 12 | In DevTools Network set throttling to `Slow 3G` and reload `http://localhost:5183/` | The footer first reads `Task Notes` with no version and no placeholder, then `Task Notes v0.1.0` once `/api/version` completes (criterion 5) | [ ] Pass [ ] Fail |
| 13 | Set throttling back to `No throttling` | Throttling is off | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
