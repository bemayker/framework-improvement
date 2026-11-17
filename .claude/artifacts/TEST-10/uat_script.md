# UAT Script: TEST-10 Footer shows the build commit next to the version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, once merged, on `main`).
- Node.js available for `npm --prefix frontend` commands.
- The backend started with `BUILD_COMMIT=abc1234def5678` in its environment (for example in `.env` or the compose service's environment).
- No other process bound to the frontend port `5183` or the backend port `8010`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` and wait until `db`, `backend` and `frontend` show as running.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/version` (criterion 1) | The body shows `"commit":"abc1234def56"` and a `"version"` value, e.g. `0.1.0` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page titled "Task Notes" loads | [ ] Pass [ ] Fail |
| 3 | Read the footer at the bottom of the page | It reads `Task Notes v0.1.0 (abc1234)`: the version from step 1, then the first 7 characters of the commit in parentheses | [ ] Pass [ ] Fail |
| 4 | Open the browser developer tools, Network tab, block the request URL `*/api/version` (right-click the request, Block request URL), then reload (criterion 2) | The footer reads exactly `Task Notes`: no version, no commit, no `undefined`, no error text | [ ] Pass [ ] Fail |
| 5 | Unblock the URL, run `docker compose stop backend`, and reload the page | The footer again reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 6 | Restart the backend without `BUILD_COMMIT` set (so `/api/version` returns `"commit":"unknown"`) and reload the page | The footer reads `Task Notes v0.1.0` (the version alone), with no `(unknown)` | [ ] Pass [ ] Fail |
| 7 | Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` (criterion 3) | The run passes: no failed or errored test and exit code 0 | [ ] Pass [ ] Fail |
| 8 | Read the test titles in the output | They include `renders the version and the short commit once the fetch resolves`, `renders no commit while the version request is pending` and `renders no commit when the version request fails` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
