# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, `main`).
- The stack is running from the repository root with `docker compose up -d --build` (backend on http://localhost:8010, frontend on http://localhost:5183).
- `backend/pyproject.toml` has `version = "0.1.0"` under `[project]`, and `frontend/package.json` has `"version": "0.0.0"`, so the two sources differ.
- Chrome, for the DevTools steps.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:8010/api/version in the browser | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | Open http://localhost:5183/ | The landing page shows the heading "Task Notes" and the note form | [ ] Pass [ ] Fail |
| 3 | Scroll to the bottom of the page and read the footer | It reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, not from the frontend package

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open http://localhost:5183/ and read the footer | It reads `Task Notes v0.1.0`, the backend's version, and does not contain `0.0.0` | [ ] Pass [ ] Fail |
| 5 | Open DevTools, Network, reload the page, filter on `version` | One `GET http://localhost:8010/api/version` request with status 200 and response `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 6 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal and no `package.json` import; the version comes from `getBackendVersion()` | [ ] Pass [ ] Fail |

### Criterion 3: The footer renders without the version when it cannot be resolved

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Open http://localhost:5183/, open DevTools, Network, reload, right-click the `version` request and choose "Block request URL" | The URL `http://localhost:8010/api/version` appears under Network request blocking | [ ] Pass [ ] Fail |
| 8 | Reload the page | The footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap after the name | [ ] Pass [ ] Fail |
| 9 | In DevTools Network conditions, set throttling to "Slow 3G", unblock the URL and reload | While the request is pending the footer reads `Task Notes`; when it completes it reads `Task Notes v0.1.0` without the footer changing position | [ ] Pass [ ] Fail |
| 10 | Remove the request block and reset throttling to "No throttling" | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `npm --prefix frontend install`, then `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The tests "renders the version returned by the backend rather than the frontend package version" and "renders only the app name when the version request fails" are listed, with `0 failed` | [ ] Pass [ ] Fail |
| 12 | Run `npm --prefix frontend test -- src/api/version.test.ts src/components/LandingPage.test.tsx src/api/notes.test.ts` | `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 12 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
