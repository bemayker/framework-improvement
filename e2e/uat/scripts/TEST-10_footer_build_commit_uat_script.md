# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- Copy `.env.example` to `.env` in the repository root if you have not already (defaults are usable as-is).
- Frontend dependencies installed for step 8: `npm --prefix frontend ci`.

## Test Environment Setup

1. From the repository root, start the stack with a known commit: `BUILD_COMMIT=0123456789abcdef0123 docker compose up -d --build`.
2. Wait until the `db`, `backend` and `frontend` services are up. The frontend is at `http://localhost:5183` and the backend at `http://localhost:8010`. The backend version is `0.1.0` (`backend/pyproject.toml`).

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` | JSON `{"version":"0.1.0","commit":"0123456789ab"}` (12 characters, from TEST-09) | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | The landing page shows the heading "Task Notes" | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the footer at the bottom of the page | It reads exactly `Task Notes v0.1.0 (0123456)`: the version, a space, and the first 7 characters of the commit in parentheses | [ ] Pass [ ] Fail |
| 4 | 2 | Open `http://localhost:5183/`, open DevTools, Network tab, set throttling to "Slow 3G", reload and watch the footer while `/api/version` is pending | The footer reads exactly `Task Notes`, with no `undefined`, no error and no empty parentheses; when the request finishes it changes to `Task Notes v0.1.0 (0123456)`. Reset throttling to "No throttling" | [ ] Pass [ ] Fail |
| 5 | 2 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text | [ ] Pass [ ] Fail |
| 6 | 2 | Restart the backend without a commit: `docker compose up -d --build backend` (no `BUILD_COMMIT` set, so the compose default `unknown` applies). Open `http://localhost:8010/api/version` | `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 7 | 2 | Reload `http://localhost:5183/` and read the footer | It reads exactly `Task Notes v0.1.0`: the version alone, with no `(unknown)` and no empty parentheses | [ ] Pass [ ] Fail |
| 8 | 3 | From the repository root, run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed`; the AppFooter test names include a success case (version and commit), a pending case and a failure case | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
