# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Stack running: `docker compose up -d --build` from the repository root (frontend at http://localhost:5183, backend at http://localhost:8010).
- `backend/pyproject.toml` has `version = "0.1.0"`; `frontend/package.json` has `"version": "0.0.0"`.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:5183/ in Chrome | The landing page shows the heading "Task Notes" and the note form | [ ] Pass [ ] Fail |
| 2 | Scroll to the bottom of the page | The footer reads `Task Notes v0.1.0` (criterion 1) | [ ] Pass [ ] Fail |
| 3 | Open DevTools, Network tab, filter `version`, reload | One request to `http://localhost:8010/api/version`, status 200, response `{"version":"0.1.0"}` (criterion 2) | [ ] Pass [ ] Fail |
| 4 | Read the footer again | It reads `Task Notes v0.1.0` and does not contain `0.0.0` | [ ] Pass [ ] Fail |
| 5 | In `backend/pyproject.toml` change `version = "0.1.0"` to `"0.1.1"`, run `docker compose up -d --build backend`, reload the page without rebuilding the frontend | The footer reads `Task Notes v0.1.1` | [ ] Pass [ ] Fail |
| 6 | Revert `backend/pyproject.toml` to `"0.1.0"`, run `docker compose up -d --build backend`, reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 7 | Set DevTools Network throttling to "Slow 3G" and reload | While `/api/version` is pending the footer reads exactly `Task Notes` (no `v`, `undefined`, `null`, `unknown` or "loading"); once resolved it reads `Task Notes v0.1.0` (criterion 3). Set throttling back to "No throttling" | [ ] Pass [ ] Fail |
| 8 | Run `docker compose stop backend`, then reload the page | The footer is visible and reads exactly `Task Notes` (edge case) | [ ] Pass [ ] Fail |
| 9 | Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0"}`, reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 10 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | 0 failed; AppFooter tests include a version-present case and the pending, rejected and null cases (criterion 4) | [ ] Pass [ ] Fail |
| 11 | Run `curl -s -i http://localhost:8010/api/version` | `HTTP/1.1 200 OK` and body `{"version":"0.1.0"}` (criterion 5) | [ ] Pass [ ] Fail |
| 12 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` | 0 failed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
