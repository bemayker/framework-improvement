# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, on `main`).
- From the repository root, start the stack with the commit set, in your own terminal: `BUILD_COMMIT=a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 docker compose up -d --build` (frontend on `http://localhost:5183`, backend on `http://localhost:8010`).
- `{version}` below is the value the tester reads from `GET http://localhost:8010/api/version` in step 1.1. Do not assume a literal: compare the footer against what the endpoint returned.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open `http://localhost:8010/api/version` in the browser and note the `version` and `commit` values | The page shows a JSON object with a `version` and a `commit` of `a1b2c3d4e5f6` (the backend keeps at most 12 characters of the commit you set) | [ ] Pass [ ] Fail |
| 1.2 | Open `http://localhost:5183/` | The landing page with the "Task Notes" heading loads | [ ] Pass [ ] Fail |
| 1.3 | Scroll to the footer and read it | It reads exactly `Task Notes v{version} (a1b2c3d)`: the version noted in step 1.1, then the first 7 characters of the commit in parentheses, and not the remaining characters `4e5f6` | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or fails, the footer shows no commit and no error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | In the browser's developer tools, Network tab, set throttling to "Slow 3G" and reload `http://localhost:5183/` | While the `/api/version` request is still pending, the footer reads exactly `Task Notes`, with no `undefined`, no `()` and no error text | [ ] Pass [ ] Fail |
| 2.2 | Wait for the request to complete | The footer reads `Task Notes v{version} (a1b2c3d)`. Set throttling back to "No throttling" | [ ] Pass [ ] Fail |
| 2.3 | From the repository root run `docker compose stop backend`, then reload `http://localhost:5183/` | The page loads; the footer reads exactly `Task Notes`, with no `undefined`, no `null`, no `unknown` and no error text | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` | The run lists the success-with-commit, success-without-commit, pending, rejected and null cases of `AppFooter.test.tsx` and the commit cases of `version.test.ts`, and reports `0 failed` | [ ] Pass [ ] Fail |

### Edge case: The backend reports no commit

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | In your own terminal, unset `BUILD_COMMIT`, then run `docker compose up -d backend` | The backend restarts | [ ] Pass [ ] Fail |
| 4.2 | Wait until `http://localhost:8010/api/version` answers with `"commit":"unknown"`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes v{version}`, with no parentheses, no `unknown` and no trailing space | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
