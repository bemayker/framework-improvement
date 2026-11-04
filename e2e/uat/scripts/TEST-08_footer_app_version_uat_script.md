# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- `backend/pyproject.toml` declares `version = "0.1.0"`; `frontend/package.json` declares `"version": "0.0.0"`. If a later bump changes either, adjust the expected text accordingly.
- Frontend dependencies installed (`npm --prefix frontend install`) for the test-run step.
- No other process bound to ports `5183` (frontend) or `8010` (backend).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Wait until the `db`, `backend` and `frontend` services are running.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The "Task Notes" heading, the note form and the saved-notes list are shown, and a footer is at the bottom | [ ] Pass [ ] Fail |
| 2 | Read the footer text | It reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | Resize the window to 375px wide (DevTools device toolbar, "iPhone SE") | The footer is still visible and still reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `http://localhost:8010/api/version` in a browser tab | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 5 | Open `frontend/package.json` in an editor | Its `"version"` field is `"0.0.0"` | [ ] Pass [ ] Fail |
| 6 | Open `http://localhost:5183/`, open DevTools, Network, filter on `version`, and reload | One `GET http://localhost:8010/api/version` request with status 200 appears, and the footer reads `Task Notes v0.1.0` (the backend's version, not `0.0.0`) | [ ] Pass [ ] Fail |
| 7 | Open `frontend/src/components/AppFooter.tsx` | There is no `package.json` import and no version literal such as `"0.1.0"`; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts` | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `docker compose stop backend` from the repository root | The command reports the `backend` container stopped | [ ] Pass [ ] Fail |
| 9 | Open `http://localhost:5183/` and hard-reload (Cmd+Shift+R) | The page renders and the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing blank space | [ ] Pass [ ] Fail |
| 10 | In DevTools, Elements, inspect the footer | `<footer data-testid="app-footer">` contains only the text `Task Notes`, and no `app-footer-version` span exists | [ ] Pass [ ] Fail |
| 11 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers `{"version":"0.1.0"}`, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 12 | In DevTools, Network, set throttling to "Slow 3G" and reload `http://localhost:5183/` | Until the `/api/version` request completes the footer reads exactly `Task Notes`; when it completes it changes to `Task Notes v0.1.0`, with no placeholder word in between. Reset throttling to "No throttling" afterwards | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repository root | The run lists `AppFooter.test.tsx` and `version.test.ts` and reports 0 failed | [ ] Pass [ ] Fail |
| 14 | Open `frontend/src/components/AppFooter.test.tsx` | A test has the mocked client resolve a version and expects `Task Notes v{version}`; other tests have it reject or resolve `null` and expect exactly `Task Notes` with no `app-footer-version` element | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
