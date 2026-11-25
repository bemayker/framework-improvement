# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Read `version` from `backend/pyproject.toml` (`[project].version`); this script uses `0.1.0`, the value at the time of writing.
- A browser with dev tools (Network tab throttling and Elements inspector).
- Frontend dependencies installed for Criterion 3 (`npm --prefix frontend install`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=0123456789abcdef docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started (the `frontend` log shows the Vite dev server listening).

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser tab | The body is `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` and scroll to the footer | The footer reads `Task Notes v0.1.0 (0123456)`: exactly 7 commit characters, after the version | [ ] Pass [ ] Fail |
| 3 | In dev tools Elements, inspect `<footer data-testid="app-footer">` | It contains an element with `data-testid="app-footer-commit"` whose text is ` (0123456)` | [ ] Pass [ ] Fail |

### Criterion 2: While pending or on failure, the footer shows the version alone, never `undefined` or an error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Set dev tools Network throttling to "Slow 3G" and reload `http://localhost:5183/` | While `/api/version` is pending the footer reads exactly `Task Notes` (no `undefined`, no `null`, no placeholder), then becomes `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 5 | Stop only the backend: `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes`, and no element with `data-testid="app-footer-commit"` exists | [ ] Pass [ ] Fail |
| 6 | Run `docker compose down`, then `docker compose up --build` without `BUILD_COMMIT` set, and open `http://localhost:8010/api/version` | The body shows `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 7 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`: no `(unknown)`, no `()`, no `undefined`, and no element with `data-testid="app-footer-commit"` | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run passes: no failed or errored test on the summary line, exit code 0 | [ ] Pass [ ] Fail |
| 9 | Open `frontend/src/components/AppFooter.test.tsx` | It contains the tests `renders the version and the first 7 characters of the build commit`, `renders only the app name while the version is loading` and `renders only the app name when the version request fails` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
