# UAT Script: TEST-08 Footer shows the backend app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Copy `.env.example` to `.env` in the repository root if it does not exist.
- Frontend dependencies installed (`npm --prefix frontend install`).
- `backend/pyproject.toml` reads `version = "0.1.0"` and `frontend/package.json` reads `"version": "0.0.0"` at the time of writing; the footer's expected text follows `backend/pyproject.toml`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Wait until `db`, `backend` (http://localhost:8010) and `frontend` (http://localhost:5183) are up.

## Steps

### Criterion 1: The footer renders the backend's runtime version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` in a browser | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The landing page shows the heading `Task Notes`, the note form and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 3 | Read the footer | It reads `Task Notes v0.1.0` (the backend's version), not `Task Notes v0.0.0` (the frontend's) | [ ] Pass [ ] Fail |
| 4 | Open devtools, Network tab, and reload `/` | One request to `http://localhost:8010/api/version` with status 200 | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from a single declared source

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5 | Open `frontend/src/components/AppFooter.tsx` | No version literal and no `package.json` import; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts` | [ ] Pass [ ] Fail |
| 6 | Edit `backend/pyproject.toml` to `version = "0.1.1"`, then run `docker compose up -d --build backend` (frontend untouched) | The backend restarts | [ ] Pass [ ] Fail |
| 7 | Reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.1` although the frontend was not rebuilt | [ ] Pass [ ] Fail |
| 8 | Revert `backend/pyproject.toml` to `version = "0.1.0"` and run `docker compose up -d --build backend`, then reload `/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 3: An unresolved version is omitted, never shown as undefined, null, unknown or a gap

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 9 | Run `docker compose stop backend`, then reload `http://localhost:5183/` | The footer is present and reads exactly `Task Notes`: no ` v`, no `undefined`, no `null`, no `unknown`, no trailing space or empty gap | [ ] Pass [ ] Fail |
| 10 | In devtools Network, inspect the `/api/version` request | It failed (status `(failed)` or a connection error) and the footer still reads `Task Notes` | [ ] Pass [ ] Fail |
| 11 | Run `docker compose start backend` and reload `/` | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 12 | In devtools Network set throttling to `Slow 3G` and reload `/` | While `/api/version` is pending the footer reads `Task Notes` with nothing after it, then changes to `Task Notes v0.1.0` when the response arrives. Reset throttling to `No throttling` afterwards | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | Run `npm --prefix frontend test` | The run lists `src/components/AppFooter.test.tsx` and `src/api/version.test.ts` and ends with `0 failed` | [ ] Pass [ ] Fail |
| 14 | Open `frontend/src/components/AppFooter.test.tsx` | A test where the mocked client resolves a version and the footer shows it, and tests where the client rejects or resolves `null` and the footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
