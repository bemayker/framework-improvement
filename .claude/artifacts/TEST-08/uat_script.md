# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- From the repository root the stack is running: `docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010).
- `backend/pyproject.toml` reads `version = "0.1.0"` and `frontend/package.json` reads `"version": "0.0.0"`. If either changed, substitute the current values below.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open http://localhost:8010/api/version in a browser tab | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 1.2 | Open http://localhost:5183/ | The landing page with the "Task Notes" heading is shown | [ ] Pass [ ] Fail |
| 1.3 | Scroll to the bottom of the page | The footer reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, never typed into the component

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Open http://localhost:5183/ and look at the footer | It reads `Task Notes v0.1.0` (the backend's version), not `v0.0.0` (the frontend package's version) | [ ] Pass [ ] Fail |
| 2.2 | Open DevTools Network tab, filter on `version`, reload the page | One `GET http://localhost:8010/api/version` request with status 200 and body `{"version":"0.1.0"}` is listed | [ ] Pass [ ] Fail |
| 2.3 | Open `frontend/src/components/AppFooter.tsx` and search for `0.1.0` and for `package.json` | Neither appears; the version comes only from `getBackendVersion()` | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | Stop only the backend: `docker compose stop backend` | http://localhost:8010/api/version no longer answers | [ ] Pass [ ] Fail |
| 3.2 | Open http://localhost:5183/ in a fresh tab | The page renders and the footer reads exactly `Task Notes`: no ` v`, no `undefined`, no `null`, no `unknown`, no blank gap | [ ] Pass [ ] Fail |
| 3.3 | In DevTools Elements, inspect the footer | `<footer data-testid="app-footer">` holds only the text `Task Notes`; no element with `data-testid="app-footer-version"` exists | [ ] Pass [ ] Fail |
| 3.4 | Run `docker compose start backend`, then reload http://localhost:5183/ | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths, version present and version absent

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | Run `npm --prefix frontend install`, then `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` | The run reports `0 failed`; the test names include a version-present and a version-absent test | [ ] Pass [ ] Fail |
| 4.2 | Run `npm --prefix frontend test` | The whole frontend suite, including `AppFooter.test.tsx`, `LandingPage.test.tsx` and `api/version.test.ts`, reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
