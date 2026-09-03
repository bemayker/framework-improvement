# UAT Script: TEST-08 Footer shows the app version reported by the backend

The footer's version is read from the backend at runtime (`GET /api/version`), not from
`frontend/package.json` at build time. That is what these steps verify, and it is why
several of them compare the footer with the backend's own answer rather than with a value
written in this document.

## Prerequisites

- Docker and Docker Compose installed and running.
- Repository checked out locally, on branch `feature/TEST-08-footer-app-version` (or later, once merged, on `main`).
- Copy `.env.example` to `.env` in the repository root (defaults are usable as-is for local UAT).
- No other process bound to ports `5183` (frontend), `8010` (backend) or `5442` (database).
- For the criterion 4 steps only: Node.js installed and `cd frontend && npm install` done once, plus `npx playwright install` if browsers were never installed in this checkout.
- Have `backend/pyproject.toml` and `frontend/package.json` open (or `cat` them) so the tester can read both `version` fields. At the time of writing the backend declares `0.1.0` and the frontend declares `0.0.0`; the expected texts below use those values, and a later version bump changes the expected text without changing the steps.

## Test Environment Setup

1. From the repository root, run:
   ```bash
   docker compose up --build
   ```
2. Wait until the `db`, `backend` and `frontend` services report as started (the backend log shows uvicorn listening on port `8010`, the frontend log shows the Vite dev server on `http://localhost:5183`).

## Criterion 1: The footer renders the version string on the landing page

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | From the repository root, run `docker compose up --build` | The `db`, `backend` and `frontend` services start; the backend log shows uvicorn on port `8010` and the frontend log shows Vite on `http://localhost:5183` | [ ] Pass [ ] Fail |
| 2 | In a terminal, run `curl -s http://localhost:8010/api/version` | The response is exactly `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |
| 3 | Open `http://localhost:5183` in a browser | The landing page loads with the heading "Task Notes", the note form and the saved-notes list | [ ] Pass [ ] Fail |
| 4 | Scroll to the bottom of the page and read the footer | The footer reads exactly `Task Notes v0.1.0`: the `v` immediately followed by the value from step 2, with one space between "Notes" and "v" | [ ] Pass [ ] Fail |
| 5 | Open browser dev tools, Elements panel, and select the footer | It is a `<footer data-testid="app-footer">` containing a `<span data-testid="app-footer-version">` whose text is `v0.1.0`; no element with `data-testid="app-footer-version-unavailable"` is present | [ ] Pass [ ] Fail |
| 6 | In dev tools, Network panel, reload the page and filter on `version` | Exactly one request to `http://localhost:8010/api/version`, status 200, response body `{"version":"0.1.0"}` | [ ] Pass [ ] Fail |

## Criterion 2: The version comes from a single declared source (the backend's `GET /api/version`), never a string typed into the component

