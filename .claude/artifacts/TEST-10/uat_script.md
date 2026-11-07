# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- The stack is started from the repository root with a commit set: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` (frontend at http://localhost:5183, backend at http://localhost:8010).
- Chrome DevTools available for the pending and failure steps.
- Frontend dependencies installed (`npm --prefix frontend install`) for the test step.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/version` (criterion 1) | Output is `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page with the heading "Task Notes" is shown | [ ] Pass [ ] Fail |
| 3 | Read the footer at the bottom of the page | It reads `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit from step 1 | [ ] Pass [ ] Fail |
| 4 | In DevTools Network tab set custom throttling with 10000 ms latency and reload (criterion 2) | While `api/version` is pending the footer reads exactly `Task Notes`, with no `undefined`, no `()` and no error text | [ ] Pass [ ] Fail |
| 5 | Wait for the request to finish, then set throttling back to "No throttling" | The footer changes to `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 6 | Right-click the `api/version` request, choose "Block request URL", reload | The footer is visible and reads exactly `Task Notes`, with no `undefined` and no error | [ ] Pass [ ] Fail |
| 7 | Unblock the URL. Restart the backend without a commit: `docker compose up -d backend` from a shell where `echo $BUILD_COMMIT` prints an empty line, then run `curl -s http://localhost:8010/api/version` | Output contains `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 8 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`: the version alone, no `unknown`, no brackets, no `undefined` | [ ] Pass [ ] Fail |
| 9 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` (criterion 3) | `0 failed`; AppFooter test names include a success case with the commit, a pending case and a failure case | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
