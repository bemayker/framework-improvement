# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, once merged, on `main`).
- Backend on `http://localhost:8010` and frontend on `http://localhost:5183`.
- Have `backend/pyproject.toml` open so the tester can read the current `[project]` `version`. At the time of writing it is `0.1.0`; a later bump changes the expected text without changing this script.
- Frontend dependencies installed (`npm --prefix frontend install`) for steps 9 and 10.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build
   ```
2. Wait until the `db`, `backend` and `frontend` services report as started and `http://localhost:8010/api/version` answers.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The landing page with the "Task Notes" heading loads | [ ] Pass [ ] Fail |
| 2 | Scroll to the footer at the bottom of the page | The footer reads `Task Notes v0.1.0 (0123456)` (version from `backend/pyproject.toml`) | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:8010/api/version` in a second tab | The JSON shows `"commit": "0123456789ab"`; the footer shows only its first 7 characters | [ ] Pass [ ] Fail |

### Criterion 2: Pending or failed request shows the version alone, never `undefined` or an error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | On `http://localhost:5183/`, open the dev tools Network tab, right-click the `version` request, choose Block request URL, then reload | The footer reads exactly `Task Notes`: no `undefined`, no `v`, no error text | [ ] Pass [ ] Fail |
| 5 | Unblock the URL, run `docker compose stop backend` from the repository root, and reload | The footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 6 | Run `docker compose up -d --build` with `BUILD_COMMIT` unset, wait until `http://localhost:8010/api/version` answers, and reload | The footer reads `Task Notes v0.1.0` with no parentheses and no `unknown` | [ ] Pass [ ] Fail |
| 7 | Open `http://localhost:8010/api/version` | The JSON shows `"commit": "unknown"`, which the footer does not display | [ ] Pass [ ] Fail |
| 8 | In the dev tools Network tab set throttling to "Slow 3G" and reload | Until the request completes the footer reads `Task Notes` with no placeholder text | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run passes: no failed or errored test on the summary line, exit code 0 | [ ] Pass [ ] Fail |
| 10 | Read the test titles in the output | `renders the short commit next to the version`, `renders only the app name while the build info is pending` and `renders only the app name when the build info request fails` are listed as passed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
