# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- The stack is running locally, backend on `http://localhost:8010` and frontend on `http://localhost:5183`.
- `backend/pyproject.toml` declares `version = "0.1.0"` and `frontend/package.json` declares `"version": "0.0.0"`. If either was bumped, substitute the current values below.
- Chrome with DevTools for the network-blocking and throttling steps.
- Frontend dependencies installed (`npm --prefix frontend install`) for step 12.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 2 | Read the footer text (criterion 1) | It reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | With DevTools open on the Network tab, reload the page (criterion 2) | One `GET http://localhost:8010/api/version` request is listed with status 200 | [ ] Pass [ ] Fail |
| 4 | Open that request's Response | The body is `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 5 | Compare with the footer | The footer's `v0.1.0` is the same value as the response body | [ ] Pass [ ] Fail |
| 6 | Search `frontend/src/components/AppFooter.tsx` for `0.1.0` and for `package.json` | Neither appears | [ ] Pass [ ] Fail |
| 7 | In DevTools open the command menu (Cmd+Shift+P), run "Show Network request blocking", enable it and add the pattern `*/api/version` (criterion 3) | The pattern is listed and checked | [ ] Pass [ ] Fail |
| 8 | Reload the page | The `/api/version` request shows as `(blocked:devtools)` | [ ] Pass [ ] Fail |
| 9 | Read the footer | It reads exactly `Task Notes`, with no `v`, `undefined`, `null`, `unknown` or trailing space (select the text to confirm nothing follows "Notes") | [ ] Pass [ ] Fail |
| 10 | Untick the blocking pattern and reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 11 | Open `frontend/package.json` and `backend/pyproject.toml` (criterion 5), then load the page | The two versions differ (`0.0.0` and `0.1.0`), the footer reads `Task Notes v0.1.0`, and `0.0.0` appears nowhere on the page | [ ] Pass [ ] Fail |
| 12 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` (criterion 4) | The run includes `renders the version the backend reports` and `renders the app name without a version when the version request fails`, and reports `0 failed` | [ ] Pass [ ] Fail |
| 13 | Set Network throttling to "Slow 3G" and reload (criterion 6) | While `/api/version` is pending the footer reads `Task Notes` alone, with no placeholder text | [ ] Pass [ ] Fail |
| 14 | Wait for the request to finish | The footer changes to `Task Notes v0.1.0` without a reload | [ ] Pass [ ] Fail |
| 15 | Set throttling back to "No throttling" | The dropdown shows "No throttling" | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
