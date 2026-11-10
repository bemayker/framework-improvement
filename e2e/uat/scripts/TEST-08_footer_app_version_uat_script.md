# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- The stack is running from the repository root with `docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010).
- `backend/pyproject.toml` `[project].version` reads `0.1.0`; `frontend/package.json` `version` reads `0.0.0`.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|------------------|-----------|
| 1 | 1 | Open `http://localhost:5183/` in a browser | The "Task Notes" heading, the note form and the footer are visible | [ ] Pass [ ] Fail |
| 2 | 1 | Read the footer at the bottom of the page | It reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3 | 2 | Run `curl -s http://localhost:8010/api/version` | It prints `{"version":"0.1.0"}` (possibly with extra fields if TEST-09 has merged) | [ ] Pass [ ] Fail |
| 4 | 2 | Open `frontend/package.json` and read its `version` | It reads `0.0.0` | [ ] Pass [ ] Fail |
| 5 | 2 | Reload the page and read the footer | It reads `Task Notes v0.1.0` and does not contain `0.0.0` | [ ] Pass [ ] Fail |
| 6 | 2 | Open DevTools, Network, reload, select the `version` request | A GET to `http://localhost:8010/api/version`, status 200, made at page load | [ ] Pass [ ] Fail |
| 7 | 3 | Run `docker compose stop backend` | The backend container stops | [ ] Pass [ ] Fail |
| 8 | 3 | Reload the page and read the footer | It reads exactly `Task Notes`: no `v`, `undefined`, `null`, `unknown` or trailing gap | [ ] Pass [ ] Fail |
| 9 | 3 | Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers, reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 10 | 4 | In DevTools, Network, set throttling to `Slow 3G` and reload | While the `version` request is pending the footer reads exactly `Task Notes`, with no "Loading", spinner or `v` | [ ] Pass [ ] Fail |
| 11 | 4 | Wait for the `version` request to finish, then set throttling back to `No throttling` | The footer changes to `Task Notes v0.1.0` with no other text or layout change | [ ] Pass [ ] Fail |
| 12 | 5 | Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed` | [ ] Pass [ ] Fail |
| 13 | 5 | Open `frontend/src/components/AppFooter.test.tsx` | A test asserts `Task Notes v9.9.9` for a resolved version and another asserts exactly `Task Notes` for a rejected request | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
