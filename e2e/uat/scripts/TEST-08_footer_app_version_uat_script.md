# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, on `main`).
- From the repository root, `docker compose up --build` has started `db`, `backend` and `frontend`.
- `backend/pyproject.toml` `[project].version` reads `0.1.0` and `frontend/package.json` `version` reads `0.0.0`.
- Chrome or Edge for the throttling step.

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `http://localhost:5183` in a browser | The landing page shows the title "Task Notes" and the note form | [ ] Pass [ ] Fail |
| 2 | Scroll to the bottom of the page | The footer (`data-testid="app-footer"`) reads exactly `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, not from frontend/package.json

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3 | Open `http://localhost:8010/api/version` in a browser tab | The page shows `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 4 | Open `http://localhost:5183`, open dev tools, Network tab, and reload | A `GET` request to `http://localhost:8010/api/version` appears with status 200 | [ ] Pass [ ] Fail |
| 5 | Read the footer | It reads `Task Notes v0.1.0`, the backend's version, and not `Task Notes v0.0.0` | [ ] Pass [ ] Fail |
| 6 | Edit `backend/pyproject.toml` to `version = "0.1.1"`, run `docker compose up --build backend`, leave the frontend untouched, reload `http://localhost:5183` | The footer reads `Task Notes v0.1.1` with no frontend rebuild (revert the edit and rebuild the backend afterwards) | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders "Task Notes" alone

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 7 | Run `docker compose stop backend` | The backend container stops | [ ] Pass [ ] Fail |
| 8 | Reload `http://localhost:5183` | The page still renders the title and note form; the footer reads exactly `Task Notes`, with no `v`, `undefined`, `null` or `unknown`, and no empty gap | [ ] Pass [ ] Fail |
| 9 | In dev tools Network, find the `api/version` request | It shows a failed request (connection refused) and the footer is unchanged | [ ] Pass [ ] Fail |
| 10 | Run `docker compose start backend`, wait for it to start, reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 11 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | `0 failed`; the output lists a version-present case (`Task Notes v0.1.0`) and version-absent cases (rejected request, `unknown`, empty string) | [ ] Pass [ ] Fail |

### Criterion 5: Before the request settles, the footer renders "Task Notes" alone

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 12 | In dev tools Network, set throttling to "Slow 3G" and reload `http://localhost:5183` | While the `api/version` request is pending, the footer reads exactly `Task Notes`, with no placeholder text, spinner or blank footer | [ ] Pass [ ] Fail |
| 13 | Wait for the request to complete | The footer changes to `Task Notes v0.1.0` without a page reload | [ ] Pass [ ] Fail |
| 14 | Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` | `0 failed`, including the pending-state case | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 14 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
