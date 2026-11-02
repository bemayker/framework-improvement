# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, on `main`).
- The stack is running from the repository root with `docker compose up -d --build` (frontend on `http://localhost:5183`, backend on `http://localhost:8010`).
- `frontend/package.json` `version` is `0.0.0` and `backend/pyproject.toml` `version` is `0.1.0`. They differ, which is what makes Criterion 2 meaningful.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open `http://localhost:8010/api/version` in the browser and note the value | The page shows `{"version":"0.1.0"}` (or whatever `backend/pyproject.toml` `[project].version` now holds) | [ ] Pass [ ] Fail |
| 1.2 | Open `http://localhost:5183/` | The landing page with the "Task Notes" heading loads | [ ] Pass [ ] Fail |
| 1.3 | Scroll to the bottom of the page and read the footer | It reads `Task Notes v0.1.0`, the value noted in step 1.1 | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, not the frontend's package.json

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Open `http://localhost:5183/` and read the footer | It reads `Task Notes v0.1.0`, the backend's version, and not `Task Notes v0.0.0` | [ ] Pass [ ] Fail |
| 2.2 | Open the browser's developer tools, Network tab, reload the page | One `GET` request to `http://localhost:8010/api/version` with status 200 and response `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2.3 | Open `frontend/src/components/AppFooter.tsx` in an editor | It contains no `package.json` import and no version string literal | [ ] Pass [ ] Fail |

### Criterion 3: An unresolved version is omitted, never shown as undefined, null, unknown or a gap

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | From the repository root run `docker compose stop backend` | The backend container stops; the frontend keeps running | [ ] Pass [ ] Fail |
| 3.2 | Open `http://localhost:5183/` and reload | The page loads; the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing space | [ ] Pass [ ] Fail |
| 3.3 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths, version present and version absent

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` | The run lists the present, loading, rejected and null cases of `AppFooter.test.tsx` and the client cases of `version.test.ts`, and reports `0 failed` | [ ] Pass [ ] Fail |

### Criterion 5: GET /api/version returns the backend's version, and the footer shows that value

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5.1 | Run `curl -s http://localhost:8010/api/version` with the stack up | `{"version":"0.1.0"}`, equal to `backend/pyproject.toml` `[project].version` | [ ] Pass [ ] Fail |
| 5.2 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` with the stack's database reachable | `0 failed` | [ ] Pass [ ] Fail |
| 5.3 | Repeat Criterion 1, step 1.3 | The footer shows the value from step 5.1 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
