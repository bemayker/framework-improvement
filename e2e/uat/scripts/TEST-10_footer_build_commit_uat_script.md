# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker running. From the repository root, start the stack with a known commit: `BUILD_COMMIT=3f9a2c1d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a39 docker compose up -d --build`.
- Frontend at `http://localhost:5183`, backend at `http://localhost:8010`.
- Frontend dependencies installed (`npm --prefix frontend install`) for the test steps.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in the browser | The JSON reads `{"version":"0.1.0","commit":"3f9a2c1d8e7b"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading, the note form and the note list | [ ] Pass [ ] Fail |
| 3 | Scroll to the footer at the bottom of the page | It reads exactly `Task Notes v0.1.0 (3f9a2c1)`: the version, then the first 7 characters of the commit in parentheses (criterion 1) | [ ] Pass [ ] Fail |
| 4 | Stop the backend only: `docker compose stop backend` | The backend container stops | [ ] Pass [ ] Fail |
| 5 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`, with no version, no commit, and no `undefined`, `null` or error text (criterion 2) | [ ] Pass [ ] Fail |
| 6 | Restart without a commit: run `docker compose stop`, then `docker compose up -d` with `BUILD_COMMIT` unset in your shell | The stack is running again | [ ] Pass [ ] Fail |
| 7 | Open `http://localhost:8010/api/version` | `commit` reads `"unknown"` | [ ] Pass [ ] Fail |
| 8 | Reload `http://localhost:5183/` and read the footer | It reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown` (criterion 2, edge case) | [ ] Pass [ ] Fail |
| 9 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run exits 0 with no failed or errored test (criterion 3) | [ ] Pass [ ] Fail |
| 10 | Open `frontend/src/components/AppFooter.test.tsx` and read the test titles | They include `renders the version and the first 7 characters of the commit once /api/version resolves`, `renders the app name without a version while /api/version is pending` and `renders the app name without a version when /api/version is unreachable` | [ ] Pass [ ] Fail |

Note: the pending state is too short to see by eye on a local stack; the component test in steps 9 and 10 verifies it.

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
