# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, on `main`).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- A browser with DevTools.

## Test Environment Setup

1. From the repository root, run `BUILD_COMMIT=4f2a9c1d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f docker compose up -d --build`.
2. Wait until `http://localhost:8010/api/version` answers and all three containers are running.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` in the browser | The JSON shows `"commit": "4f2a9c1d8e7b"` and a `"version"` value (e.g. `0.1.0`) | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | The landing page loads with the footer at the bottom | [ ] Pass [ ] Fail |
| 3 | 1 | Read the footer | It reads exactly `Task Notes v0.1.0 (4f2a9c1)`: the version, then the first 7 characters of the commit in parentheses | [ ] Pass [ ] Fail |
| 4 | 2 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer reads exactly `Task Notes`: no version, no commit, no `undefined`, no error text | [ ] Pass [ ] Fail |
| 5 | 2 | With `BUILD_COMMIT` unset in the shell, run `docker compose up -d --build backend`, wait, then open `http://localhost:8010/api/version` | The JSON shows `"commit": "unknown"` | [ ] Pass [ ] Fail |
| 6 | 2 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes v0.1.0` (the version alone): no parentheses, no `unknown` | [ ] Pass [ ] Fail |
| 7 | 2 | In DevTools Network, set throttling to "Slow 3G" and reload | While `/api/version` is loading the footer reads `Task Notes` with no commit and no `undefined` | [ ] Pass [ ] Fail |
| 8 | 2 | Reset throttling to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |
| 9 | 3 | From the repo root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The output lists `renders the first 7 characters of the commit next to the version`, `renders no commit while the version request is pending` and `renders no commit when the version request fails`, and reports `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 9 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
