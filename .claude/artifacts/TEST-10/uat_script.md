# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- From the repository root the stack is running with a build commit set: `BUILD_COMMIT=0123456789abcdef docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010).
- `backend/pyproject.toml` reads `version = "0.1.0"`. If it changed, substitute the current value below.
- Browser DevTools available (Network tab).

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open http://localhost:8010/api/version in a browser tab | The JSON shows `"commit": "0123456789ab"` and `"version": "0.1.0"` | [ ] Pass [ ] Fail |
| 1.2 | Open http://localhost:5183/ | The landing page with the "Task Notes" heading, the note form and the footer is shown | [ ] Pass [ ] Fail |
| 1.3 | Read the footer at the bottom of the page | It reads exactly `Task Notes v0.1.0 (0123456)`: the version from step 1.1, then exactly 7 commit characters in parentheses | [ ] Pass [ ] Fail |
| 1.4 | Open the Network tab, filter on `version`, reload the page | At least one `GET /api/version` request with status 200 is listed (the dev server's React.StrictMode may show more than one) | [ ] Pass [ ] Fail |
| 1.5 | Restart the stack with `BUILD_COMMIT=abc docker compose up -d --build` and reload http://localhost:5183/ | The footer reads `Task Notes v0.1.0 (abc)`: a commit shorter than 7 characters is shown as sent | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error

Restore the stack from Criterion 1 first: `BUILD_COMMIT=0123456789abcdef docker compose up -d --build`.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | In the Network tab set throttling to "Slow 3G" and reload http://localhost:5183/ | While the `version` request is pending, the footer reads `Task Notes` with no version, no commit and no `undefined` | [ ] Pass [ ] Fail |
| 2.2 | Wait for the request to finish | The footer changes to `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 2.3 | Set throttling to "No throttling", right-click the `version` request, choose "Block request URL", and reload | The footer reads exactly `Task Notes`: no error message, no `undefined`, no parentheses | [ ] Pass [ ] Fail |
| 2.4 | Remove the block, restart the stack with `docker compose up -d --build` without `BUILD_COMMIT`, and reload; also open http://localhost:8010/api/version | The JSON shows `"commit": "unknown"` and the footer reads `Task Notes v0.1.0` with no commit and no `(unknown)` | [ ] Pass [ ] Fail |
| 2.5 | In DevTools Elements, inspect the footer from step 2.4 | `<footer data-testid="app-footer">` contains the version span but no element with `data-testid="app-footer-commit"` | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | Run `npm --prefix frontend install`, then `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed` | [ ] Pass [ ] Fail |
| 3.2 | Open `frontend/src/components/AppFooter.test.tsx` | There is one test each for the success path with a commit, the version with no usable commit, the pending request and the failed request, and each asserts the footer's exact text | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
