# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- The stack is running from the repository root with a known commit: `BUILD_COMMIT=0123456789abcdef docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010).
- Chrome with DevTools available for the pending and failure steps.
- Frontend dependencies installed (`npm --prefix frontend ci`) for the test steps.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Run `curl -s http://localhost:8010/api/version` | It prints `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` in a browser | The "Task Notes" heading, the note form and the note list are visible | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the footer at the bottom of the page | It reads exactly `Task Notes v0.1.0 (0123456)`: seven commit characters, in parentheses, right after the version, in the same small grey text as the rest of the footer | [ ] Pass [ ] Fail |
| 4 | 2 | In DevTools, Network, set throttling to `Slow 3G` and reload | While the `version` request is pending the footer reads exactly `Task Notes`; when it completes it changes to `Task Notes v0.1.0 (0123456)`. At no point does it show `undefined`, `null` or an error message | [ ] Pass [ ] Fail |
| 5 | 2 | In DevTools, Network, right-click the `version` request, choose "Block request URL", set throttling to `No throttling` and reload | The footer reads exactly `Task Notes`, with no version, no commit and no error text | [ ] Pass [ ] Fail |
| 6 | 2 | Remove the request block, then run `docker compose up -d --build backend` with no `BUILD_COMMIT` set and reload the page | `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0","commit":"unknown"}` and the footer reads exactly `Task Notes v0.1.0`, with no `(unknown)` | [ ] Pass [ ] Fail |
| 7 | 3 | Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed` | [ ] Pass [ ] Fail |
| 8 | 3 | Open `frontend/src/components/AppFooter.test.tsx` | It contains one test each for the success path (footer `Task Notes v9.9.9 (0123456)`), the pending path and the failure path (footer exactly `Task Notes`) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
