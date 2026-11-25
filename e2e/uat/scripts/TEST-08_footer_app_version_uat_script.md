# UAT Script: TEST-08 Footer shows the backend app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Read `version` from `backend/pyproject.toml` (`[project].version`) and from `frontend/package.json`. The footer's expected version is the backend's; do not assume a value. At the time of writing the backend reads `0.1.0` and the frontend package reads `0.0.0`, so the two sources differ.
- A browser with dev tools (Network tab throttling and Elements inspector).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (the `frontend` log shows the Vite dev server listening).

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The landing page loads and shows the title "Task Notes" | [ ] Pass [ ] Fail |
| 2 | Scroll to the bottom of the page | The footer reads `Task Notes v0.1.0`, where `0.1.0` equals the value read from `backend/pyproject.toml` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend's GET /api/version at runtime

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Open `http://localhost:8010/api/version` in a browser tab | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 4 | Open `http://localhost:5183/`, open dev tools Network tab, and reload | A request to `http://localhost:8010/api/version` appears with status 200 | [ ] Pass [ ] Fail |
| 5 | Read the footer | It reads `Task Notes v0.1.0` (the backend's value) and does NOT read `v0.0.0` (the frontend package's value) | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer reads `Task Notes`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6 | Stop only the backend: `docker compose stop backend` | `http://localhost:8010/api/version` no longer answers | [ ] Pass [ ] Fail |
| 7 | Open `http://localhost:5183/` and reload | The footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing space or empty gap | [ ] Pass [ ] Fail |
| 8 | In dev tools Elements, inspect `<footer data-testid="app-footer">` | It contains no element with `data-testid="app-footer-version"` | [ ] Pass [ ] Fail |
| 9 | Start the backend again (`docker compose start backend`) and reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 10 | Loading state: set dev tools Network throttling to "Slow 3G" and reload | While the `/api/version` request is pending the footer reads `Task Notes`, then gains ` v0.1.0` when it completes; it never shows a placeholder | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run passes: no failed or errored test on the summary line, exit code 0 | [ ] Pass [ ] Fail |
| 12 | Open `frontend/src/components/AppFooter.test.tsx` | It contains the tests `renders the version the backend reports, not the frontend package version`, `renders only the app name while the version is loading` and `renders only the app name when the version request fails` | [ ] Pass [ ] Fail |

### Criterion 5: GET /api/version returns the backend's version

This is a backend response, not a UI behaviour; check it directly.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Run `curl -s http://localhost:8010/api/version` with the stack up | The output is `{"version":"0.1.0"}`, matching `backend/pyproject.toml` | [ ] Pass [ ] Fail |
| 14 | From the repository root run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` with the database service up | The run passes: no failed or errored test on the summary line, exit code 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
