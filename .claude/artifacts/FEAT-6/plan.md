# Implementation Plan, FEAT-6: VERIFY MDF-459: GET /api/stamp returns a JSON stamp and the frontend shows it

## Feature
> Add GET /api/stamp to the backend returning {"stamp": "ok", "db": true} (db true when the database answers a SELECT 1). Show the stamp in the frontend footer as 'stamp: ok'.

## Acceptance Criteria
- [ ] GET /api/stamp answers 200 with {"stamp": "ok", "db": true}
- [ ] the frontend footer shows 'stamp: ok' once the backend answers
- [ ] backend and frontend unit tests cover both
- [ ] one Playwright E2E test checks the footer against the running stack

## Re-Plan Feedback
No tracker comments on the item (0 read) and no PR review comments: this is a first plan, branched from current main (plan base 308ab5ea5d7ac54c27d317ed116c6eff8854b4eb). Assumptions recorded instead of questions (`user_story_alignment.md` Section 4, autonomous mode):
- Assumption, database unreachable: the feature defines only the healthy answer. The endpoint still answers 200 with `{"stamp": "ok", "db": false}` when the probe fails or `DATABASE_URL` is unset; `db` is a reported fact, not a health verdict (that is `/api/health`'s job, which already answers 503). No new status code is introduced.
- Assumption, `stamp` is a constant `"ok"`: nothing in the feature makes it vary, so it does not.
- Assumption, footer before or without an answer: the footer keeps its existing `Task Notes v{version}` text and adds the stamp line only once `/api/stamp` has answered; a failed request shows no stamp line and no error (the footer must never break the page). The footer renders the `stamp` value the backend sent, so the text is `stamp: ok`.

## Plan Overview
One small backend endpoint plus one footer addition. Backend: `GET /api/stamp` in a new router, with a thin service that turns the existing `probe_connection` (`backend/app/core/db.py`, the bounded `SELECT 1` probe TEST-02 already uses) into a boolean, and a Pydantic response schema. Frontend: a typed API client for the endpoint, called once on mount by `AppFooter`, which renders `stamp: {stamp}` in a `data-testid="app-footer-stamp"` element once the call resolves. The API base URL, today private to `frontend/src/api/notes.ts`, moves to one shared module so both clients read one source (`coding_standards.md` Section 5, one value one source). No database schema change, no migration, no new dependency.

## Frontend Plan
- Components to create/modify: `frontend/src/components/AppFooter.tsx` (fetch the stamp on mount with an unmount guard, render `stamp: {stamp}` in `<span data-testid="app-footer-stamp">` after the existing app name and version, only once the request resolved; on rejection render nothing extra). New client `frontend/src/api/stamp.ts` exporting `type Stamp = { stamp: string; db: boolean }` and `getStamp(): Promise<Stamp>`, throwing `Loading the stamp failed: {status} {statusText}` on a non-OK response (same shape as `notes.ts`). New `frontend/src/api/config.ts` exporting `API_BASE_URL` (reads `VITE_API_BASE_URL`, default `http://localhost:8010`), imported by `notes.ts` and `stamp.ts`.
- Routes: none.
- State management: local `useState<Stamp | null>` in `AppFooter`, set from a mount-time `useEffect`, the same pattern `LandingPage.tsx` uses for notes.
- Design reference notes: AI freestyle (Design Reference mode NONE). The stamp text inherits the footer's existing style (0.875rem, #5f5f5f); separate it from the version with a single space-padded middle dot, ` · `, inside the same footer line.

## Backend Plan
- Endpoints: `GET /api/stamp`, returns the stamp and whether the database answered `SELECT 1`. Registered in `backend/app/main.py` with `app.include_router(stamp_router)`.
- Service layer: `backend/app/services/stamp_service.py`, `get_stamp() -> StampReport` (frozen dataclass `stamp: str`, `db: bool`). Reads `get_settings().database_url`; unset means `db=False` without probing; otherwise calls `probe_connection(database_url)` and maps success to `db=True` and a `psycopg.Error` to `db=False`, logging the error at error level. `STAMP_OK = "ok"` constant.
- Repository layer: none. The probe already lives in `backend/app/core/db.py` (`probe_connection`, bounded by `PROBE_CONNECT_TIMEOUT_SECONDS`) and is reused unchanged.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/stamp
- Request: no body, no query parameters
- Response: 200, `application/json`, schema `StampResponse` (`stamp: Literal["ok"]`, `db: bool`) in `backend/app/schemas/stamp.py`. Database answering: `{"stamp": "ok", "db": true}`. Database unreachable or unconfigured: `{"stamp": "ok", "db": false}` (assumption, see Re-Plan Feedback). Any other method: 405 (FastAPI default). CORS already allows GET for the configured origins, so no middleware change.

## Technology Selection
- Database check for `db`: chose the existing `probe_connection` in `backend/app/core/db.py` (installed `psycopg`, already bounded and already running `SELECT 1`) over a new probe or a new dependency, because it covers the need exactly.
- Stamp service `backend/app/services/stamp_service.py`: no stdlib call, native platform feature or installed dependency covers the probe-to-boolean mapping, so a few lines are built here; `dataclasses` (stdlib) carries the report, as `health_service.py` does.
- Response schema `backend/app/schemas/stamp.py`: chose installed `pydantic` (already used by every schema) over a hand-built dict.
- Frontend stamp client `frontend/src/api/stamp.ts`: chose the native `fetch` over a new HTTP library, as `notes.ts` does.
- Shared base URL `frontend/src/api/config.ts`: no dependency involved; extracted so one value has one source instead of duplicating `DEFAULT_API_BASE_URL` into a second client.
- Footer state: chose React's own `useState` and `useEffect` (installed) over a data-fetching library.
- E2E spec: chose the installed `@playwright/test` (existing specs use it); no new dependency.

## File Manifest
### New files
- [B] backend/app/routers/stamp.py: `GET /api/stamp` router, returns `StampResponse` from `stamp_service.get_stamp()`
- [B] backend/app/services/stamp_service.py: `get_stamp()` mapping the `probe_connection` outcome to `db` true or false
- [B] backend/app/schemas/stamp.py: `StampResponse` Pydantic model
- [B] backend/tests/unit/test_stamp_service_unit.py: unit tests of the service with the probe mocked (db true, db false on `psycopg.Error`, db false without probing when `DATABASE_URL` unset)
- [B] backend/tests/integration/test_stamp_integration.py: router tests against the real database (200 with the exact body), the unreachable-database answer, and 405 on POST
- [A] frontend/src/api/config.ts: shared `API_BASE_URL` (env `VITE_API_BASE_URL`, default `http://localhost:8010`)
- [A] frontend/src/api/stamp.ts: typed `getStamp()` client
- [A] frontend/src/api/stamp.test.ts: client unit tests with `fetch` stubbed (default URL, OK body, non-OK throw)
- [D] e2e/tests/FEAT-6_stamp_endpoint_and_footer.spec.ts: one spec checking `app-footer-stamp` reads `stamp: ok` against the running stack, plus a mobile-viewport edge-case spec
- [G] e2e/uat/scenarios/FEAT-6_stamp_endpoint_and_footer.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/FEAT-6_stamp_endpoint_and_footer_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/FEAT-6/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/main.py: import and register `stamp_router`, and name FEAT-6 in the module docstring
- [B] backend/tests/unit/test_main_unit.py: assert `/api/stamp` is among the registered routes, as the file does for every router
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./config` instead of defining it locally; behaviour unchanged
- [A] frontend/src/components/AppFooter.tsx: fetch the stamp on mount and render `stamp: {stamp}` in `app-footer-stamp` once it resolves
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/stamp`; cover the stamp shown after resolve, absent before resolve, absent on rejection, and the existing name and version assertions kept
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/stamp` so the page tests make no real request through the footer
No dependency changes, so no lockfile changes. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: backend `stamp_service.get_stamp()` with `probe_connection` mocked (happy path db true, error case `psycopg.OperationalError` gives db false, edge case unset `DATABASE_URL` gives db false without calling the probe) and route registration in `test_main_unit.py`; frontend `getStamp()` with `fetch` stubbed and `AppFooter` with `../api/stamp` mocked.
  - Directory: backend/tests/unit/ (backend), co-located `*.test.ts(x)` under frontend/src/ (frontend, the existing convention)
  - Naming: test_{module}_unit.py (backend), {Module}.test.ts(x) (frontend)
- Integration tests: `GET /api/stamp` through the real HTTP cycle against the run's PostgreSQL (200 with exactly `{"stamp": "ok", "db": true}`), the unreachable target `127.0.0.1:9` with an unmanaged `TestClient` (200 with `db: false`, as `test_health_integration.py` does), and POST answering 405.
  - Directory: backend/tests/integration/
- E2E tests: the footer shows `stamp: ok` on `/` against the running stack (backend plus database plus frontend), and the same on a 375x667 viewport as the edge case.
  - Directory: e2e/tests/
  - File: FEAT-6_stamp_endpoint_and_footer.spec.ts
- UAT scenarios: one scenario per criterion plus a mobile-viewport edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | GET /api/stamp answers 200 with {"stamp": "ok", "db": true} | Integration | Verifying it needs no navigation or interaction: it is a router response against the real database |
| 2 | the frontend footer shows 'stamp: ok' once the backend answers | E2E | — |
| 3 | backend and frontend unit tests cover both | Unit | Verifying it needs no navigation or interaction: the criterion is the unit tests themselves (stamp service, stamp client, AppFooter) |
| 4 | one Playwright E2E test checks the footer against the running stack | E2E | — |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | GET /api/stamp answers 200 with {"stamp": "ok", "db": true} | covered at Integration, see Criterion coverage | Given the backend and database are running, When GET /api/stamp is requested, Then it answers 200 with stamp ok and db true |
| 2 | the frontend footer shows 'stamp: ok' once the backend answers | `page.goto("/")`, then `expect(page.getByTestId("app-footer-stamp")).toHaveText("stamp: ok")` (auto-waiting, no fixed timeout) | Given the stack is running, When the user opens the landing page, Then the footer shows stamp: ok |
| 3 | backend and frontend unit tests cover both | covered at Unit, see Criterion coverage | Given the repository, When the backend and frontend unit suites run, Then they report 0 failed |
| 4 | one Playwright E2E test checks the footer against the running stack | the spec file above, run headless against the started stack | Given the stack is running, When the FEAT-6 Playwright spec runs, Then it reports 0 failed |

## Manual verification plan
### Criterion 1: GET /api/stamp answers 200 with {"stamp": "ok", "db": true}
Prerequisites: the stack is running with `docker compose up` from the repository root, and the backend answers on http://localhost:8010.
1. In a browser, open `http://localhost:8010/api/stamp` → the page shows the JSON `{"stamp":"ok","db":true}`.
2. Open the browser's developer tools, Network tab, and reload the same URL → the request to `/api/stamp` shows status `200`.
3. Run `docker compose stop db`, then reload `http://localhost:8010/api/stamp` → the page shows `{"stamp":"ok","db":false}` with status `200` (the recorded assumption). Run `docker compose start db` afterwards.

### Criterion 2: the frontend footer shows 'stamp: ok' once the backend answers
Prerequisites: the stack is running as above, and the frontend answers on http://localhost:5183.
1. Open `http://localhost:5183/` → the landing page shows the heading `Task Notes`.
2. Scroll to the footer at the bottom of the page → it reads `Task Notes v{the version in frontend/package.json} · stamp: ok`.
3. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads `Task Notes v{version}` with no stamp text and the rest of the page still works. Run `docker compose start backend` afterwards.

### Criterion 3: backend and frontend unit tests cover both
Prerequisites: a checkout of the branch with backend and frontend dependencies installed.
1. Run `uv run --directory backend pytest -q tests/unit/test_stamp_service_unit.py tests/unit/test_main_unit.py` → the run ends with `0 failed`.
2. Run `npm --prefix frontend test -- src/api/stamp.test.ts src/components/AppFooter.test.tsx` → the run ends with `0 failed`.

### Criterion 4: one Playwright E2E test checks the footer against the running stack
Prerequisites: the stack is running as above, and Playwright browsers are installed.
1. From the repository root, run `npx playwright test e2e/tests/FEAT-6_stamp_endpoint_and_footer.spec.ts` → the run ends with `0 failed`.
2. Open the spec file `e2e/tests/FEAT-6_stamp_endpoint_and_footer.spec.ts` → it navigates to `/` and asserts the `app-footer-stamp` element reads `stamp: ok`, with no mocked network route.
