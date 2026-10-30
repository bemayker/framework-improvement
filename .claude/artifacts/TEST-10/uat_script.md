# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running; nothing else bound to ports 8010 and 5183.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- `backend/pyproject.toml` has `version = "0.1.0"`; if it has changed, substitute the current value below.
- Chrome with DevTools for Criterion 2.
- Frontend dependencies installed for Criterion 3 (`npm --prefix frontend install`).

## Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | From the repo root, run `BUILD_COMMIT=3f9c2a1b7d4e5f60718293a4b5c6d7e8f9012345 docker compose up -d --build` | The backend and frontend containers report as started | [ ] Pass [ ] Fail |
| 1.2 | Open `http://localhost:8010/api/version` | The body reads `{"version":"0.1.0","commit":"3f9c2a1b7d4e"}` | [ ] Pass [ ] Fail |
| 1.3 | Open `http://localhost:5183/` and scroll to the bottom | The footer reads `Task Notes v0.1.0 (3f9c2a1)`: the version, a space, then the first 7 characters of the commit in parentheses | [ ] Pass [ ] Fail |
| 1.4 | From a shell where `BUILD_COMMIT` is not exported and `.env` does not set it, run `docker compose up -d backend`, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0`, with no `(unknown)` and no empty parentheses | [ ] Pass [ ] Fail |

## Criterion 2: While the request is pending or fails, the footer shows no commit, never undefined or an error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Bring the stack up as in step 1.1. In DevTools, Network, open the throttling dropdown, add a custom profile with latency `4000` ms, select it and reload `http://localhost:5183/` | For the first seconds the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null` and no `(` | [ ] Pass [ ] Fail |
| 2.2 | Wait for the `api/version` request to finish, then set throttling back to `No throttling` | The footer changes to `Task Notes v0.1.0 (3f9c2a1)` | [ ] Pass [ ] Fail |
| 2.3 | Run `docker compose stop backend`, reload `http://localhost:5183/` and wait up to 5 seconds | The footer reads exactly `Task Notes`: no error text, no `undefined` and no commit | [ ] Pass [ ] Fail |
| 2.4 | Run `docker compose start backend` and reload | The footer reads `Task Notes v0.1.0 (3f9c2a1)` again | [ ] Pass [ ] Fail |

## Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | `0 failed`; the output lists AppFooter tests for the success path (version with commit), the pending path and the failure path | [ ] Pass [ ] Fail |
| 3.2 | Open `frontend/src/components/AppFooter.test.tsx` | The success test asserts `Task Notes v0.1.0 (3f9c2a1)`, the pending test uses a never-resolving client promise, and the failure test uses a client resolving `null` and asserts the text is exactly `Task Notes` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
