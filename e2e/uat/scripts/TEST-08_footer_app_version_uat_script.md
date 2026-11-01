# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- `.env` present in the repository root (copy `.env.example`; defaults are usable).
- Nothing else bound to ports `5183` (frontend) or `8010` (backend).
- `backend/pyproject.toml` reads `version = "0.1.0"`; `frontend/package.json` reads `"version": "0.0.0"`.

## Test Environment Setup

1. From the repository root run `docker compose up -d --build`.
2. Wait until services `db`, `backend` and `frontend` are up.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The landing page shows the heading "Task Notes", the note form and the note list | [ ] Pass [ ] Fail |
| 2 | Scroll to the bottom of the page | The footer reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, never a string typed into the component

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | In a terminal run `curl -s http://localhost:8010/api/version` | It prints `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 4 | Open `frontend/package.json` | Its `"version"` reads `0.0.0`, different from the backend's `0.1.0` | [ ] Pass [ ] Fail |
| 5 | Open `http://localhost:5183/` with developer tools on the Network tab and reload | One `GET http://localhost:8010/api/version` request answers 200, and the footer reads `Task Notes v0.1.0`, not `0.0.0` | [ ] Pass [ ] Fail |
| 6 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal and no `package.json` import; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts` | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `docker compose stop backend` | The backend stops; `curl -s http://localhost:8010/api/version` fails to connect | [ ] Pass [ ] Fail |
| 8 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`, with no ` v`, no trailing gap, and none of the words `unknown`, `undefined` or `null` | [ ] Pass [ ] Fail |
| 9 | Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0"}`, then reload the page | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths, version present and version absent

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 10 | From the repository root run `npm --prefix frontend install` then `npm --prefix frontend test` | Vitest runs `AppFooter.test.tsx`, `version.test.ts` and `LandingPage.test.tsx` among the suite, and the summary reports `0 failed` | [ ] Pass [ ] Fail |
| 11 | Open `frontend/src/components/AppFooter.test.tsx` | A test resolves a version and expects `Task Notes v{that version}`; tests where the client rejects or resolves `null` expect `Task Notes` with no `app-footer-version` element | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
