# UAT Script: TEST-08 Footer shows the app version

Criteria 1 to 3 are verifiable in a browser against a running stack. Criterion 4 is a criterion about the test suite itself, so it is verified by running that suite. Two steps read source files (2.4 and 4.2's reporter reading is not one of them): the "never a string typed into the component" half of criterion 2 is observable only in the source, because a browser cannot tell a fetched version from a typed one.

**The expected version is whatever the backend reports.** It is `[project].version` in `backend/pyproject.toml` — `0.1.0` at the time of writing — and it is read from `GET /api/version`, never from this document and never from `frontend/package.json`. A version bump changes the expected text without changing this script.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or, once merged, on `main`).
- No other process bound to host port `5183` (frontend), `8010` (backend) or `5442` (database); every mapping comes from `docker-compose.yml`.
- No root `.env` file is required. `docker-compose.yml` carries usable defaults for every variable it substitutes.
- A terminal with `curl`, and a browser with developer tools (Network and Elements panels).
- Node 20 installed and `npm install` already run inside `frontend/`, for criterion 4.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up -d --build
   ```
2. Run `docker compose ps` until the `db` service reports healthy and the `backend` and `frontend` services report running.

## Steps

### Criterion 1: The footer renders the version string on the landing page

Prerequisites: the shared prerequisites above; the stack is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1.1 | In a terminal, run `curl -s http://localhost:8010/api/version` | The response is `{"version":"0.1.0"}` — or whatever `[project].version` in `backend/pyproject.toml` says. Note the value down; it is the expected version for every step below | [ ] Pass [ ] Fail |
| 1.2 | Open `http://localhost:5183` in a browser | The landing page renders: the title `Task Notes`, the note form and the note list | [ ] Pass [ ] Fail |
| 1.3 | Read the footer at the bottom of the page | It reads `Task Notes v0.1.0` — the app name, then `v`, then exactly the version from step 1.1 | [ ] Pass [ ] Fail |
| 1.4 | Open developer tools, go to Network, reload the page and filter on `version` | Exactly one request, `GET http://localhost:8010/api/version`, with status `200` and body `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 1.5 | In developer tools, go to Elements and inspect the footer | A `<footer data-testid="app-footer">` containing a `<span data-testid="app-footer-version">` whose text is `v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 2: The version comes from the backend at runtime, never a string typed into the component

> The work item's original wording asked for "a single declared source (the frontend package metadata or a build-time variable)". A comment on the tracker item supersedes it: the single source is the backend's `GET /api/version`, fetched at runtime. This section verifies the superseding wording.

Prerequisites: criterion 1 passed; the stack is still running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 2.1 | In a terminal, run `docker compose stop backend` | The command completes, and `docker compose ps` shows `backend` as exited | [ ] Pass [ ] Fail |
| 2.2 | Reload `http://localhost:5183` | The page still renders. The footer reads `Task Notes · version unavailable` and no version number appears anywhere in it. A version compiled into the frontend bundle would still be showing here; its absence is what proves the source is the backend | [ ] Pass [ ] Fail |
| 2.3 | Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers again, then reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |
| 2.4 | Not verifiable through the UI beyond steps 2.1 to 2.3. Open `frontend/src/components/AppFooter.tsx` and `frontend/src/api/version.ts` in an editor | Neither file contains a version literal: no `0.1.0`, no `package.json` import, no `VITE_`-prefixed version variable. The only version-shaped text in the component is the `v` prefix, and the value beside it comes from `fetchVersion()` | [ ] Pass [ ] Fail |

### Criterion 3: An unresolvable version renders without it, never `undefined`, `null` or an empty gap

Prerequisites: the stack is running.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 3.1 | Run `docker compose stop backend` | `docker compose ps` shows `backend` as exited | [ ] Pass [ ] Fail |
| 3.2 | Open `http://localhost:5183` | The footer reads exactly `Task Notes · version unavailable` | [ ] Pass [ ] Fail |
| 3.3 | Select the footer text with the mouse, or read it in developer tools → Elements | It contains neither the word `undefined` nor `null`, there is no trailing `v` with nothing after it, and no `<span data-testid="app-footer-version">` element exists. A `<span data-testid="app-footer-version-unavailable">` does | [ ] Pass [ ] Fail |
| 3.4 | In developer tools → Network, find the `GET /api/version` request | It shows as failed (connection refused), and the page shows no error dialog, no blank area and no layout gap where the version would be | [ ] Pass [ ] Fail |
| 3.5 | Run `docker compose start backend`, wait for `curl -s http://localhost:8010/api/version` to answer, then reload the page | The footer returns to `Task Notes v0.1.0` | [ ] Pass [ ] Fail |

### Criterion 4: A component test asserts both paths, version present and version absent

Prerequisites: Node 20 installed; `npm install` has been run inside `frontend/`. The stack is not needed for steps 4.1 and 4.2.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 4.1 | Not verifiable through the UI. In a terminal, from the `frontend/` directory, run `npm test` | Vitest reports the whole suite green | [ ] Pass [ ] Fail |
| 4.2 | Read the reporter output for `src/components/AppFooter.test.tsx` | It lists a passing test for the version-present path (the footer reads `Task Notes v1.2.3`) and a passing test for the version-absent path (the footer reads `Task Notes · version unavailable`, with neither `undefined` nor `null` in its text), alongside the loading and `contentinfo` landmark tests | [ ] Pass [ ] Fail |
| 4.3 | With the stack running, from the repository root run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts e2e/tests/TEST-04_page_footer.spec.ts` | Every spec passes, including the re-scoped TEST-04 spec, which now compares the footer with the backend's response rather than with `frontend/package.json` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 17 (5 + 4 + 5 + 3) |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
