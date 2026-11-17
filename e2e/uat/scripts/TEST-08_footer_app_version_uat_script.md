# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Backend on `http://localhost:8010` and frontend on `http://localhost:5183`.
- Have `backend/pyproject.toml` open so the tester can read the current `[project]` `version`. At the time of writing it is `0.1.0`; a later bump changes the expected text without changing this script.
- Frontend dependencies installed (`npm --prefix frontend install`) for steps 12 and 13.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d
   ```
2. Wait until the `db`, `backend` and `frontend` services report as started and `http://localhost:8010/api/version` answers.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The landing page shows the heading "Task Notes" and the note form | [ ] Pass [ ] Fail |
| 2 | Scroll to the bottom of the page | The footer reads `Task Notes v0.1.0` (the version from `backend/pyproject.toml`), in small grey text | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Open `http://localhost:8010/api/version` in a browser tab | The JSON `{"version":"0.1.0"}` is shown | [ ] Pass [ ] Fail |
| 4 | Open `frontend/package.json` and read its `version` field | It reads `0.0.0`, which differs from the backend's | [ ] Pass [ ] Fail |
| 5 | Open `http://localhost:5183/` and read the footer | It reads `Task Notes v0.1.0`, the backend's version, not `0.0.0` | [ ] Pass [ ] Fail |
| 6 | Open the browser dev tools, Network tab, and reload the page | A GET request to `http://localhost:8010/api/version` is listed with status 200 | [ ] Pass [ ] Fail |
| 7 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal and no import of `package.json` | [ ] Pass [ ] Fail |

### Criterion 3: An unresolved version renders the name only

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | With the page open, run `docker compose stop backend` from the repository root | The command reports the backend container stopped | [ ] Pass [ ] Fail |
| 9 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`: no `v`, no `undefined`, `null` or `unknown`, and no trailing gap after the name | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, and reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 11 | In the dev tools Network tab set throttling to "Slow 3G" and reload | Until the `/api/version` request completes the footer reads `Task Notes`, then changes to `Task Notes v0.1.0` with no intermediate placeholder text | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run passes: its summary reports no failed or errored test, and the command exits 0 | [ ] Pass [ ] Fail |
| 13 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a test named `renders the version returned by the backend client` (version present) and one named `renders only the app name when the version cannot be resolved` (version absent) | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
