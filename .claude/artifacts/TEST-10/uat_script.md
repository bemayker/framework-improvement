# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged); frontend dependencies installed (`npm --prefix frontend install`).
- Stack started from the repository root with a known build commit: `BUILD_COMMIT=0123456789abcdef docker compose up -d --build`; frontend on `http://localhost:5183`, backend on `http://localhost:8010`.
- The version shown is whatever `backend/pyproject.toml` declares (at the time of writing `0.1.0`).

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` | The body reads `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The "Task Notes" heading, the note form and the footer at the bottom are shown | [ ] Pass [ ] Fail |
| 3 | Read the footer text | It reads exactly `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 4 | Run `docker compose up -d backend` from the repository root without `BUILD_COMMIT` set, wait until `http://localhost:8010/api/version` shows `"commit":"unknown"`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown` | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error

Restart the stack with `BUILD_COMMIT=0123456789abcdef docker compose up -d --build` before these steps.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Open `http://localhost:5183/`, set devtools Network throttling to "Slow 3G" and reload | While `GET /api/version` is pending the footer reads exactly `Task Notes`, with no `undefined`, no `(`, no spinner and no error text | [ ] Pass [ ] Fail |
| 6 | Wait for the request to finish | The footer changes to `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 7 | Remove the throttling, right-click the `/api/version` request in devtools Network, choose "Block request URL" and reload | The footer reads exactly `Task Notes`, with no `undefined`, no `null`, no `(` and no error message anywhere on the page | [ ] Pass [ ] Fail |
| 8 | Unblock the URL and reload | The footer reads `Task Notes v0.1.0 (0123456)` again | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | `0 failed` | [ ] Pass [ ] Fail |
| 10 | Read the AppFooter test names in the output | There is a success case showing the short commit, a pending case and a failure case, each passing | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
