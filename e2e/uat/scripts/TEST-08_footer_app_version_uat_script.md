# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- The backend runs on http://localhost:8010 (via `uv run`, so its package metadata is installed) and the frontend on http://localhost:5183.
- Note the `version` value under `[project]` in `backend/pyproject.toml` (currently `0.1.0`); `frontend/package.json` has `"version": "0.0.0"`.
- Chrome or Edge for the DevTools steps; frontend dependencies installed (`npm --prefix frontend install`).

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:5183/ | The landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 2 | Read the footer text | It reads `Task Notes v0.1.0` (the noted `backend/pyproject.toml` version with a leading `v`) | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Open http://localhost:8010/api/version in a new tab | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 4 | Open http://localhost:5183/ | The footer reads `Task Notes v0.1.0`, matching the backend and not `0.0.0` from `frontend/package.json` | [ ] Pass [ ] Fail |
| 5 | Open DevTools, Network, reload and filter on `version` | One GET request to `http://localhost:8010/api/version` with status 200 | [ ] Pass [ ] Fail |
| 6 | Run `npm --prefix frontend test -- src/api/version.test.ts src/components/AppFooter.test.tsx` from the repository root | The run passes: no failed or errored test and exit code 0 | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open http://localhost:5183/, then in DevTools, Network, right-click the `version` request, choose "Block request URL" and reload | The request shows as blocked | [ ] Pass [ ] Fail |
| 8 | Read the footer | It reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing space or gap | [ ] Pass [ ] Fail |
| 9 | Remove the block in the Network request blocking panel and reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Open `frontend/src/components/AppFooter.test.tsx` | It contains `renders the version returned by the backend` (present) and `renders the app name without a version when the request fails` (absent) | [ ] Pass [ ] Fail |
| 11 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` from the repository root | The run passes: no failed or errored test, exit code 0 | [ ] Pass [ ] Fail |

### Criterion 5: Loading and failure states are recorded

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | In DevTools, Network, set throttling to "Slow 3G" and reload http://localhost:5183/ | While the `version` request is pending, the footer reads exactly `Task Notes` (no placeholder, no "loading", no gap) | [ ] Pass [ ] Fail |
| 13 | Wait for the request to finish | The footer changes to `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 14 | Set throttling to "No throttling", block the `version` request as in step 7 and reload | The footer reads exactly `Task Notes`, the same as the loading state | [ ] Pass [ ] Fail |
| 15 | Open the plan's `## Re-Plan Feedback` section | The recorded decision for both states is "Task Notes with no version", with its reasons | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
