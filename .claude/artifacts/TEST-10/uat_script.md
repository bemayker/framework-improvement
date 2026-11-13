# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT), and leave `BUILD_COMMIT` unset in `.env` and in your shell, apart from the one-off prefix in Test Environment Setup.
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- `backend/pyproject.toml` has `version = "0.1.0"`.
- No CI workflow sets `BUILD_COMMIT`. A stack started without it reports the commit `unknown`, and the footer then shows the version alone. To see a commit in the footer you must build the backend with `BUILD_COMMIT=...`, as Test Environment Setup does.
- The stack is not running yet.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 docker compose up -d --build
   ```
2. Wait until the `db`, `backend` and `frontend` services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Run `curl -s http://localhost:8010/api/version` in a terminal | The body is `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}` | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` in a browser | The landing page with the "Task Notes" heading is shown | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the footer at the bottom of the page | The footer reads `Task Notes v0.1.0 (a1b2c3d)`: seven commit characters, in parentheses after the version | [ ] Pass [ ] Fail |
| 4 | 1 | Inspect the footer in browser dev tools | The version sits in `data-testid="app-version"` and reads `v0.1.0`, the commit sits in `data-testid="app-commit"` and reads `a1b2c3d` | [ ] Pass [ ] Fail |
| 5 | 2 | In dev tools Network, set throttling to `Slow 3G`, then reload `http://localhost:5183/` and watch the footer | The footer first reads `Task Notes` alone, with no version, no commit and no placeholder | [ ] Pass [ ] Fail |
| 6 | 2 | Wait for the `version` request to finish | The footer then reads `Task Notes v0.1.0 (a1b2c3d)`; afterwards set throttling back to `No throttling` | [ ] Pass [ ] Fail |
| 7 | 2 | Run `docker compose stop backend` | The backend container stops | [ ] Pass [ ] Fail |
| 8 | 2 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text | [ ] Pass [ ] Fail |
| 9 | 2 | Run `docker compose up -d --build backend` with no `BUILD_COMMIT` set in the shell or `.env` | The backend container restarts | [ ] Pass [ ] Fail |
| 10 | 2 | Run `curl -s http://localhost:8010/api/version` | The body is `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 11 | 2 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown` | [ ] Pass [ ] Fail |
| 12 | 3 | Run `npm --prefix frontend test` from the repository root | The suite reports `0 failed`, including `AppFooter.test.tsx`, `version.test.ts` and `LandingPage.test.tsx` | [ ] Pass [ ] Fail |
| 13 | 3 | Read `frontend/src/components/AppFooter.test.tsx` | It contains `renders the first 7 characters of the build commit next to the version` (success), `renders no commit while the request is pending` (pending) and `renders no commit and no error when the request fails` (failure) | [ ] Pass [ ] Fail |
| 14 | Edge | From the repository root, run `npx playwright test e2e/tests/TEST-10_footer_build_commit.spec.ts` | `0 failed`, including the 7-character commit spec and the `unknown`-commit spec | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
