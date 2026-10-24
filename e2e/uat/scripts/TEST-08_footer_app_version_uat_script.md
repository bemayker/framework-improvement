# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- The stack is running from the repository root with `docker compose up -d`; the frontend is at `http://localhost:5183` and the backend at `http://localhost:8010`.
- `backend/pyproject.toml` has `version = "0.1.0"` (the expected footer version follows that field).
- Frontend dependencies installed (`npm --prefix frontend install`) for steps 10 and 11.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` in the browser | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | The landing page shows the `Task Notes` heading, the note form and the note list | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the bottom and read the footer | It reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 4 | 2 | Open `frontend/package.json` and read `"version"` | It reads `0.0.0` | [ ] Pass [ ] Fail |
| 5 | 2 | Reload `http://localhost:5183/` and read the footer | It reads `Task Notes v0.1.0`, the backend's version, not `0.0.0` | [ ] Pass [ ] Fail |
| 6 | 2 | Open the developer tools Network tab and reload the page | One request to `http://localhost:8010/api/version` with status 200 and response `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 7 | 2 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal (no `0.1.0`, no `0.0.0`) and no `package.json` import | [ ] Pass [ ] Fail |
| 8 | 3 | Run `docker compose stop backend`, then reload `http://localhost:5183/` and read the footer | It reads exactly `Task Notes`, with no `v`, no trailing gap and none of `undefined`, `null` or `unknown`; the heading and note form still render | [ ] Pass [ ] Fail |
| 9 | 3 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` shows `{"version":"0.1.0"}`, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 10 | 4 | Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` | The run lists the version-present test and the version-absent tests (client rejects, client returns null) and reports `0 failed` | [ ] Pass [ ] Fail |
| 11 | 4 | Run `npm --prefix frontend test` | The whole frontend suite, including `src/api/version.test.ts`, `AppFooter.test.tsx` and `LandingPage.test.tsx`, reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
