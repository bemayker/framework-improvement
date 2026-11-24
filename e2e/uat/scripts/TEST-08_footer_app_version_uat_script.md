# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- `backend/pyproject.toml` has `version = "0.1.0"` and `frontend/package.json` has `"version": "0.0.0"`. The footer's expected version is the backend's; a later bump changes the expected text without changing this script.
- Frontend dependencies installed (`npm --prefix frontend install`) for step 12.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Wait until the `db`, `backend` and `frontend` services report as started.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183/` in a browser | The landing page shows the "Task Notes" heading, the note form and the note list | [ ] Pass [ ] Fail |
| 2 | Scroll to the bottom of the page | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | Open DevTools, Network tab, reload the page | One request to `http://localhost:8010/api/version` with status 200 and response `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, not from the frontend bundle

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `frontend/package.json` and read its `version` field | `0.0.0` | [ ] Pass [ ] Fail |
| 5 | Run `curl -s http://localhost:8010/api/version` | `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 6 | Open `http://localhost:5183/` and read the footer | `Task Notes v0.1.0`, the backend's value, not `v0.0.0` | [ ] Pass [ ] Fail |
| 7 | Open `frontend/src/components/AppFooter.tsx` | It contains no `package.json` import and no version literal; the value comes from `getBackendVersion()` in `frontend/src/api/version.ts` | [ ] Pass [ ] Fail |

### Criterion 3: Pending or unresolvable version renders only the app name

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Open `http://localhost:5183/`, DevTools, Network tab, set throttling to "Slow 3G", reload | Until the `/api/version` request completes the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or trailing gap; once it completes it reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 9 | Set throttling back to "No throttling". Run `docker compose stop backend` from the repository root | The backend container stops | [ ] Pass [ ] Fail |
| 10 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`; the Network tab shows the `/api/version` request failed; the rest of the page still renders | [ ] Pass [ ] Fail |
| 11 | Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers, reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run passes: no failed or errored test on the summary line, exit code 0 | [ ] Pass [ ] Fail |
| 13 | Open `frontend/src/components/AppFooter.test.tsx` | It contains `renders the backend version once /api/version resolves` (version present) and `renders only the app name when the version request fails` (version absent) | [ ] Pass [ ] Fail |

### End-to-end spec

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 14 | From the repository root run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts e2e/tests/TEST-04_page_footer.spec.ts` | Both specs pass against the running stack | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
