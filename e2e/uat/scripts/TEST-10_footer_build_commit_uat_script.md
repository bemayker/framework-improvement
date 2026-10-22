# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, on `main`).
- Copy `.env.example` to `.env` in the repository root if you have not already.
- Ports `5183` (frontend) and `8010` (backend) are free.
- Open `backend/pyproject.toml` and note `[project].version` (`0.1.0` at the time of writing; use whatever it reads now).
- Frontend dependencies installed for steps 9 and 10 (`npm --prefix frontend install`).

## Test Environment Setup

1. Add the line `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567` to `.env` at the repository root.
2. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
3. Wait until the `db`, `backend` and `frontend` services are started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` in the browser | The page shows `{"version":"0.1.0","commit":"0123456789ab"}` (the version is the backend version you noted) | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` and read the footer at the bottom of the page | It reads `Task Notes v0.1.0 (0123456)`: the version, then exactly the first 7 characters of the commit in parentheses | [ ] Pass [ ] Fail |
| 3 | 2 | Remove the `BUILD_COMMIT` line from `.env`, run `docker compose up -d --build backend`, then open `http://localhost:8010/api/version` | The page shows `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 4 | 2 | Reload `http://localhost:5183/` and read the footer | It reads exactly `Task Notes v0.1.0`, with no `(unknown)`, no `()` and no `undefined` | [ ] Pass [ ] Fail |
| 5 | 2 | In Chrome DevTools, Network tab, set throttling to `Slow 3G` and reload `http://localhost:5183/` while watching the footer | While the `version` request is pending the footer reads exactly `Task Notes`; once it completes it reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 6 | 2 | Run `docker compose stop backend`, then reload `http://localhost:5183/` and read the footer | It reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text | [ ] Pass [ ] Fail |
| 7 | 2 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 8 | 1, 2 | From the repository root run the E2E specs for this feature (`npx playwright test e2e/tests/TEST-10_footer_build_commit.spec.ts`) | The run reports `0 failed`, and lists `shows the 7-character commit next to the version` and `shows the version alone when the commit is unknown` | [ ] Pass [ ] Fail |
| 9 | 3 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run reports `0 failed` | [ ] Pass [ ] Fail |
| 10 | 3 | Read the test list from the step 9 run | It includes a success test (`renders the application name, the version and the 7-character commit the client returned`), a pending test (`renders exactly the app name while the version is still loading`), a failure test (`renders exactly the app name when the version request rejects`) and a version-without-commit test (`renders the version alone when the client resolves no commit`) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
