# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- The stack is running with `docker compose up --build` from the repository root (frontend at http://localhost:5183, backend at http://localhost:8010).
- Chrome DevTools available for the loading and failure steps.
- The expected version is whatever `backend/pyproject.toml` declares (`0.1.0` at the time of writing); a later bump changes the expected text without changing this script.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/version` | Output is `{"version":"0.1.0"}` (note the value) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` and scroll to the footer (criterion 1) | The footer reads `Task Notes v0.1.0`, the same version as step 1 | [ ] Pass [ ] Fail |
| 3 | Read `version` in `frontend/package.json` (criterion 2) | It is `0.0.0`, and the footer from step 2 does not show it | [ ] Pass [ ] Fail |
| 4 | In DevTools Network tab, filter on `version` and reload | One `GET http://localhost:8010/api/version` with status 200 and `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 5 | Open `frontend/src/components/AppFooter.tsx` | No `package.json` import and no version literal such as `0.1.0` | [ ] Pass [ ] Fail |
| 6 | Run `docker compose stop backend` and reload the page (criterion 3) | The page still renders its heading and note form | [ ] Pass [ ] Fail |
| 7 | Read the footer | It reads exactly `Task Notes`: no `v`, `undefined`, `null`, `unknown` or trailing gap | [ ] Pass [ ] Fail |
| 8 | Run `docker compose start backend` and reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 9 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` (criterion 4) | `0 failed`; test names include a version-present and a version-absent case | [ ] Pass [ ] Fail |
| 10 | Confirm frontend `0.0.0` differs from backend `0.1.0`, open the page (criterion 5) | The footer shows `v0.1.0` (the backend's), never `v0.0.0` | [ ] Pass [ ] Fail |
| 11 | In DevTools set custom throttling with 10000 ms latency and reload (criterion 6) | While `api/version` is pending the footer reads exactly `Task Notes`, no placeholder or spinner | [ ] Pass [ ] Fail |
| 12 | Wait for the request to finish, then set throttling back to "No throttling" | The footer changes to `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 13 | Right-click the `api/version` request, choose "Block request URL", reload (criterion 7) | The footer is visible and reads exactly `Task Notes`, not blank, not `unknown` | [ ] Pass [ ] Fail |
| 14 | Unblock the URL and reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 15 | Run `npm --prefix frontend test -- src/api/version.test.ts` | `0 failed`, with tests for a non-OK status, a malformed body and the `unknown` sentinel | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
