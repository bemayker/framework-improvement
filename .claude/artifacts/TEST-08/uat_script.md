# UAT Script: TEST-08 Footer shows the app version from the backend

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- `backend/pyproject.toml` reads `version = "0.1.0"`; `frontend/package.json` reads `"version": "0.0.0"`. If either changes, the expected values below change with it.
- Chrome or Edge with DevTools for steps 4, 9 and 10.

## Test Environment Setup

1. From the repository root run `docker compose up -d --build`.
2. Wait until `http://localhost:8010/api/version` answers and `http://localhost:5183/` loads.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:5183/` | Heading "Task Notes" and the note form are shown | [ ] Pass [ ] Fail |
| 2 | 1 | Scroll to the bottom of the page | Footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | 2 | Open `http://localhost:8010/api/version` in a new tab | Body is `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 4 | 2 | On `http://localhost:5183/` open DevTools Network and reload | A request to `http://localhost:8010/api/version` appears with status 200 | [ ] Pass [ ] Fail |
| 5 | 2 | Read the footer | It reads `Task Notes v0.1.0` (backend version), never `v0.0.0` | [ ] Pass [ ] Fail |
| 6 | 3 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | Footer is visible and reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap | [ ] Pass [ ] Fail |
| 7 | 3 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, reload the page | Footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 8 | 4 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | Output includes `renders the version returned by /api/version, not the frontend package version` and `renders the app name only when /api/version is unreachable`, 0 failed | [ ] Pass [ ] Fail |
| 9 | 5 | In DevTools Network set throttling to "Slow 3G" (or block the pattern `*/api/version`) and reload | While the request is pending the footer reads `Task Notes` with no placeholder text | [ ] Pass [ ] Fail |
| 10 | 5 | Remove the throttling or block and reload | Footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
