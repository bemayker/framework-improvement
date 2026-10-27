# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- `backend/pyproject.toml` has `version = "0.1.0"` and `frontend/package.json` has `"version": "0.0.0"`.
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- A browser with DevTools.

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Wait until http://localhost:8010/api/version answers `{"version":"0.1.0"}` in a browser tab.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open http://localhost:5183/ | The landing page shows the heading "Task Notes" and the note form | [ ] Pass [ ] Fail |
| 2 | 1 | Scroll to the bottom and read the footer | It reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | 1 | In DevTools Elements, inspect the footer | It is a `<footer data-testid="app-footer">` containing a `<span data-testid="app-footer-version">` with ` v0.1.0` | [ ] Pass [ ] Fail |
| 4 | 2 | Open the page with DevTools on the Network tab, then reload | A GET to `http://localhost:8010/api/version` appears with status 200 and response `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 5 | 2 | Read the footer | It shows `v0.1.0` (backend), not `v0.0.0` (frontend package) | [ ] Pass [ ] Fail |
| 6 | 2 | In `backend/pyproject.toml` change the version to `0.1.1`, run `docker compose up -d --build backend` (do not rebuild the frontend), reload the page | The footer reads `Task Notes v0.1.1` | [ ] Pass [ ] Fail |
| 7 | 2 | Revert `backend/pyproject.toml` to `0.1.0`, run `docker compose up -d --build backend`, reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 8 | 3 | Run `docker compose stop backend`, reload the page | The footer reads exactly `Task Notes`, with no `v`, `undefined`, `null`, `unknown` or trailing gap; no `app-footer-version` span in DevTools | [ ] Pass [ ] Fail |
| 9 | 3 | Run `docker compose start backend`, wait until http://localhost:8010/api/version answers, reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 10 | 3 | In the Network tab right-click the `/api/version` request, choose "Block request URL", reload | The footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 11 | 3 | Unblock the URL and reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 12 | 4 | Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` | Both files are listed with 0 failed | [ ] Pass [ ] Fail |
| 13 | 4 | Open `frontend/src/components/AppFooter.test.tsx` | It has a test asserting the footer shows a mocked version and a test asserting the footer text is exactly `Task Notes` when the version is unavailable | [ ] Pass [ ] Fail |
| 14 | 4 | Run `npm --prefix frontend test` | 0 failed, including `src/components/LandingPage.test.tsx` and `src/api/notes.test.ts` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
