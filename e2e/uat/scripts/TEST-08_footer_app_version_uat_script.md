# UAT Script: TEST-08 Footer shows the app version served by the backend

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Node.js available for `npm --prefix frontend` commands; `uv` available for the backend test command.
- No other process bound to the frontend port `5183` or the backend port `8010`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` and wait until `db`, `backend` and `frontend` show as running.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser | The page shows `{"version":"0.1.0"}` (the `version` in `backend/pyproject.toml`) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading, the note form and a footer at the bottom | [ ] Pass [ ] Fail |
| 3 | Read the footer text (criterion 1) | It reads exactly `Task Notes v0.1.0`, the same version as step 1 | [ ] Pass [ ] Fail |
| 4 | Open `frontend/package.json` and read its `version` field (criterion 2) | It is `0.0.0` | [ ] Pass [ ] Fail |
| 5 | Reload `http://localhost:5183/` and read the footer | It reads `Task Notes v0.1.0`, the backend's version, and not `v0.0.0` | [ ] Pass [ ] Fail |
| 6 | Open the browser developer tools, Network tab, and reload the page | A `GET` request to `http://localhost:8010/api/version` appears with status `200` and response `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 7 | Run `grep -rn "0.1.0" frontend/src` | No match: the version is not typed into the frontend source | [ ] Pass [ ] Fail |
| 8 | Run `docker compose stop backend` (criterion 3) | The backend container stops; `http://localhost:8010/api/version` no longer answers | [ ] Pass [ ] Fail |
| 9 | Open `http://localhost:5183/` and reload it | The page still renders the heading and the note form | [ ] Pass [ ] Fail |
| 10 | Read the footer | It reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing space or empty gap | [ ] Pass [ ] Fail |
| 11 | In the developer tools Elements panel, inspect the `footer` element | It contains the text `Task Notes` and no `span` with `data-testid="app-version"` | [ ] Pass [ ] Fail |
| 12 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 13 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` (criterion 4) | The run passes: no failed or errored test and exit code 0 | [ ] Pass [ ] Fail |
| 14 | Open `frontend/src/components/AppFooter.test.tsx` | It contains the tests `renders the app name and the backend version once the fetch resolves` and `renders the app name alone when the version request fails` | [ ] Pass [ ] Fail |
| 15 | Run `curl -s http://localhost:8010/api/version` (criterion 5) | It prints `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 16 | Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` with the backing database available | The run passes: no failed or errored test and exit code 0 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 16 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
