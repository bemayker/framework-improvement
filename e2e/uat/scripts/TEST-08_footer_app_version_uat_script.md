# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root if it does not exist yet (defaults are usable as-is).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- The expected footer version is whatever `GET /api/version` returns, which comes from `[project].version` in `backend/pyproject.toml`. Read it in step 1 rather than from this document: a later version bump changes the expected text without changing this script.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser tab and note the `version` value | JSON with a `version` field (today `0.1.0`, the value of `[project].version` in `backend/pyproject.toml`) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page with the title "Task Notes" loads | [ ] Pass [ ] Fail |
| 3 | Scroll to the footer under the note list | The footer reads exactly "Task Notes v" followed by the version noted in step 1 | [ ] Pass [ ] Fail |
| 4 | Open dev tools' Network tab and reload the page | A `GET http://localhost:8010/api/version` request with status `200` appears | [ ] Pass [ ] Fail |
| 5 | Compare the footer version with the `version` field of `frontend/package.json` (today `0.0.0`) | The footer shows the backend's version from step 1, not the `frontend/package.json` one | [ ] Pass [ ] Fail |
| 6 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal and no `package.json` import | [ ] Pass [ ] Fail |
| 7 | Run `docker compose stop backend` from the repository root, then reload `http://localhost:5183/` | The page still loads; the footer reads exactly "Task Notes", with no "v", no "undefined", no "null" and no trailing gap | [ ] Pass [ ] Fail |
| 8 | Run `docker compose start backend`, wait for it to be up, and reload | The footer reads "Task Notes v" followed by the backend's version again | [ ] Pass [ ] Fail |
| 9 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The version-present and version-absent tests are listed and none fail | [ ] Pass [ ] Fail |
| 10 | Run `npm --prefix frontend test` | The full frontend suite, including `src/api/version.test.ts`, `src/api/notes.test.ts` and `src/components/LandingPage.test.tsx`, reports no failures | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
