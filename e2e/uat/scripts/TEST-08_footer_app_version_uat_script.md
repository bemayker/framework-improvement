# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- `backend/pyproject.toml` reads `version = "0.1.0"` and `frontend/package.json` reads `"version": "0.0.0"`, so the two differ. The expected footer version is the backend's, not this document's.
- Chrome or Edge, for the DevTools network blocking and throttling steps.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d
   ```
2. Wait until the `db`, `backend`, and `frontend` services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` in a browser tab | The page shows `{"version":"0.1.0"}` (or whatever `backend/pyproject.toml` declares) | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | The landing page shows the "Task Notes" heading and, at the bottom, a footer | [ ] Pass [ ] Fail |
| 3 | 1 | Read the footer text | It reads exactly `Task Notes v0.1.0`, the same version step 1 returned | [ ] Pass [ ] Fail |
| 4 | 2 | Read the footer again | It reads `Task Notes v0.1.0`, the backend's version, not `v0.0.0` | [ ] Pass [ ] Fail |
| 5 | 2 | Open DevTools, Network tab, and reload `http://localhost:5183/` | A GET request to `http://localhost:8010/api/version` appears with status 200 and response `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 6 | 2 | Search `frontend/src/components/AppFooter.tsx` for `package.json` and for `0.1.0` | Neither appears; the version comes only from the request in step 5 | [ ] Pass [ ] Fail |
| 7 | 3 | In DevTools open the Network request blocking panel (Command menu, "Show Network request blocking"), enable blocking and add the pattern `*/api/version` | The pattern is listed and blocking is enabled | [ ] Pass [ ] Fail |
| 8 | 3 | Reload `http://localhost:5183/` | The request to `/api/version` shows as blocked in the Network tab | [ ] Pass [ ] Fail |
| 9 | 3 | Read the footer | It reads exactly `Task Notes`, with no `v`, no trailing space, and no `undefined`, `null` or `unknown` | [ ] Pass [ ] Fail |
| 10 | 3 | Remove the blocking pattern and reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 11 | 4 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run passes: no failed test and the command exits 0 | [ ] Pass [ ] Fail |
| 12 | 4 | In the output, find `renders the version returned by the backend, not the frontend package version` and `renders without a version when the version request fails` | Both are listed as passed | [ ] Pass [ ] Fail |
| 13 | 5 | In DevTools, Network tab, set throttling to a custom profile with 5000 ms latency (or "Slow 3G") | The throttling profile is active | [ ] Pass [ ] Fail |
| 14 | 5 | Reload `http://localhost:5183/` and read the footer while the `/api/version` request is still pending | It reads exactly `Task Notes`, with no placeholder, spinner, `v` or `unknown` | [ ] Pass [ ] Fail |
| 15 | 5 | Wait for the request to finish | The footer changes to `Task Notes v0.1.0` without the page layout jumping | [ ] Pass [ ] Fail |
| 16 | 5 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | The run passes, including `shows only the app name while the version request is pending` | [ ] Pass [ ] Fail |
| 17 | Edge | Stop the backend with `docker compose stop backend` and reload `http://localhost:5183/` | The footer is still present and reads exactly `Task Notes`; the rest of the page is unaffected | [ ] Pass [ ] Fail |
| 18 | Edge | Restart the backend with `docker compose start backend` and reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 18 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
