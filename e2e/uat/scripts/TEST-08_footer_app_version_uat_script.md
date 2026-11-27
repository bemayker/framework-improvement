# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Ports `5183` (frontend) and `8010` (backend) free.
- `backend/pyproject.toml` line 3 reads `version = "0.1.0"` and `frontend/package.json` reads `"version": "0.0.0"`.

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Wait until `db`, `backend` and `frontend` are running.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser tab | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 3 | Read the footer text | It reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, not from the frontend package.json

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` and does not read `v0.0.0` | [ ] Pass [ ] Fail |
| 5 | Edit `backend/pyproject.toml` line 3 to `version = "0.1.1"`, then run `docker compose up -d --build backend` (the frontend is not rebuilt) | The command finishes with the backend container running | [ ] Pass [ ] Fail |
| 6 | Open `http://localhost:8010/api/version` | It shows `{"version":"0.1.1"}` | [ ] Pass [ ] Fail |
| 7 | Reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.1`, although the frontend bundle was not rebuilt | [ ] Pass [ ] Fail |
| 8 | Revert `backend/pyproject.toml` line 3 to `version = "0.1.0"` and run `docker compose up -d --build backend`, then reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `docker compose stop backend` | `http://localhost:8010/api/version` no longer answers | [ ] Pass [ ] Fail |
| 10 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing space or gap | [ ] Pass [ ] Fail |
| 11 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers `{"version":"0.1.0"}`, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | From the repository root, run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run passes: no failed or errored test, exit code 0 | [ ] Pass [ ] Fail |
| 13 | Open `frontend/src/components/AppFooter.test.tsx` | It contains `renders the version the backend reports once the request resolves` (present) and `renders the app name alone with no version gap when the version request fails` (absent) | [ ] Pass [ ] Fail |

### Criterion 5: Before the version request resolves, the footer shows the app name alone

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 14 | In Chrome open `http://localhost:5183/`, open DevTools, Network tab, set throttling to `Slow 3G` | Throttling is active | [ ] Pass [ ] Fail |
| 15 | Reload the page and watch the footer while the `version` request is pending | The footer reads `Task Notes` with no `v` and no placeholder text | [ ] Pass [ ] Fail |
| 16 | Wait for the `version` request to complete | The footer changes to `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 17 | Set throttling back to `No throttling` | The page loads normally on the next reload | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 17 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
