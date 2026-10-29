# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is).
- Backend on `http://localhost:8010`, frontend on `http://localhost:5183`.
- Frontend dependencies installed (`npm --prefix frontend install`) for step 14.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend` and `frontend` services report as started.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open `http://localhost:8010/api/version` | Shows `{"version":"0.1.0"}` (or whatever `backend/pyproject.toml` declares) | [ ] Pass [ ] Fail |
| 2 | 1 | Open `http://localhost:5183/` | Landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer | [ ] Pass [ ] Fail |
| 3 | 1 | Read the footer text | Reads `Task Notes v0.1.0`, the same version as step 1 | [ ] Pass [ ] Fail |
| 4 | 1 | Open DevTools Network and reload | One `GET http://localhost:8010/api/version` with status 200 | [ ] Pass [ ] Fail |
| 5 | 2 | Open `frontend/package.json` | `"version"` is `0.0.0` | [ ] Pass [ ] Fail |
| 6 | 2 | Open `backend/pyproject.toml` | `[project]` `version` is `0.1.0` | [ ] Pass [ ] Fail |
| 7 | 2 | Read the footer on `http://localhost:5183/` | Reads `Task Notes v0.1.0`, not `v0.0.0` | [ ] Pass [ ] Fail |
| 8 | 2 | Open `frontend/src/components/AppFooter.tsx` | No `package.json` import and no version literal; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts` | [ ] Pass [ ] Fail |
| 9 | 3 | Run `docker compose stop backend`, then open `http://localhost:5183/` | Page loads with heading and note form | [ ] Pass [ ] Fail |
| 10 | 3 | Read the footer | Reads exactly `Task Notes`: no `v`, no `unknown`, no `undefined`, no `null`, no trailing gap | [ ] Pass [ ] Fail |
| 11 | 3 | Check DevTools Network | The `GET http://localhost:8010/api/version` request failed and the page shows no error message | [ ] Pass [ ] Fail |
| 12 | 3 | Run `docker compose start backend` and reload | Footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 13 | 4 | Open `frontend/src/components/AppFooter.test.tsx` | Contains a test where the mocked client resolves a version and the footer shows it, and tests where it is pending and rejected and the footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 14 | 4 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | `0 failed` | [ ] Pass [ ] Fail |
| 15 | 5 | Open `http://localhost:5183/` | Footer reads `Task Notes v0.1.0`, never `v0.0.0` | [ ] Pass [ ] Fail |
| 16 | 5 | Edit `backend/pyproject.toml` to `version = "0.1.1"` and run `docker compose up -d --build backend` (frontend untouched) | Backend rebuilds; nothing visible changes until reload | [ ] Pass [ ] Fail |
| 17 | 5 | Reload `http://localhost:5183/` | Footer reads `Task Notes v0.1.1` although the frontend was not rebuilt | [ ] Pass [ ] Fail |
| 18 | 5 | Revert `backend/pyproject.toml` to `0.1.0`, rebuild the backend and reload | Footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 18 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
