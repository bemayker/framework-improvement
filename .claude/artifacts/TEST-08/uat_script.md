# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, on `main`).
- Copy `.env.example` to `.env` in the repository root if you have not already.
- Ports `5183` (frontend) and `8010` (backend) are free.
- Open `backend/pyproject.toml` and note `[project].version` (`0.1.0` at the time of writing; use whatever it reads now). Open `frontend/package.json` and note its `version` (`0.0.0` at the time of writing, deliberately different).
- Frontend dependencies installed for step 11 (`npm --prefix frontend install`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Wait until the `db`, `backend` and `frontend` services are started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` in the browser | The page shows `{"version":"0.1.0"}` (the backend version you noted) | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | The landing page shows the `Task Notes` heading, the note form and the note list | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the bottom of the page and read the footer | It reads `Task Notes v0.1.0`, the same version as step 1 | [ ] Pass [ ] Fail |
| 4 | 2 | Open `http://localhost:5183/` with the browser DevTools Network tab open, filter on `version` | A request to `http://localhost:8010/api/version` is listed with status `200` and response `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 5 | 2 | Read the footer | It reads `Task Notes v0.1.0`, and does not read `Task Notes v0.0.0` (the frontend package value) | [ ] Pass [ ] Fail |
| 6 | 2 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal and no import of `package.json`; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts` | [ ] Pass [ ] Fail |
| 7 | 3 | Run `docker compose stop backend` | The command reports the backend container stopped | [ ] Pass [ ] Fail |
| 8 | 3 | Open `http://localhost:8010/api/version`, then reload `http://localhost:5183/` and read the footer | The API page cannot connect; the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap | [ ] Pass [ ] Fail |
| 9 | 3 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers `{"version":"0.1.0"}`, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 10 | 5 | In Chrome or Edge DevTools, Network tab, right-click the `version` request and choose "Block request URL", then reload. Afterwards remove the block, set throttling to "Slow 3G" and reload while watching the footer | With the block: footer reads exactly `Task Notes`, never `Task Notes unknown` or blank. While loading on Slow 3G: `Task Notes`; once complete: `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 11 | 4, 5 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run reports `0 failed`; the list includes a version-present test, a version-absent test (rejected and `null`) and a loading test expecting exactly `Task Notes` | [ ] Pass [ ] Fail |
| 12 | 1, 3 | From the repository root run the E2E specs for this feature (`npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts`) | Both specs pass | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
