# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- The stack is down (`docker compose down`); Docker is running.
- Note the `version` under `[project]` in `backend/pyproject.toml` (currently `0.1.0`, called {version} below).
- Chrome or Edge for the DevTools step; frontend dependencies installed (`npm --prefix frontend install`).

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | From the repository root run `BUILD_COMMIT=4f2a9c1e7b3d5a60 docker compose up -d --build` | The db, backend and frontend containers start | [ ] Pass [ ] Fail |
| 2 | Open http://localhost:8010/api/version in a browser | The JSON shows `"commit": "4f2a9c1e7b3d"` (12 characters, TEST-09's cut) | [ ] Pass [ ] Fail |
| 3 | Open http://localhost:5183/ | The footer reads `Task Notes v{version} (4f2a9c1)`: exactly 7 commit characters, in parentheses, right after the version | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `docker compose stop backend`, then reload http://localhost:5183/ | The footer reads exactly `Task Notes`: no version, no parentheses, no `undefined`, no error text | [ ] Pass [ ] Fail |
| 5 | Run `docker compose down`, then `docker compose up -d --build` with no BUILD_COMMIT set, and reload http://localhost:5183/ | http://localhost:8010/api/version shows `"commit": "unknown"` and the footer reads `Task Notes v{version}` with no parentheses (the version alone) | [ ] Pass [ ] Fail |
| 6 | In DevTools, Network, set throttling to `Slow 3G` and reload http://localhost:5183/ | While `/api/version` is pending the footer reads `Task Notes` only, then changes to `Task Notes v{version}` when the response arrives | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repository root | The run passes: its summary line reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 8 | Open `frontend/src/components/AppFooter.test.tsx` | It contains the tests `renders the first 7 characters of the commit next to the version`, `renders the app name without a version or commit while the request is pending` and `renders the app name without a version or commit when the request fails` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
