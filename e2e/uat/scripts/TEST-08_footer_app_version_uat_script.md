# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root if no `.env` exists (defaults are usable as-is).
- No other process bound to ports `5183` (frontend), `8010` (backend) or `5442` (database).
- The stack is running: from the repository root, `docker compose up -d --build`, then wait until `db`, `backend` and `frontend` are started. Backend at http://localhost:8010, frontend at http://localhost:5183.
- The expected footer version is the `[project].version` in `backend/pyproject.toml` (at the time of writing `0.1.0`), not `frontend/package.json` (at the time of writing `0.0.0`). A later bump changes the expected text without changing this script.

## Steps

### Criterion 1: The footer on the landing page renders the backend's version string from GET /api/version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open http://localhost:8010/api/version in a browser tab | The page shows JSON whose `version` is `0.1.0` (further fields may be present; note the `version` value) | [ ] Pass [ ] Fail |
| 1.2 | Open http://localhost:5183/ | The landing page shows the `Task Notes` heading, the note form, and a footer at the bottom | [ ] Pass [ ] Fail |
| 1.3 | Read the footer (`data-testid="app-footer"`) | It reads `Task Notes v0.1.0`, the same version as step 1.1 | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, never typed and never package.json

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Open `frontend/package.json` and read its `version` field | It is `0.0.0` | [ ] Pass [ ] Fail |
| 2.2 | Open `backend/pyproject.toml` and read `[project].version` | It is `0.1.0` | [ ] Pass [ ] Fail |
| 2.3 | Open http://localhost:5183/ and read the footer | It shows `v0.1.0`, the backend's value, not `0.0.0` | [ ] Pass [ ] Fail |
| 2.4 | Open browser DevTools, Network tab, and reload the page | One request to `http://localhost:8010/api/version` returns 200, and its `version` matches the footer | [ ] Pass [ ] Fail |
| 2.5 | Open `frontend/src/components/AppFooter.tsx` | No version literal and no `package.json` import appear in it | [ ] Pass [ ] Fail |

### Criterion 3: An unresolved version renders the footer as Task Notes alone

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | Stop the backend only: `docker compose stop backend` | http://localhost:8010/api/version no longer answers | [ ] Pass [ ] Fail |
| 3.2 | Open http://localhost:5183/ and reload | The footer reads exactly `Task Notes`, with no `v`, no `unknown`, no `undefined`, no `null` and no trailing gap | [ ] Pass [ ] Fail |
| 3.3 | In DevTools, Network tab, find the `/api/version` request | It shows as failed | [ ] Pass [ ] Fail |
| 3.4 | Start the backend again: `docker compose start backend`, wait until it answers, then reload the page | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed`, and the AppFooter test list includes a version-present test and version-absent tests (pending, rejected, null) | [ ] Pass [ ] Fail |

### E2E confirmation

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5.1 | From the repository root run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts e2e/tests/TEST-04_page_footer.spec.ts` | `0 failed`: both specs confirm the footer shows the backend's version and, with `/api/version` aborted, reads `Task Notes` alone | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
