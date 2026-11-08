# UAT Script: TEST-10 Footer shows the build commit

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-10-footer-build-commit` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root if no `.env` exists (defaults are usable as-is).
- No other process bound to ports `5183` (frontend), `8010` (backend) or `5442` (database).
- Build and start the stack with a known commit, from the repository root: `BUILD_COMMIT=a1b2c3d4e5f67890 docker compose up -d --build`. Backend at http://localhost:8010, frontend at http://localhost:5183.
- Frontend dependencies installed for criterion 3 (`npm --prefix frontend install`).

## Steps

### Criterion 1: The footer shows the first 7 characters of the commit from GET /api/version, next to the version

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open http://localhost:8010/api/version in a browser tab | The page shows `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}` (the backend's 12-character form) | [ ] Pass [ ] Fail |
| 1.2 | Open http://localhost:5183/ | The landing page shows the `Task Notes` heading, the note form and a footer at the bottom | [ ] Pass [ ] Fail |
| 1.3 | Read the footer (`data-testid="app-footer"`) | It reads exactly `Task Notes v0.1.0 (a1b2c3d)`: the version, then the first 7 characters of the commit from step 1.1 in parentheses | [ ] Pass [ ] Fail |
| 1.4 | Open DevTools, Elements tab, select the footer | It contains a `span` with `data-testid="app-footer-commit"` holding `(a1b2c3d)`, right after the `app-footer-version` span | [ ] Pass [ ] Fail |

### Criterion 2: While the request is pending or fails, the footer shows the version alone, never undefined or an error

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Open http://localhost:5183/, DevTools, Network tab, set throttling to `Slow 3G`, reload, and watch the footer before the `/api/version` request finishes | The footer reads `Task Notes`, with no commit, no `undefined`, no `null` and no error text; once the request finishes it reads `Task Notes v0.1.0 (a1b2c3d)`. Set throttling back to `No throttling` | [ ] Pass [ ] Fail |
| 2.2 | Stop the backend only: `docker compose stop backend`, then reload http://localhost:5183/ | The footer reads exactly `Task Notes`, with no commit, no `undefined` and no error message | [ ] Pass [ ] Fail |
| 2.3 | In DevTools, Network tab, find the `/api/version` request | It shows as failed | [ ] Pass [ ] Fail |
| 2.4 | Rebuild the backend without a commit: `docker compose up -d --build backend` (no `BUILD_COMMIT` set), then open http://localhost:8010/api/version | The page shows `"commit":"unknown"` | [ ] Pass [ ] Fail |
| 2.5 | Reload http://localhost:5183/ | The footer reads exactly `Task Notes v0.1.0`: the version alone, with no `(unknown)`, no empty parentheses and no trailing space | [ ] Pass [ ] Fail |

### Criterion 3: A component test covers the success, pending and failure paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` | The run reports `0 failed`, and the AppFooter test list includes a success test (version and commit), a pending test and a failure test | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 10 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
