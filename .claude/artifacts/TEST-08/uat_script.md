# UAT Script: TEST-08 Footer shows the app version

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally on branch `feature/TEST-08-footer-app-version` (or `main` once merged).
- No other process bound to ports `5183` (frontend) or `8010` (backend).
- A browser with DevTools (Network tab with request blocking and throttling).

## Test Environment Setup

1. From the repository root run `docker compose up --build`.
2. Wait until the `db`, `backend` and `frontend` services are started (the frontend log shows Vite listening on port 5183).

## Steps

### Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | Open `http://localhost:8010/api/version` and note the `version` value | JSON such as `{"version": "0.1.0"}` (may also carry a `commit` field) | [ ] Pass [ ] Fail |
| 1.2 | Open `http://localhost:5183` | The Task Notes landing page loads with the title "Task Notes" | [ ] Pass [ ] Fail |
| 1.3 | Scroll to the bottom of the page | The footer reads `Task Notes v0.1.0`, the number matching step 1.1 exactly | [ ] Pass [ ] Fail |
| 1.4 | In DevTools Elements, inspect the footer | A `<footer data-testid="app-footer">` containing `<span data-testid="app-version">0.1.0</span>` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from a single declared source, never typed into the component

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | Open `frontend/package.json` | Its `"version"` field reads `0.0.0` | [ ] Pass [ ] Fail |
| 2.2 | Open `backend/pyproject.toml` | Its `[project]` `version` reads `0.1.0` | [ ] Pass [ ] Fail |
| 2.3 | Open `http://localhost:5183` and read the footer | It reads `Task Notes v0.1.0` (the backend's value), not `v0.0.0` | [ ] Pass [ ] Fail |
| 2.4 | DevTools Network tab, reload, select the `version` request | A `GET http://localhost:8010/api/version` with status 200 whose response `version` is the value the footer shows | [ ] Pass [ ] Fail |
| 2.5 | Open `frontend/src/components/AppFooter.tsx` | No version literal and no `package.json` import; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts` | [ ] Pass [ ] Fail |

### Criterion 3: When the version cannot be resolved, the footer renders without it

Prerequisite: the landing page is open at `http://localhost:5183`.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | DevTools Network tab: right-click the `version` request, choose "Block request URL", reload | The footer reads exactly `Task Notes`: no ` v`, `undefined`, `null`, `unknown`, or blank space after the name | [ ] Pass [ ] Fail |
| 3.2 | Inspect the footer in the Elements tab | No `data-testid="app-version"` element exists inside it | [ ] Pass [ ] Fail |
| 3.3 | Remove the block (untick the URL in the request blocking panel) and reload | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 3.4 | Run `docker compose stop backend`, then reload `http://localhost:5183` | The page still loads (title and note form visible) and the footer reads exactly `Task Notes` | [ ] Pass [ ] Fail |
| 3.5 | Run `docker compose start backend`, wait a few seconds, reload | The footer reads `Task Notes v0.1.0` | [ ] Pass [ ] Fail |
| 3.6 | Loading state: set DevTools throttling to "Slow 3G" and reload | While the version request is pending the footer reads `Task Notes` with no placeholder, then changes to `Task Notes v0.1.0` when it completes. Reset throttling to "No throttling" afterwards | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | From the repository root run `npm --prefix frontend test` | Vitest passes; the output lists `AppFooter.test.tsx` with the version-present, loading and version-absent cases all passing | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 16 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
