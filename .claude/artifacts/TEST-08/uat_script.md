# UAT Script: TEST-08 Footer shows the app version from the backend

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- Node dependencies installed for step 6: `npm --prefix frontend ci`.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Wait until the `db`, `backend` (port 8010) and `frontend` (port 5183) services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` in a browser tab | The page shows `{"version":"0.1.0"}` (the `version` in `backend/pyproject.toml`) | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` and scroll to the bottom | The landing page shows the "Task Notes" heading and note form, and the footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | 2 | Open `frontend/package.json` and read `version` | It reads `0.0.0` | [ ] Pass [ ] Fail |
| 4 | 2 | Open `http://localhost:5183/` with DevTools Network open, filtered on `version` | One request to `http://localhost:8010/api/version` with status 200 and body `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 5 | 2 | Read the footer | It reads `Task Notes v0.1.0`, the backend's value, not `0.0.0` | [ ] Pass [ ] Fail |
| 6 | 4 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | `0 failed`; the output lists the present-path test (`Task Notes v9.9.9`) and the absent-path test (`Task Notes` only) | [ ] Pass [ ] Fail |
| 7 | 5 | Edit `backend/pyproject.toml`, set `version = "0.2.0"` (do not commit), then run `docker compose up -d --build backend` | `http://localhost:8010/api/version` shows `{"version":"0.2.0"}` | [ ] Pass [ ] Fail |
| 8 | 5 | Reload `http://localhost:5183/` | The footer reads `Task Notes v0.2.0` while `frontend/package.json` still says `0.0.0` | [ ] Pass [ ] Fail |
| 9 | 5 | Revert `backend/pyproject.toml` to `0.1.0`, run `docker compose up -d --build backend`, and reload | The footer returns to `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 10 | 6 | In Chrome DevTools Network, set throttling to `Slow 3G`, reload `http://localhost:5183/` and watch the footer before the `/api/version` request completes | The footer reads `Task Notes` only (no "loading" text, no `unknown`) | [ ] Pass [ ] Fail |
| 11 | 6 | Wait for the request to complete | ` v0.1.0` appears after `Task Notes` in place | [ ] Pass [ ] Fail |
| 12 | 6 | Right-click the `version` request, choose `Block request URL`, and reload | The footer stays `Task Notes` only, matching the loading state | [ ] Pass [ ] Fail |
| 13 | 6 | Remove the block and set throttling back to `No throttling` | The footer shows `Task Notes v0.1.0` after a reload | [ ] Pass [ ] Fail |
| 14 | 3 | Run `docker compose stop backend`, then `curl -s http://localhost:8010/api/version` | The request fails to connect | [ ] Pass [ ] Fail |
| 15 | 3 | Reload `http://localhost:5183/` | The page still renders its heading and note form | [ ] Pass [ ] Fail |
| 16 | 3 | Read the footer | It reads exactly `Task Notes`, with no `v`, `undefined`, `null`, `unknown` and no trailing blank | [ ] Pass [ ] Fail |
| 17 | 3 | Run `docker compose start backend` and reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 17 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
