# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, on `main`).
- Copy `.env.example` to `.env` in the repository root if it is not there yet.
- Frontend reachable at `http://localhost:5183`, backend at `http://localhost:8010`.
- `frontend/package.json` declares `"version": "0.0.0"` and `backend/pyproject.toml` declares `version = "0.1.0"`, so the two differ. Read both before starting; the expected footer text is the backend's value.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend` and `frontend` services report as started.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` | The page shows `{"version":"0.1.0"}` (the `[project].version` of `backend/pyproject.toml`) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading | [ ] Pass [ ] Fail |
| 3 | Scroll to the bottom and read the footer | It reads `Task Notes v0.1.0`, matching step 1 | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `http://localhost:5183/` and read the footer | It reads `Task Notes v0.1.0`, the backend's version, and not `v0.0.0` | [ ] Pass [ ] Fail |
| 5 | Open dev tools, Network tab, reload the page | One request to `http://localhost:8010/api/version` appears with status 200 and response `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 6 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal and no import of `package.json` | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Stop only the backend: `docker compose stop backend` | `http://localhost:8010/api/version` no longer answers | [ ] Pass [ ] Fail |
| 8 | Reload `http://localhost:5183/` and read the footer | It reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap | [ ] Pass [ ] Fail |
| 9 | Run `docker compose start backend`, wait until `/api/version` answers, reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed` | [ ] Pass [ ] Fail |
| 11 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a test where the version client resolves and the footer shows it, and a test where the client rejects or returns null and the footer shows `Task Notes` with no version | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
