# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- From the repository root, start the stack with a known commit: `BUILD_COMMIT=0123456789abcdef docker compose up -d --build`. The backend answers on `http://localhost:8010` and the frontend on `http://localhost:5183`.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser tab | It shows `{"version":"0.1.0","commit":"0123456789ab"}` (12 characters of the commit) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading, the note form and the footer at the bottom | [ ] Pass [ ] Fail |
| 3 | Read the footer text | It reads exactly `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit from step 1 in parentheses | [ ] Pass [ ] Fail |
| 4 | Restart the backend without a commit (`docker compose up -d --build backend` with `BUILD_COMMIT` unset) and reload `http://localhost:5183/` | `/api/version` reports `"commit":"unknown"` and the footer reads exactly `Task Notes v0.1.0`, with no `unknown` and no empty parentheses | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone

Restart the stack with `BUILD_COMMIT=0123456789abcdef` before these steps.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Open `http://localhost:5183/`, open the browser developer tools Network tab, set throttling to "Slow 3G" and reload | While `/api/version` is pending the footer reads exactly `Task Notes`; when it completes it changes to `Task Notes v0.1.0 (0123456)` | [ ] Pass [ ] Fail |
| 6 | Stop the backend (`docker compose stop backend`) and reload `http://localhost:5183/` | The page renders and the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown`, error text or parentheses | [ ] Pass [ ] Fail |
| 7 | Start the backend again (`docker compose start backend`) and reload | The footer reads `Task Notes v0.1.0 (0123456)` again | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts src/components/LandingPage.test.tsx` | The run reports `0 failed`; the AppFooter test names include a success case with a commit, a pending case and a rejected-fetch case | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