Prerequisite: the stack from criterion 1 is running, and `backend/pyproject.toml` and `frontend/package.json` are open in an editor.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Read the `version` field of `frontend/package.json` | It is `0.0.0`, while the footer from criterion 1 reads `v0.1.0` — the footer is already not showing the frontend's own version | [ ] Pass [ ] Fail |
| 2 | In `backend/pyproject.toml`, change `version = "0.1.0"` to `version = "9.8.7"`, save, then from the repository root run `docker compose up -d --build backend` | The backend image rebuilds (the Dockerfile's `uv sync` re-registers the package metadata) and the container restarts | [ ] Pass [ ] Fail |
| 3 | Run `curl -s http://localhost:8010/api/version` | The response is `{"version":"9.8.7"}` | [ ] Pass [ ] Fail |
| 4 | Reload `http://localhost:5183` | The footer reads exactly `Task Notes v9.8.7`, with no change made to any file under `frontend/` | [ ] Pass [ ] Fail |
| 5 | In the editor, search `frontend/src/` for the text `package.json`, then for `9.8.7` and for `0.1.0` | No matches for `package.json` or `9.8.7` at all, and no match for `0.1.0` in any non-test `.ts`/`.tsx` file — its only hits are stubbed-response fixtures in `src/api/version.test.ts`, which assert what the client does with a body the test itself supplies. The version is typed nowhere in the frontend's production sources | [ ] Pass [ ] Fail |
| 6 | Restore `version = "0.1.0"` in `backend/pyproject.toml`, save, run `docker compose up -d --build backend` again, then reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

## Criterion 3: When the version cannot be resolved, the footer renders without it, never `undefined`, `null` or an empty gap

Prerequisite: the stack from criterion 1 is running and the footer reads `Task Notes v0.1.0`.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | From the repository root, run `docker compose stop backend` | The `backend` container stops; `curl -s http://localhost:8010/api/version` now prints a connection-refused error | [ ] Pass [ ] Fail |
| 2 | Reload `http://localhost:5183` and read the footer | The page still loads (the saved-notes list is empty and the form is still usable) and the footer reads exactly `Task Notes · version unavailable`: no `v`, no `undefined`, no `null`, no blank area after the name | [ ] Pass [ ] Fail |
| 3 | In dev tools, Elements panel, select the footer | `<footer data-testid="app-footer">` contains the text "Task Notes", a `<span data-testid="app-footer-version-unavailable">` reading `version unavailable`, and no `app-footer-version` element | [ ] Pass [ ] Fail |
| 4 | In dev tools, Network panel, inspect the version request | The request to `http://localhost:8010/api/version` is shown as failed (status `(failed)` or `ERR_CONNECTION_REFUSED`) | [ ] Pass [ ] Fail |
| 5 | Loading state: in the Network panel set throttling to "Slow 3G", reload, watch the footer, then set throttling back to "No throttling" | For the first moments the footer reads exactly `Task Notes` (no `v`, no "version unavailable"); once the request completes it reads `Task Notes v0.1.0`. If the transition is too fast to observe, the loading state is pinned by the component test in criterion 4 and by the fourth E2E spec | [ ] Pass [ ] Fail |
| 6 | Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0"}`, then reload the page | The footer reads `Task Notes v0.1.0` again | [ ] Pass [ ] Fail |

> Step 5 needs the backend running, so run step 6 first if the container is still stopped from step 1.

## Criterion 4: A component test asserts both paths, version present and version absent

Prerequisite: `cd frontend && npm install` done. No running stack is needed for steps 1 to 3.

| # | Step | Expected Result | Pass/Fail |
|---|------|------------------|-----------|
| 1 | Open `frontend/src/components/AppFooter.test.tsx` in the editor | It mocks `../api/version` and holds five cases: the app name renders; the resolved path (`getVersion` resolves `"1.2.3"`, asserting footer text `Task Notes v1.2.3` and an `app-footer-version` span reading `v1.2.3`); the absent path (`getVersion` rejects, asserting footer text exactly `Task Notes · version unavailable`, no `undefined`, no `null`, no `app-footer-version` element); the loading path (a promise that never settles, asserting footer text exactly `Task Notes`); and the contentinfo landmark / test-id case | [ ] Pass [ ] Fail |
| 2 | From `frontend/`, run `npx vitest run src/components/AppFooter.test.tsx` | Every test in the file passes, 0 failures | [ ] Pass [ ] Fail |
| 3 | From `frontend/`, run `npm test` | The whole Vitest suite passes, including `src/api/version.test.ts` (the client rejects on a 500 and on a body without a usable `version` string) and the updated footer case in `LandingPage.test.tsx` | [ ] Pass [ ] Fail |
| 4 | With the stack from criterion 1 running, from the repository root run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts e2e/tests/TEST-04_page_footer.spec.ts` | All eight specs pass: TEST-08's happy path shows the backend's version, its three edge specs show `Task Notes · version unavailable` (aborted request, HTTP 500) and `Task Notes` (held request), and TEST-04's four specs pass against the backend's response rather than `frontend/package.json` | [ ] Pass [ ] Fail |

## Summary

| Item | Result |
|------|--------|
| Total steps | 22 |
| Passed | ___ |
| Failed | ___ |
| Tester | ___________________ |
| Date | ___________________ |
| Notes | ___________________ |
