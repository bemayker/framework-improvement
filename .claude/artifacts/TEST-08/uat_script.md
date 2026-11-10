# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Copy `.env.example` to `.env` in the repository root if you have not already (defaults are usable as-is).
- Frontend dependencies installed for step 11: `npm --prefix frontend ci`.

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Wait until the `db`, `backend` and `frontend` services are up. The frontend is at `http://localhost:5183` and the backend at `http://localhost:8010`.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` | JSON such as `{"version":"0.1.0"}` (the `[project].version` in `backend/pyproject.toml`). Note the value | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | The landing page shows the heading "Task Notes" | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the bottom and read the footer | It reads exactly `Task Notes v` followed by the value from step 1 (e.g. `Task Notes v0.1.0`) | [ ] Pass [ ] Fail |
| 4 | 2 | Read the `"version"` field in `frontend/package.json` | It is `0.0.0`, different from the backend's version | [ ] Pass [ ] Fail |
| 5 | 2 | Reload `http://localhost:5183/` and read the footer | It shows the backend's version (`v0.1.0`), not `v0.0.0` | [ ] Pass [ ] Fail |
| 6 | 2 | Open DevTools, Network tab, reload | A GET to `http://localhost:8010/api/version` returns 200 and its `version` matches the footer | [ ] Pass [ ] Fail |
| 7 | 2 | Open `frontend/src/components/AppFooter.tsx` | It has no `package.json` import and no version literal | [ ] Pass [ ] Fail |
| 8 | 3 | Run `docker compose stop backend`, then open or reload `http://localhost:5183/` | The page still renders and the footer reads exactly `Task Notes`: no ` v`, no `undefined`, `null` or `unknown`, no trailing gap | [ ] Pass [ ] Fail |
| 9 | 3 | Run `docker compose start backend`, wait a few seconds, reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 10 | 5 | In DevTools, Network tab, set throttling to "Slow 3G", reload and watch the footer while `/api/version` is pending | The footer reads `Task Notes` (not blank, not "loading", no version); when the request finishes it changes to `Task Notes v0.1.0`. Reset throttling to "No throttling" | [ ] Pass [ ] Fail |
| 11 | 4 | From the repository root, run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed`; the AppFooter tests include a version-present case and a version-absent case | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
