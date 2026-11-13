# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker is running. From the repository root start the stack with `BUILD_COMMIT=a1b2c3d4e5f6a7b8 docker compose up --build -d`.
- Frontend at `http://localhost:5183`, backend at `http://localhost:8010`.
- Chrome with DevTools for the throttling and network-blocking steps.
- Frontend dependencies installed (`npm --prefix frontend install`) for step 12.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` (criterion 1) | The body reads `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` and scroll to the footer | It reads exactly `Task Notes v0.1.0 (a1b2c3d)`, in the same small grey text as before | [ ] Pass [ ] Fail |
| 3 | Look for the 8th to 12th characters of the commit in the footer | `4e5f6` does not appear anywhere in the footer | [ ] Pass [ ] Fail |
| 4 | Open DevTools Network, set throttling to "Slow 3G" and reload (criterion 2) | Before the `version` request finishes the footer reads `Task Notes` alone, with no `undefined`, no `v`, no parentheses | [ ] Pass [ ] Fail |
| 5 | Wait for the request to finish | The footer changes to `Task Notes v0.1.0 (a1b2c3d)` without a reload | [ ] Pass [ ] Fail |
| 6 | Set throttling back to "No throttling" | The dropdown shows "No throttling" | [ ] Pass [ ] Fail |
| 7 | Open the command menu (Cmd+Shift+P), run "Show Network request blocking", add and tick `*/api/version`, then reload | The request shows as `(blocked:devtools)` | [ ] Pass [ ] Fail |
| 8 | Read the footer | It reads `Task Notes` with no error text and nothing in parentheses | [ ] Pass [ ] Fail |
| 9 | Untick the blocking pattern | The pattern is unchecked | [ ] Pass [ ] Fail |
| 10 | Restart the stack without a commit: `docker compose down` then `docker compose up --build -d`, and open `http://localhost:8010/api/version` | The body contains `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 11 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`, with no `(unknown)` and no empty parentheses | [ ] Pass [ ] Fail |
| 12 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` (criterion 3) | The run lists the success, pending and failure tests named in the plan's Criterion coverage and reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
