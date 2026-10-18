# UAT Script: TEST-08 Footer shows the app version reported by the backend

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Stack running from the repository root with `docker compose up --build`: frontend on http://localhost:5183, backend on http://localhost:8010.
- `backend/pyproject.toml` declares a version (0.1.0 at the time of writing) and `frontend/package.json` declares a different one (0.0.0 at the time of writing). The footer's expected text comes from the backend file, not from this document.
- For criterion 4: frontend dependencies installed (`npm --prefix frontend install`).

## Steps

### Criterion 1: The footer renders the backend version on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:8010/api/version in a browser tab | The JSON body shows a `version` field equal to the version in `backend/pyproject.toml` (0.1.0) | [ ] Pass [ ] Fail |
| 2 | Open http://localhost:5183/ in another tab | The landing page loads and shows the heading "Task Notes" | [ ] Pass [ ] Fail |
| 3 | Scroll to the bottom of the page and read the footer | The footer reads "Task Notes v0.1.0" | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, not from the frontend

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `frontend/package.json` and read its `version` field | It reads 0.0.0, different from the backend version | [ ] Pass [ ] Fail |
| 5 | Open http://localhost:5183/ and read the footer | The footer reads "Task Notes v0.1.0" (the backend version) and not "v0.0.0" | [ ] Pass [ ] Fail |
| 6 | Open the browser developer tools, Network tab, and reload http://localhost:5183/ | A GET request to http://localhost:8010/api/version appears with status 200 | [ ] Pass [ ] Fail |
| 7 | Open `frontend/src/components/AppFooter.tsx` and search for "0.1.0" and for "package.json" | Neither appears in the file | [ ] Pass [ ] Fail |

### Criterion 3: Before resolution and when unresolvable, the footer shows the app name alone

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | Stop the backend only: `docker compose stop backend` (the frontend container keeps running) | The backend container stops | [ ] Pass [ ] Fail |
| 9 | Hard reload http://localhost:5183/ | The page loads with the heading "Task Notes" | [ ] Pass [ ] Fail |
| 10 | Read the footer | It reads exactly "Task Notes", with no "v", no trailing gap, and none of the words unknown, undefined or null | [ ] Pass [ ] Fail |
| 11 | Restart the backend with `docker compose start backend`, wait until http://localhost:8010/api/version answers, then reload http://localhost:5183/ | The footer reads "Task Notes v0.1.0" again | [ ] Pass [ ] Fail |
| 12 | In developer tools, Network tab, set throttling to Slow 3G and reload http://localhost:5183/ | Until the /api/version request completes the footer reads exactly "Task Notes"; when it completes, " v0.1.0" appears after it | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 13 | From the repository root, run `npm --prefix frontend test` | The run includes `src/components/AppFooter.test.tsx` and `src/api/version.test.ts` and reports 0 failed | [ ] Pass [ ] Fail |
| 14 | Open `frontend/src/components/AppFooter.test.tsx` | It contains a test where the mocked client resolves a version and the footer shows it, and tests where the client resolves null or rejects and the footer reads exactly "Task Notes" | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
