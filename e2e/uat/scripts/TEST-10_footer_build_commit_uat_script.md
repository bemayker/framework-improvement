# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- The stack is started with a known commit from the repository root: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build`. Backend on `http://localhost:8010`, frontend on `http://localhost:5183`. `BUILD_COMMIT` is a build argument, so changing it needs a rebuild (`--build`).
- The backend shortens the commit to 12 characters (`0123456789ab`); the footer shows the first 7 (`0123456`).
- Known interaction with TEST-08: the E2E spec `e2e/tests/TEST-08_footer_app_version.spec.ts` asserts the footer text is exactly `Task Notes v{version}`, so it fails on a stack built with `BUILD_COMMIT` set (the footer then also shows the commit). It passes only on a stack built without `BUILD_COMMIT`. This is expected and is not a TEST-10 failure; TEST-08's files are not changed by this item. Step 10 returns the stack to that default.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/version` | It prints a body with `"version":"0.1.0"` and `"commit":"0123456789ab"` (note both values) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` in a browser | The landing page with the "Task Notes" heading is shown | [ ] Pass [ ] Fail |
| 3 | Scroll to the footer | It reads exactly `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit from step 1 in parentheses (criterion 1) | [ ] Pass [ ] Fail |
| 4 | In DevTools Elements, inspect the footer | A span with `data-testid="app-commit"` holds ` (0123456)`, and the span with `data-testid="app-version"` still holds exactly ` v0.1.0` (criterion 1) | [ ] Pass [ ] Fail |
| 5 | In DevTools Network set throttling to `Slow 3G` and reload `http://localhost:5183/` | While `/api/version` is in flight the footer reads exactly `Task Notes`, with no `undefined`, no `(` and no error text; once it completes it reads `Task Notes v0.1.0 (0123456)` (criterion 2) | [ ] Pass [ ] Fail |
| 6 | Set throttling back to `No throttling` | Throttling is off | [ ] Pass [ ] Fail |
| 7 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The page still renders and the footer reads exactly `Task Notes`, with no `v`, no `(`, no `undefined`, `null`, `unknown` or error text (criterion 2) | [ ] Pass [ ] Fail |
| 8 | In DevTools Network, find the `/api/version` request | It failed (connection refused) | [ ] Pass [ ] Fail |
| 9 | Run `docker compose start backend` and reload the page | The footer reads `Task Notes v0.1.0 (0123456)` again | [ ] Pass [ ] Fail |
| 10 | Run `docker compose up -d --build backend` without `BUILD_COMMIT` set, then run `curl -s http://localhost:8010/api/version` | The body shows `"commit":"unknown"` (criterion 2, edge case) | [ ] Pass [ ] Fail |
| 11 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown` (criterion 2, edge case) | [ ] Pass [ ] Fail |
| 12 | In DevTools Elements, inspect the footer | No element with `data-testid="app-commit"` exists (criterion 2, edge case) | [ ] Pass [ ] Fail |
| 13 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts src/components/LandingPage.test.tsx` | The run passes: its summary reports no failed or errored test and the command exits 0 (criterion 3) | [ ] Pass [ ] Fail |
| 14 | Open `frontend/src/components/AppFooter.test.tsx` | It contains `renders the first 7 characters of the commit next to the version`, `renders the app name without a version or commit while the request is pending` and `renders the app name without a version or commit when the request fails` (criterion 3) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
