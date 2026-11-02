# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Frontend dependencies installed (`npm --prefix frontend ci`) for steps 9 and 10.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   BUILD_COMMIT=abc1234def5678 docker compose up -d --build
   ```
2. Wait until the `db`, `backend` and `frontend` services are all up.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser (criterion 1) | The page shows `{"version":"0.1.0","commit":"abc1234def56"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page shows the heading "Task Notes" | [ ] Pass [ ] Fail |
| 3 | Scroll to the bottom of the page and read the footer | The footer reads exactly `Task Notes v0.1.0 (abc1234)`: seven commit characters, in parentheses, after the version | [ ] Pass [ ] Fail |
| 4 | Run `docker compose up -d --build backend` without `BUILD_COMMIT` set, then open `http://localhost:8010/api/version` (criterion 2) | The page shows `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 5 | Reload `http://localhost:5183/` and read the footer | The footer reads exactly `Task Notes v0.1.0`: no parentheses, no `unknown`, no `undefined` | [ ] Pass [ ] Fail |
| 6 | Open dev tools, Network tab, set throttling to "Offline" and reload the page | The footer reads exactly `Task Notes`, with no error text, no `undefined` and no empty parentheses | [ ] Pass [ ] Fail |
| 7 | Set throttling back to "No throttling", run `docker compose stop backend`, reload the page | The footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 8 | Run `docker compose start backend` and reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 9 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` (criterion 3) | The run lists the success-with-commit, pending and failure tests and reports `0 failed` | [ ] Pass [ ] Fail |
| 10 | Run `npm --prefix frontend test -- src/api/version.test.ts src/components/LandingPage.test.tsx` | `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
