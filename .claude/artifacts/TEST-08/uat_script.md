# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- `backend/pyproject.toml` declares `version = "0.1.0"` and `frontend/package.json` declares `"version": "0.0.0"`.
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Chrome (or another browser with DevTools Network request overrides and request blocking).

## Test Environment Setup

1. From the repository root, run `docker compose up --build`.
2. Wait until the `db`, `backend` and `frontend` services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` | The JSON reads `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the bottom and read the footer | It reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 4 | 2 | Reload with DevTools Network tab open | A `GET` to `http://localhost:8010/api/version` appears with status 200 | [ ] Pass [ ] Fail |
| 5 | 2 | Read the footer | It reads `Task Notes v0.1.0`, the backend's value, not `v0.0.0` | [ ] Pass [ ] Fail |
| 6 | 2 | Open `frontend/src/components/AppFooter.tsx` | There is no version literal and no `package.json` import | [ ] Pass [ ] Fail |
| 7 | 3 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes`: no `v`, `undefined`, `null`, `unknown` or trailing gap | [ ] Pass [ ] Fail |
| 8 | 3 | Run `docker compose start backend`, wait until it is up, reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 9 | 4 | Run `npm --prefix frontend test` from the repo root | `AppFooter.test.tsx` and `version.test.ts` are in the run, with 0 failed | [ ] Pass [ ] Fail |
| 10 | 4 | Open `frontend/src/components/AppFooter.test.tsx` | It has a resolved-version test (`Task Notes v{version}`) and tests with no version (exactly `Task Notes`) | [ ] Pass [ ] Fail |
| 11 | 5 | In DevTools use Network request overrides ("Override content") on the `/api/version` request to return `{"version":"9.9.9-manual"}`, then reload | The footer reads `Task Notes v9.9.9-manual`, though the frontend's own version is `0.0.0` | [ ] Pass [ ] Fail |
| 12 | 5 | Remove the override and reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 13 | 6 | In DevTools Network, right-click the `/api/version` request, choose "Block request URL", reload | The footer reads exactly `Task Notes` (failure state: not blank, not `unknown`) | [ ] Pass [ ] Fail |
| 14 | 6 | Unblock it, set throttling to "Slow 3G" and reload | While the request is pending the footer reads `Task Notes`; once it completes it changes to `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 15 | 6 | Reset throttling to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
