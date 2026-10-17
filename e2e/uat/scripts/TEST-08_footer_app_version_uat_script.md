# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Copy `.env.example` to `.env` in the repository root if it does not exist (defaults are usable as-is).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Note the `version` line under `[project]` in `backend/pyproject.toml` (written `0.1.0` here; use whatever value it holds, the expected footer text follows it) and the `version` in `frontend/package.json` (`0.0.0` at the time of writing).
- Frontend dependencies installed for the test steps (`npm --prefix frontend install`).

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Wait until the `db`, `backend` and `frontend` services are up.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open `http://localhost:8010/api/version` in the browser | The JSON shows `version` equal to the backend version (a `commit` field may also appear; ignore it) | [ ] Pass [ ] Fail |
| 1.2 | Open `http://localhost:5183/` | The landing page shows the `Task Notes` heading, the note form and the note list | [ ] Pass [ ] Fail |
| 1.3 | Scroll to the bottom and read the footer (`data-testid="app-footer"`) | It reads `Task Notes v0.1.0`, the same version as step 1.1 | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, not from frontend/package.json

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Open `http://localhost:5183/` and read the footer | It shows the backend version (`v0.1.0`), not the frontend package version (`v0.0.0`) | [ ] Pass [ ] Fail |
| 2.2 | Open developer tools, Network tab, and reload | One request to `http://localhost:8010/api/version` returns 200; the footer version matches its `version` field | [ ] Pass [ ] Fail |
| 2.3 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal and no `package.json` import; the version comes from `fetchAppVersion` in `frontend/src/api/version.ts` | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | From the repository root, run `docker compose stop backend` | The backend container stops; `http://localhost:8010/api/version` no longer answers | [ ] Pass [ ] Fail |
| 3.2 | Reload `http://localhost:5183/` | The footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap | [ ] Pass [ ] Fail |
| 3.3 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths, version present and version absent

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | `0 failed`; the AppFooter file lists a version-present test and version-absent tests (rejected request, null result, loading) | [ ] Pass [ ] Fail |
| 4.2 | Open `frontend/src/components/AppFooter.test.tsx` | One test asserts the footer shows the mocked version; at least one asserts the footer text is exactly `Task Notes` with no `app-version` element | [ ] Pass [ ] Fail |

### Criterion 5: Loading and failure states show the app name alone

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 5.1 | Open `http://localhost:5183/` with developer tools open, Network tab, throttling set to `Slow 3G`, and reload | While the `/api/version` request is pending the footer already reads `Task Notes` (never blank, never `unknown`); when it completes it changes to `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 5.2 | In the Network tab, right-click the `/api/version` request, choose `Block request URL`, and reload | The footer reads `Task Notes` and stays that way | [ ] Pass [ ] Fail |
| 5.3 | Unblock the URL, reset throttling to `No throttling`, and reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Automated check

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 6.1 | From the repository root, run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts e2e/tests/TEST-04_page_footer.spec.ts` | `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 15 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
