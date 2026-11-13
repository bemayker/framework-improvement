# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Stack up from the repository root: `docker compose up -d --build` (backend on http://localhost:8010, frontend on http://localhost:5183).
- `backend/pyproject.toml` declares `version = "0.1.0"` and `frontend/package.json` declares `"version": "0.0.0"`.

## Steps

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:5183/ in Chrome | Landing page shows the heading "Task Notes" and a footer at the bottom | [ ] Pass [ ] Fail |
| 2 | Read the footer text (criterion 1) | It reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | Open http://localhost:8010/api/version (criterion 2) | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 4 | Open http://localhost:5183/ with DevTools Network open, filter `version`, reload | One request to `http://localhost:8010/api/version` with status 200; footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 5 | At the repo root run `grep -n "package.json\|0.1.0" frontend/src/components/AppFooter.tsx` | No output | [ ] Pass [ ] Fail |
| 6 | In Network, right-click the `version` request, choose "Block request URL", reload (criterion 3) | Footer reads exactly `Task Notes`, with no `v`, `undefined`, `null`, `unknown` or trailing gap | [ ] Pass [ ] Fail |
| 7 | Remove the block in DevTools and reload | Footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 8 | Run `docker compose stop backend`, reload http://localhost:5183/ | Footer reads exactly `Task Notes`. Afterwards run `docker compose start backend` | [ ] Pass [ ] Fail |
| 9 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` (criterion 4) | `0 failed`; `shows the backend version once /api/version resolves` and `shows only the app name when the version request fails` listed as passed | [ ] Pass [ ] Fail |
| 10 | Open http://localhost:5183/ (criterion 5) | Footer reads `Task Notes v0.1.0` and nowhere shows `0.0.0` | [ ] Pass [ ] Fail |
| 11 | In DevTools Network set throttling to "Slow 3G" and reload | While pending the footer reads exactly `Task Notes`; once complete it reads `Task Notes v0.1.0`. Set throttling back to "No throttling" | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 11 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
