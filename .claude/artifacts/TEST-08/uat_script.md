# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is).
- Frontend on http://localhost:5183 and backend on http://localhost:8010 are free.
- Chrome with DevTools available.

## Test Environment Setup

1. From the repository root, run `docker compose up -d --build`.
2. Wait until `curl -s http://localhost:8010/api/version` answers.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `curl -s http://localhost:8010/api/version` | Output is `{"version":"0.1.0"}` (or the current `[project].version` of `backend/pyproject.toml`); note the value | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` in a browser | The "Task Notes" heading and the note form are shown | [ ] Pass [ ] Fail |
| 3 | Scroll to the bottom and read the footer | It reads `Task Notes v0.1.0`, the version equal to the value noted in step 1 | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend's GET /api/version at runtime

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open DevTools, Network tab, reload `http://localhost:5183/` | A request to `http://localhost:8010/api/version` appears with status 200 | [ ] Pass [ ] Fail |
| 5 | Open that request's Response tab | It shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 6 | Compare to the footer | The footer's version is the same string as the response's `version` | [ ] Pass [ ] Fail |
| 7 | Open `frontend/src/components/AppFooter.tsx` | It has no version literal and no `package.json` import; the version comes from `getVersion()` | [ ] Pass [ ] Fail |

### Criterion 3: An unresolved version renders the footer without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Run `docker compose stop backend` | The backend stops; `curl -s http://localhost:8010/api/version` fails to connect | [ ] Pass [ ] Fail |
| 9 | Reload `http://localhost:5183/` and read the footer | It reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend`, wait until the curl answers, reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run passes with no failed or errored test and exits 0 | [ ] Pass [ ] Fail |
| 12 | Open `frontend/src/components/AppFooter.test.tsx` | It contains `renders the version the backend reports` (present) and `renders only the app name when the version request fails` (absent) | [ ] Pass [ ] Fail |

### Criterion 5: The backend's version wins over the frontend's own

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Open `frontend/package.json` and read `version` | It is `0.0.0` at the time of writing | [ ] Pass [ ] Fail |
| 14 | Run `curl -s http://localhost:8010/api/version` | It reports `0.1.0`, a different value | [ ] Pass [ ] Fail |
| 15 | Open `http://localhost:5183/` and read the footer | It reads `Task Notes v0.1.0`, and `0.0.0` appears nowhere in it | [ ] Pass [ ] Fail |

### Criterion 6: Before the version request resolves, the footer reads `Task Notes`

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 16 | In DevTools Network tab set throttling to `Slow 3G`, reload `http://localhost:5183/` | The page renders progressively | [ ] Pass [ ] Fail |
| 17 | Watch the footer while `/api/version` is pending | It reads exactly `Task Notes`, with no placeholder such as "loading" | [ ] Pass [ ] Fail |
| 18 | Wait for the request to complete | The footer changes to `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 19 | Set throttling back to `No throttling` | Throttling is off | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 19 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
