# UAT Script: TEST-08 Footer shows the app version from the backend

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Stack started from the repository root with `docker compose up -d --build`; frontend on `http://localhost:5183`, backend on `http://localhost:8010`.
- `frontend/package.json` `version` and `backend/pyproject.toml` `version` differ (at the time of writing `0.0.0` and `0.1.0`), which is what makes Criterion 2 meaningful.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:8010/api/version` and note the `version` | The page shows `{"version":"0.1.0"}` (or the `version` in `backend/pyproject.toml`) | [ ] Pass [ ] Fail |
| 2 | Open `http://localhost:5183/` | The "Task Notes" heading, the note form and a footer at the bottom are shown | [ ] Pass [ ] Fail |
| 3 | Read the footer text | It reads exactly `Task Notes v0.1.0`, the value noted in step 1 | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, not from package.json

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `http://localhost:5183/` and read the footer | It reads `Task Notes v0.1.0`, not `Task Notes v0.0.0` | [ ] Pass [ ] Fail |
| 5 | Open `frontend/src/components/AppFooter.tsx` | It has no version literal and no `package.json` import; it calls `fetchBackendVersion` from `frontend/src/api/version.ts` | [ ] Pass [ ] Fail |
| 6 | In browser devtools Network tab, reload `http://localhost:5183/` | One `GET http://localhost:8010/api/version` with status 200 and body `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | From the repository root run `docker compose stop backend` | The backend container stops | [ ] Pass [ ] Fail |
| 8 | Reload `http://localhost:5183/` | The page still renders (heading, note form) | [ ] Pass [ ] Fail |
| 9 | Read the footer text | It reads exactly `Task Notes`, with no `v`, `undefined`, `null`, `unknown` or empty gap after the name | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | `0 failed`; the output lists AppFooter cases for version present, absent on failure, absent on the `unknown` sentinel, and loading | [ ] Pass [ ] Fail |

### Criterion 5: Before the fetch resolves, the footer shows `Task Notes` with no placeholder

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Open `http://localhost:5183/`, then in devtools Network set throttling to "Slow 3G" (or block `http://localhost:8010/api/version`) and reload | While the request is pending, the footer reads exactly `Task Notes`, with no spinner, `Loading`, `...` or `v` | [ ] Pass [ ] Fail |
| 13 | Remove the throttling or block and reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 13 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
