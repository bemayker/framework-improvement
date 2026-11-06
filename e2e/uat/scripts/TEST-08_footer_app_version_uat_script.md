# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, `main`).
- Stack running from the repo root with `docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010).
- Frontend dependencies installed (`npm --prefix frontend install`) for step 14.

## Steps

| # | Criterion | Step | Expected Result | Pass/Fail |
|---|-----------|------|-----------------|-----------|
| 1 | 1 | Open http://localhost:8010/api/version in a browser tab | JSON with `"version": "0.1.0"` (the `[project].version` of `backend/pyproject.toml`); note the value | [ ] Pass [ ] Fail |
| 2 | 1 | Open http://localhost:5183/ | The landing page shows the `Task Notes` heading, the note form and the note list | [ ] Pass [ ] Fail |
| 3 | 1 | Scroll to the bottom and read the footer | It reads `Task Notes v0.1.0`, the same version as step 1 | [ ] Pass [ ] Fail |
| 4 | 2 | Open `frontend/package.json` | Its `version` field reads `0.0.0` | [ ] Pass [ ] Fail |
| 5 | 2 | Read the footer on http://localhost:5183/ | It reads `Task Notes v0.1.0`, the backend's value, not `0.0.0` | [ ] Pass [ ] Fail |
| 6 | 2 | In DevTools, Network tab, reload the page | A GET to `http://localhost:8010/api/version` appears with status 200 and body `"version": "0.1.0"` | [ ] Pass [ ] Fail |
| 7 | 2 | Open `frontend/src/components/AppFooter.tsx` | It contains no version literal and no `package.json` import | [ ] Pass [ ] Fail |
| 8 | 3 | Run `docker compose stop backend` from the repo root | The backend container stops | [ ] Pass [ ] Fail |
| 9 | 3 | Hard-reload http://localhost:5183/ | The heading and note form still render | [ ] Pass [ ] Fail |
| 10 | 3 | Read the footer | It reads exactly `Task Notes`: no `v`, `undefined`, `null`, `unknown` or trailing gap | [ ] Pass [ ] Fail |
| 11 | 3 | Run `docker compose start backend`, wait for `/api/version` to answer, reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 12 | 5 | In Chrome DevTools, Network tab, block the request URL pattern `*/api/version` and reload | The footer reads exactly `Task Notes` (the request never succeeds, the same rendering as the pending state) | [ ] Pass [ ] Fail |
| 13 | 5 | Untick request blocking and reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 14 | 4, 5 | Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` from the repo root | The version-present and version-absent (rejected, `null`, sentinel, loading) tests are listed and 0 failed; the loading test holds the pending state of criterion 5 | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
