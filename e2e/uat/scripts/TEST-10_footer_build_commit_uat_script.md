# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is).
- Backend on `http://localhost:8010`, frontend on `http://localhost:5183`.
- Frontend dependencies installed (`npm --prefix frontend install`) for steps 9 to 11.

## Test Environment Setup

1. From the repository root, export a known commit in your shell:
   ```bash
   export BUILD_COMMIT=4f2a9c1e8b7d6a5f3e2d1c0b9a8f7e6d5c4b3a21
   ```
2. Start the stack:
   ```bash
   docker compose up -d --build
   ```
3. Wait until the `db`, `backend` and `frontend` services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` | JSON shows `"commit": "4f2a9c1e8b7d"` and a `"version"` value (for example `0.1.0`); note the version | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | Landing page loads with the "Task Notes" heading | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the footer and read it | Reads `Task Notes v0.1.0 (4f2a9c1)`: the version from step 1 and exactly 7 commit characters in parentheses | [ ] Pass [ ] Fail |
| 4 | 2 | Run `docker compose stop backend` | The backend container stops | [ ] Pass [ ] Fail |
| 5 | 2 | Reload `http://localhost:5183/` and read the footer | Reads exactly `Task Notes`: no version, no parentheses, no `undefined`, `null`, `unknown` or error text; the rest of the page renders | [ ] Pass [ ] Fail |
| 6 | 2 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` | Footer reads `Task Notes v0.1.0 (4f2a9c1)` again | [ ] Pass [ ] Fail |
| 7 | 2 | The pending state is too brief to observe by hand; it is verified by the component test (see step 11) | n/a, covered by step 11 | [ ] Pass [ ] Fail |
| 8 | 3 | Open `frontend/src/components/AppFooter.test.tsx` | Contains one test each for success (version and 7-character commit shown), pending (footer reads `Task Notes`) and failure (footer reads `Task Notes`, no `undefined`) | [ ] Pass [ ] Fail |
| 9 | 3 | Run `npm --prefix frontend test -- AppFooter` | The `AppFooter.test.tsx` tests run and report `0 failed` | [ ] Pass [ ] Fail |
| 10 | Edge | In DevTools, override the `GET /api/version` response (or serve a backend whose response has no `commit`) so it returns `{"version":"2.0.0"}`, then reload | Footer reads `Task Notes v2.0.0`, with no `()` and no `undefined` | [ ] Pass [ ] Fail |
| 11 | 3 | Run `npm --prefix frontend test -- AppFooter version` | Pending, failure, success and missing-commit cases all pass with `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
