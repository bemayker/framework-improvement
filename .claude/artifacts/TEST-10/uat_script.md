# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, once merged, on `main`).
- Docker running. From the repository root the stack is started with a commit set: `BUILD_COMMIT=abcdef1234567890 docker compose up -d --build`. The backend then answers on `http://localhost:8010` and the frontend on `http://localhost:5183`.
- Frontend dependencies installed (`npm --prefix frontend ci`) for the test steps.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/version` | The JSON carries `"commit": "abcdef123456"` and a `version` value; note that version | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` in a browser | The landing page shows the "Task Notes" heading | [ ] Pass [ ] Fail |
| 3 | Scroll to the footer at the bottom of the page | It reads `Task Notes v{the noted version} (abcdef1)`: seven commit characters, in parentheses, after the version | [ ] Pass [ ] Fail |

### Criterion 2: While pending or on failure, the footer shows no commit and no error text

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Run `docker compose stop backend` | The backend container stops | [ ] Pass [ ] Fail |
| 5 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`: no version, no commit, and no `undefined`, `null`, `unknown` or error text | [ ] Pass [ ] Fail |
| 6 | Run `docker compose up -d backend` without BUILD_COMMIT (open a new shell, or `unset BUILD_COMMIT` first) and wait until `curl -s http://localhost:8010/api/version` answers with `"commit": "unknown"` | The endpoint reports the commit `unknown` | [ ] Pass [ ] Fail |
| 7 | Reload `http://localhost:5183/` | The footer reads `Task Notes v{version}` with no parenthesised commit and no `unknown` text | [ ] Pass [ ] Fail |
| 8 | The pending state is too brief to observe by hand: read the component test `renders no commit while the version request is pending` in `frontend/src/components/AppFooter.test.tsx` instead | The test exists and asserts that no commit is rendered while the request is pending | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run's summary reports no failed or errored test and the command exits 0 | [ ] Pass [ ] Fail |
| 10 | In its output, find the tests `renders the first 7 characters of the build commit next to the version`, `renders no commit while the version request is pending` and `renders no commit when the version request fails` | Each is listed as passed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
