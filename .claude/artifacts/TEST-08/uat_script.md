# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Repository checked out on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Frontend dependencies installed (`npm --prefix frontend install`).
- Backend running on `http://localhost:8010` through `uv run` (so its package metadata is installed and `/api/version` does not answer the `unknown` sentinel), against a running database.
- Frontend running on `http://localhost:5183`.
- Read `[project].version` in `backend/pyproject.toml` first. This script writes it as `0.1.0` (its value at plan time); use whatever value it holds when you test.
- Chrome, for the DevTools steps in criterion 6.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open `http://localhost:5183/` | The landing page shows the heading "Task Notes" and the note form | [ ] Pass [ ] Fail |
| 1.2 | Scroll to the bottom of the page and read the footer | The footer reads exactly `Task Notes v0.1.0` (the backend's version) | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, not from frontend/package.json

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Open `frontend/package.json` and read its `version` field | It reads `0.0.0` | [ ] Pass [ ] Fail |
| 2.2 | Open `http://localhost:8010/api/version` in a browser tab | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2.3 | Open `http://localhost:5183/` and read the footer | It reads `Task Notes v0.1.0`, matching step 2.2, and does not show `0.0.0` | [ ] Pass [ ] Fail |
| 2.4 | Stop the backend, change `version` in `backend/pyproject.toml` to `0.1.1`, start it again with `uv run` (do not rebuild or restart the frontend), and reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.1`. Revert the version to `0.1.0` afterwards | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | Stop the backend, then open `http://localhost:5183/` | The page loads; the heading and note form are visible | [ ] Pass [ ] Fail |
| 3.2 | Read the footer | It reads exactly `Task Notes`, with no trailing `v`, and does not contain `undefined`, `null` or `unknown` | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run reports the tests `renders the version reported by the backend` and `shows only the app name when the version request fails` as passing, its summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |

### Criterion 5: GET /api/version returns the backend's version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5.1 | With the backend running, open `http://localhost:8010/api/version` | The response is `{"version":"0.1.0"}`, the same value as `[project].version` in `backend/pyproject.toml` | [ ] Pass [ ] Fail |

### Criterion 6: Loading and failure states

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6.1 | With the backend running, open `http://localhost:5183/`, open DevTools, Network, set throttling to "Slow 3G", and reload | While the `version` request is pending the footer reads exactly `Task Notes`; once it completes the footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 6.2 | In DevTools, Network, right-click the `version` request and choose "Block request URL", then reload | The footer reads exactly `Task Notes` and stays that way; it is never blank and never reads `unknown` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
