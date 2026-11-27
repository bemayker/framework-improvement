# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- Stack started from the repository root with `docker compose up -d --build`; backend on http://localhost:8010, frontend on http://localhost:5183.
- `frontend/package.json` `version` is `0.0.0` and the backend reports `0.1.0` (`backend/pyproject.toml`).

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open http://localhost:8010/api/version and note the value | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 2 | Open http://localhost:5183/ | The landing page shows the "Task Notes" heading, the note form, and a footer at the bottom | [ ] Pass [ ] Fail |
| 3 | Read the footer | It reads `Task Notes v0.1.0`, the value noted in step 1 | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4 | Open `frontend/package.json` and read `version` | It is `0.0.0` | [ ] Pass [ ] Fail |
| 5 | Open http://localhost:5183/ and read the footer | It reads `Task Notes v0.1.0`, not `Task Notes v0.0.0` | [ ] Pass [ ] Fail |
| 6 | In devtools Network tab, reload http://localhost:5183/ | A `GET` to `http://localhost:8010/api/version` returned status 200 and body `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 7 | Open `frontend/src/components/AppFooter.tsx` | It contains no import of `package.json` and no version literal such as `0.1.0` | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 8 | From the repository root run `docker compose stop backend` | The backend container stops | [ ] Pass [ ] Fail |
| 9 | Open http://localhost:5183/ and hard-reload (Cmd+Shift+R) | The footer reads exactly `Task Notes`, with no `v`, `undefined`, `null`, `unknown` or blank space after the name | [ ] Pass [ ] Fail |
| 10 | In devtools, check the Network tab and Console | The `/api/version` request shows as failed; the Console shows no uncaught error from the footer | [ ] Pass [ ] Fail |
| 11 | Run `docker compose start backend`, wait until http://localhost:8010/api/version answers, then reload http://localhost:5183/ | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` | The run passes: no failed or errored test, exit code 0 | [ ] Pass [ ] Fail |
| 13 | Read the run's test list | It includes `renders the version returned by the backend` and `renders exactly the app name when the backend is unreachable` | [ ] Pass [ ] Fail |

### Criterion 5: Before the fetch resolves, the footer reads exactly Task Notes

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 14 | In Chrome devtools Network tab set throttling to "Slow 3G" and reload http://localhost:5183/ | While `/api/version` is pending the footer reads `Task Notes` with no version, no `v`, no "loading" text, and is not blank | [ ] Pass [ ] Fail |
| 15 | Wait for the `/api/version` request to complete | The footer changes to `Task Notes v0.1.0` without a page reload | [ ] Pass [ ] Fail |
| 16 | Reset throttling to "No throttling" | Throttling is off | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 16 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
