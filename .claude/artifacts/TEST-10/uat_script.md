# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- `backend/pyproject.toml` declares `version = "0.1.0"`.
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Chrome (or another browser with DevTools request blocking and network throttling).

## Test Environment Setup

1. From the repository root, run `BUILD_COMMIT=3f2a9c1d4e5b6a7b docker compose up -d --build`.
2. Wait until the `db`, `backend` and `frontend` services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` | The JSON reads `{"version":"0.1.0","commit":"3f2a9c1d4e5b"}` | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the footer at the bottom of the page | It reads exactly `Task Notes v0.1.0 (3f2a9c1)`: seven commit characters, in parentheses, after the version | [ ] Pass [ ] Fail |
| 4 | 1 | Run `docker compose up -d --force-recreate backend` from the repo root with `BUILD_COMMIT` unset in the shell, then reload `http://localhost:5183/` | `/api/version` reports `"commit":"unknown"` and the footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown` | [ ] Pass [ ] Fail |
| 5 | 2 | Restore the commit: run `BUILD_COMMIT=3f2a9c1d4e5b6a7b docker compose up -d --force-recreate backend`. In DevTools Network, right-click the `/api/version` request, choose "Block request URL", reload | The footer reads exactly `Task Notes`: no commit, no `undefined`, no `null`, no `()` and no error text | [ ] Pass [ ] Fail |
| 6 | 2 | Unblock it, set throttling to "Slow 3G" and reload | While the request is pending the footer reads `Task Notes`; when it completes it changes to `Task Notes v0.1.0 (3f2a9c1)` | [ ] Pass [ ] Fail |
| 7 | 2 | Reset throttling to "No throttling". Run `docker compose stop backend` and reload | The footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 8 | 2 | Run `docker compose start backend`, wait until it is up, reload | The footer reads `Task Notes v0.1.0 (3f2a9c1)` again | [ ] Pass [ ] Fail |
| 9 | 3 | Run `npm --prefix frontend test` from the repo root | `AppFooter.test.tsx`, `version.test.ts` and `LandingPage.test.tsx` are in the run, with 0 failed | [ ] Pass [ ] Fail |
| 10 | 3 | Open `frontend/src/components/AppFooter.test.tsx` | It holds a success test expecting `Task Notes v0.1.0 (3f2a9c1)`, a pending test (never-resolving mock) expecting exactly `Task Notes`, and a failure test (rejected mock) expecting exactly `Task Notes` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
