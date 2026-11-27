# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running; nothing listening on ports 8010 and 5183.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, on `main`).
- Frontend dependencies installed (`npm --prefix frontend install`) for the test-run steps.
- The expected version is the backend's `[project].version` in `backend/pyproject.toml` (currently `0.1.0`), not a value in this document.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | At the repository root run `BUILD_COMMIT=3f9c2ab71d04e5a6b7c8d9e0f1a2b3c4d5e6f708 docker compose up --build -d` | The backend and frontend containers report as started | [ ] Pass [ ] Fail |
| 2 | Run `curl -s http://localhost:8010/api/version` | The body is `{"version":"0.1.0","commit":"3f9c2ab71d04"}` | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:5183/` in a browser and scroll to the footer | It reads `Task Notes v0.1.0 (3f9c2ab)`: the 7 characters `3f9c2ab`, after the version | [ ] Pass [ ] Fail |
| 4 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The page still loads | [ ] Pass [ ] Fail |
| 5 | Read the footer | It reads exactly `Task Notes`, with no `undefined`, `null`, `unknown`, parentheses or error text | [ ] Pass [ ] Fail |
| 6 | Run `unset BUILD_COMMIT`, then `docker compose up --build -d`, then reload the page | The footer reads `Task Notes v0.1.0` with no parentheses and no `unknown` | [ ] Pass [ ] Fail |
| 7 | In dev tools, Network tab, set throttling to `Slow 3G` and reload | Before `/api/version` answers the footer reads `Task Notes` with no placeholder text | [ ] Pass [ ] Fail |
| 8 | Wait until the request completes | The version appears, with no commit as in step 6 | [ ] Pass [ ] Fail |
| 9 | Set throttling back to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |
| 10 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` from the repository root | The run passes with no failed or errored test and exits 0 | [ ] Pass [ ] Fail |
| 11 | Open `frontend/src/components/AppFooter.test.tsx` | It contains `renders the first 7 characters of the commit next to the version`, `renders no commit while the request is pending` and `renders no commit when the backend is unreachable` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
