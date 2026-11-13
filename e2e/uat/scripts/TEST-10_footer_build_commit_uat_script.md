# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running; ports 8010 and 5183 free.
- Repository checked out locally on branch `feature/TEST-10-footer-build-commit` (or `main` once merged).
- Frontend on http://localhost:5183, backend on http://localhost:8010 (from the repository root).
- `backend/pyproject.toml` declares `version = "0.1.0"`.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Run `docker compose down`, then `docker compose build --build-arg BUILD_COMMIT=62be9fd76e4beeb5ec93d5fd3e9da1a35242d049 backend`, then `docker compose up -d --build` (criterion 1) | All services start; `docker compose ps` shows backend and frontend running | [ ] Pass [ ] Fail |
| 2 | Open http://localhost:8010/api/version | The body reads `{"version":"0.1.0","commit":"62be9fd76e4b"}` | [ ] Pass [ ] Fail |
| 3 | Open http://localhost:5183/ and read the footer | It reads exactly `Task Notes v0.1.0 (62be9fd)`: seven commit characters, after the version, in parentheses | [ ] Pass [ ] Fail |
| 4 | Open http://localhost:5183/ with DevTools Network open, throttling set to "Slow 3G", and reload (criterion 2) | While the `version` request is pending the footer reads exactly `Task Notes`; once it completes it reads `Task Notes v0.1.0 (62be9fd)`. Set throttling back to "No throttling" | [ ] Pass [ ] Fail |
| 5 | In Network, right-click the `version` request, choose "Block request URL", and reload | Footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown`, `()` or error text; the rest of the page works. Remove the block afterwards | [ ] Pass [ ] Fail |
| 6 | Run `docker compose down`, then `docker compose build backend` with no build arg and no `BUILD_COMMIT` in `.env`, then `docker compose up -d`, then open http://localhost:8010/api/version | The body reads `{"version":"0.1.0","commit":"unknown"}` | [ ] Pass [ ] Fail |
| 7 | Reload http://localhost:5183/ | Footer reads exactly `Task Notes v0.1.0`: the version alone, no `unknown`, no empty parentheses, no trailing space | [ ] Pass [ ] Fail |
| 8 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` (criterion 3) | `0 failed`; `shows the version and the first 7 characters of the commit once /api/version resolves`, `shows only the app name while the version request is pending` and `shows only the app name when the version request fails` listed as passed | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 8 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
