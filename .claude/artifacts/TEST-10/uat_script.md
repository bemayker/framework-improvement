# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- From the repository root, the stack is started with `BUILD_COMMIT=0123456789abcdef docker compose up -d --force-recreate backend frontend`; the frontend is at `http://localhost:5183` and the backend at `http://localhost:8010`.
- `backend/pyproject.toml` has `version = "0.1.0"` (the expected footer version follows that field).
- Frontend dependencies installed (`npm --prefix frontend install`) for steps 9 and 10.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` in the browser | The page shows `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` and scroll to the footer | It reads `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit in parentheses | [ ] Pass [ ] Fail |
| 3 | 2 | Recreate the backend without the variable: `docker compose up -d --force-recreate backend`, then open `http://localhost:8010/api/version` | The page shows `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 4 | 2 | Reload `http://localhost:5183/` and read the footer | It reads exactly `Task Notes v0.1.0`, with no parentheses, no `unknown` and no `undefined` | [ ] Pass [ ] Fail |
| 5 | 2 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes` (TEST-08's failure state), with none of `undefined`, `null`, `unknown` or an error message, and the rest of the page still renders | [ ] Pass [ ] Fail |
| 6 | 2 | In the browser developer tools Network tab set throttling to `Slow 3G`, run `docker compose start backend`, and reload `http://localhost:5183/` | Until the `/api/version` request completes the footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 7 | 2 | Wait for the `/api/version` request to complete | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 8 | 2 | Reset throttling to `No throttling` | Throttling is off; no change to the footer | [ ] Pass [ ] Fail |
| 9 | 3 | Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` | The run lists the success-with-commit, success-without-commit, pending and failure tests and reports `0 failed` | [ ] Pass [ ] Fail |
| 10 | 3 | Run `npm --prefix frontend test` | The frontend suite, including `src/api/version.test.ts`, `src/components/AppFooter.test.tsx` and `src/components/LandingPage.test.tsx`, reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
