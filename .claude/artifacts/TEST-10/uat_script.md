# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- Stack started from the repository root with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build`; backend on http://localhost:8010, frontend on http://localhost:5183.
- Chrome with devtools, for the throttling steps.

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:8010/api/version | The page shows `{"version":"0.1.0","commit":"0123456789ab"}` | [ ] Pass [ ] Fail |
| 2 | Open http://localhost:5183/ | The landing page shows the "Task Notes" heading, the note form and a footer at the bottom | [ ] Pass [ ] Fail |
| 3 | Read the footer | It reads exactly `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit from step 1 in parentheses | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or when it fails, no commit and no error is shown

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | From the repository root run `docker compose up -d --build backend` with `BUILD_COMMIT` not set in your shell | http://localhost:8010/api/version shows `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 5 | Reload http://localhost:5183/ | The footer reads exactly `Task Notes v0.1.0`: no parentheses, no `unknown`, no `undefined` | [ ] Pass [ ] Fail |
| 6 | In devtools, Network tab, set throttling to "Slow 3G" and reload http://localhost:5183/ | While `/api/version` is pending the footer reads `Task Notes`, with no `undefined`, no placeholder and no error text; once the request completes it reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 7 | Reset throttling to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |
| 8 | Run `docker compose stop backend`, then hard-reload http://localhost:5183/ (Cmd+Shift+R) | The footer reads exactly `Task Notes`; the devtools Console shows no uncaught error from the footer | [ ] Pass [ ] Fail |
| 9 | Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend`, wait until http://localhost:8010/api/version answers, and reload http://localhost:5183/ | The footer reads `Task Notes v0.1.0 (0123456)` again | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` | The run passes: its summary line reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 11 | Read the run's test list | It includes `renders the short commit next to the version`, `renders exactly the app name while the version request is pending` and `renders exactly the app name when the backend is unreachable` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
