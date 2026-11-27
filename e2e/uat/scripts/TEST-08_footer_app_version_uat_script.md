# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- From the repository root, `docker compose up --build` is running: frontend at http://localhost:5183, backend at http://localhost:8010.
- Frontend dependencies installed for the test steps (`npm --prefix frontend install`).

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:8010/api/version in a browser tab and note the value of `version` | The page shows JSON such as `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | Open http://localhost:5183/ | The landing page shows the "Task Notes" heading, the note form, and a footer at the bottom | [ ] Pass [ ] Fail |
| 3 | Read the footer text | It reads `Task Notes v` followed by exactly the value noted in step 1 (for example `Task Notes v0.1.0`) | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend's GET /api/version, never a string typed into the component

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `frontend/package.json` and read its `version` field | It reads `0.0.0`, different from the backend's value noted in step 1 | [ ] Pass [ ] Fail |
| 5 | Open http://localhost:5183/ and read the footer | It shows the backend's value from step 1, not `0.0.0` | [ ] Pass [ ] Fail |
| 6 | Open browser DevTools, Network tab, reload http://localhost:5183/ and filter on `version` | One GET request to `http://localhost:8010/api/version` with status 200, whose response `version` equals the version shown in the footer | [ ] Pass [ ] Fail |
| 7 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal and no import of `package.json`; the version comes from `fetchVersion` in `frontend/src/api/version.ts` | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Stop the backend with `docker compose stop backend`, then open http://localhost:5183/ | The landing page renders; DevTools Network shows the request to `http://localhost:8010/api/version` failed | [ ] Pass [ ] Fail |
| 9 | Read the footer | It reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, and no trailing space or separator | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend` and reload http://localhost:5183/ | The footer reads `Task Notes v` followed by the backend's version again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | From the repository root, run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run passes: its summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 12 | Read the run's test titles | They include `renders the version the API client returned` (version present) and `renders exactly Task Notes when the version request fails` (version absent) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
