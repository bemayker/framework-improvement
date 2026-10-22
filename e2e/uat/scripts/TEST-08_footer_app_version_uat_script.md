# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- The backend is running on `http://localhost:8010` and the frontend on `http://localhost:5183` (for example `docker compose up --build`).

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser tab and note the version value | The page shows `{"version":"0.1.0"}` (possibly with a `commit` field once TEST-09 has merged) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 3 | Read the footer text | It reads `Task Notes v0.1.0`, i.e. `Task Notes v` followed by exactly the value noted in step 1 | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from a single declared source

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `frontend/package.json` and read the `version` field | It is `0.0.0` | [ ] Pass [ ] Fail |
| 5 | Open `backend/pyproject.toml` and read `[project].version` | It is `0.1.0` | [ ] Pass [ ] Fail |
| 6 | Open `http://localhost:5183/` and read the footer | It shows `0.1.0` (the backend's), not `0.0.0` (the frontend's) | [ ] Pass [ ] Fail |
| 7 | Open `frontend/src/components/AppFooter.tsx` and search for `0.1.0` and for `package.json` | Neither appears; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts` | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Stop the backend (`docker compose stop backend`) and open `http://localhost:5183/` | The landing page renders with the heading and the note form | [ ] Pass [ ] Fail |
| 9 | Read the footer text | It reads exactly `Task Notes`, with no `v`, no trailing space, and no `undefined`, `null` or `unknown` | [ ] Pass [ ] Fail |
| 10 | Start the backend again (`docker compose start backend`) and reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 11 | In the browser developer tools Network tab, throttle to "Slow 3G" and reload `/` | While `/api/version` is pending the footer reads `Task Notes` alone, then `Task Notes v0.1.0` appears when the request completes | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed`; the AppFooter test names include a version-present case and version-absent cases (rejected fetch, `unknown` sentinel, pending fetch) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
