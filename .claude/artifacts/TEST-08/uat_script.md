# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/TEST-08-footer-app-version`.
- Nothing else bound to ports `5183` (frontend) or `8010` (backend).
- `frontend/package.json` says `"version": "0.0.0"` and `backend/pyproject.toml` says `version = "0.1.0"`; the footer must show the backend's value.

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Wait until `curl http://localhost:8010/api/version` prints `{"version":"0.1.0"}`.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:5183/` in a browser | The landing page shows the "Task Notes" heading, the note form and a footer at the bottom | [ ] Pass [ ] Fail |
| 2 | 1 | Read the footer | It reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | 2 | Open developer tools, Network tab, reload the page | A `GET` to `http://localhost:8010/api/version` appears with status 200 and response `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 4 | 2 | Confirm the footer shows `0.1.0` and not `0.0.0` | The backend version is shown, not the frontend package version | [ ] Pass [ ] Fail |
| 5 | 2 | In `frontend/src/components/AppFooter.tsx`, search for `package.json` and for a literal version such as `0.1.0` | Neither appears | [ ] Pass [ ] Fail |
| 6 | 3 | Run `docker compose stop backend` | The command reports the backend container stopped | [ ] Pass [ ] Fail |
| 7 | 3 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no blank space after it | [ ] Pass [ ] Fail |
| 8 | 3 | In developer tools, Elements tab, inspect the footer | It holds no element with `data-testid="app-version"` | [ ] Pass [ ] Fail |
| 9 | 3 | Run `docker compose start backend`, wait until `curl http://localhost:8010/api/version` answers, then reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 10 | 4 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | No failed test; `renders the version the backend reports, not the frontend package version` and `renders the app name without a version when the request fails` are listed as passed; exit code 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
