# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- The stack is running: frontend at `http://localhost:5183`, backend at `http://localhost:8010` (or your `VITE_API_BASE_URL`).
- `backend/pyproject.toml` reads `version = "0.1.0"`; `frontend/package.json` reads `"version": "0.0.0"`. If either differs, substitute the values you see.
- Chrome or Edge for the request-blocking step.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | In a terminal run `curl -s http://localhost:8010/api/version` | It prints `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` in the browser | The landing page with the heading "Task Notes" is shown | [ ] Pass [ ] Fail |
| 3 | Scroll to the bottom of the page and read the footer | The footer reads exactly `Task Notes v0.1.0` (criterion 1) | [ ] Pass [ ] Fail |
| 4 | Open `frontend/package.json` and read its `version` field | It reads `0.0.0`, which differs from the footer's version | [ ] Pass [ ] Fail |
| 5 | Open DevTools, Network, reload the page and select the `version` request | It is a GET to `http://localhost:8010/api/version` with response `{"version":"0.1.0"}` (criterion 2) | [ ] Pass [ ] Fail |
| 6 | Open `frontend/src/components/AppFooter.tsx` and search for `0.1.0` and `package.json` | Neither appears | [ ] Pass [ ] Fail |
| 7 | In DevTools, Network, right-click any request, choose "Block request URL" and edit the pattern to `*/api/version` | The pattern is listed under Network request blocking and is enabled | [ ] Pass [ ] Fail |
| 8 | Reload the page and read the footer | The page loads normally and the footer reads exactly `Task Notes`: no `v`, `undefined`, `null` or `unknown`, and no trailing gap (criterion 3) | [ ] Pass [ ] Fail |
| 9 | Remove the blocking pattern and reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 10 | Stop the backend, reload the page | The page still loads and the footer reads exactly `Task Notes` (edge case); restart the backend afterwards | [ ] Pass [ ] Fail |
| 11 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run exits 0 with no failed or errored test (criterion 4) | [ ] Pass [ ] Fail |
| 12 | Read the test titles in the output | They include `renders the backend version once /api/version resolves` and `renders the app name without a version when /api/version is unreachable` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
