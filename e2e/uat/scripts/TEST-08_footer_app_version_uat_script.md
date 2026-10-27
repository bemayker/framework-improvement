# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Frontend dependencies installed (`npm --prefix frontend ci`) for the test steps.
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Expected backend version is the `version` in `backend/pyproject.toml` (`0.1.0` at the time of writing); the frontend package version is `0.0.0`.

## Test Environment Setup

1. From the repository root, run `docker compose up -d`.
2. Wait until the frontend answers at `http://localhost:5183` and `http://localhost:8010/api/version` returns JSON.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading, the note form and a footer | [ ] Pass [ ] Fail |
| 2 | Read the footer | It reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | Inspect the footer | `<footer data-testid="app-footer">` contains `<span data-testid="app-footer-version">` with text `v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | With DevTools open on the Network tab, reload the page | A `GET` to `http://localhost:8010/api/version` with status 200 is listed | [ ] Pass [ ] Fail |
| 5 | Open that request's Response tab | The body is `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 6 | Open `frontend/package.json` | Its `"version"` is `"0.0.0"` | [ ] Pass [ ] Fail |
| 7 | Compare with the footer | The footer shows `v0.1.0` (backend), not `v0.0.0` (frontend package) | [ ] Pass [ ] Fail |
| 8 | Open `frontend/src/components/AppFooter.tsx` | It imports nothing from `package.json` and holds no version literal | [ ] Pass [ ] Fail |

### Criterion 3: The footer renders without a version when it cannot be resolved

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `docker compose stop backend` | The backend container stops | [ ] Pass [ ] Fail |
| 10 | Reload `http://localhost:5183/` | The `GET /api/version` request fails in the Network tab | [ ] Pass [ ] Fail |
| 11 | Read the footer | It reads exactly `Task Notes`: no `v`, `unknown`, `undefined`, `null` or trailing gap; no `app-footer-version` element | [ ] Pass [ ] Fail |
| 12 | Run `docker compose start backend`, wait for `http://localhost:8010/api/version` to answer, reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | 0 failed; test names include a version-present and a version-absent case | [ ] Pass [ ] Fail |
| 14 | Open `frontend/src/components/AppFooter.test.tsx` | One test resolves `0.1.0` and expects `Task Notes v0.1.0`; others reject or resolve `null` and expect exactly `Task Notes` with no `app-footer-version` element | [ ] Pass [ ] Fail |

### Criterion 5: Before the request resolves the footer reads `Task Notes` alone

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 15 | In Chrome DevTools, open Network request blocking and add the pattern `*/api/version` | The pattern is listed and enabled | [ ] Pass [ ] Fail |
| 16 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 17 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | 0 failed, including the never-settling request test expecting exactly `Task Notes` | [ ] Pass [ ] Fail |
| 18 | Remove the blocking pattern and reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 6: `GET /api/version` returns the backend's own version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 19 | Open `http://localhost:8010/api/version` | The page shows `{"version":"0.1.0"}`, matching `backend/pyproject.toml` | [ ] Pass [ ] Fail |
| 20 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` with the database available | 0 failed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 20 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
