# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (Tracker task 123k99ctgch. The tracker comment recorded under Re-Plan Feedback amends criterion 2 and adds criteria 5 and 6 below.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. **Amended by the tracker comment:** that source is the backend's `GET /api/version` at runtime, not the frontend package metadata or a build-time variable.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (From the tracker comment) A frontend built against a different version than the backend shows the backend's version, not its own.
- [ ] 6. (From the tracker comment) The footer's loading state (before the fetch resolves) and failure state (`/api/version` unreachable) are decided and recorded: both render `Task Notes` with no version, no placeholder and no `unknown`.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: the footer stops importing `frontend/package.json` and fetches `GET /api/version` once on mount through a new client module `frontend/src/api/version.ts` (criteria 2 and 5). **The endpoint already exists**: TEST-05 (done, a dependency of this item) shipped `GET /api/version` in `backend/app/routers/version.py`, returning `{"version": ...}` read from the installed `task-notes-backend` distribution metadata (`backend/app/services/version_service.py`), so it reports the backend's own `backend/pyproject.toml` version (currently `0.1.0`) at runtime and needs no database. Adding it again would duplicate TEST-05, so this plan adds no endpoint.
- Comment (tracker), same comment: "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: recorded as criterion 6 and in the Frontend Plan. **Decision: neither blank nor `unknown`.** In both the loading and the failure state the footer still renders, reading exactly `Task Notes` (the app name only, no `v`, no trailing space, no placeholder). Reasons: criterion 3 already requires that an unresolvable version renders without it, so `unknown` text would contradict it; a blank footer would hide the app name TEST-04 put there and drop the `contentinfo` landmark's content. The same rendering applies when the backend itself answers `{"version": "unknown"}` (the sentinel `version_service.py` returns when its distribution metadata is missing): the backend is saying it could not resolve the version, so the footer treats it as unresolved rather than printing `vunknown`. Once the fetch resolves with a usable version the text becomes `Task Notes v{version}`. No retry and no timeout: neither is asked for, and the fetch timeout is already its own backlog item (CHORE-02, the TEST-08 follow-up).
- Comment (tracker), same comment: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here explicitly. The correction makes this item **cross-tier in behaviour**: the footer now depends at runtime on the backend's `GET /api/version`, so the description's "frontend only, touches no backend file" framing no longer describes what the feature relies on. **In files, however, the backend change is zero**, because the endpoint the comment asks for is already on main from TEST-05; the Backend Plan says so and the File Manifest carries no `[B]` entry. If the reviewer reads the comment as requiring a new or different endpoint, that is the one assumption this plan makes, recorded here: the existing TEST-05 endpoint satisfies "an endpoint that returns the backend's version" exactly.
- Comment (tracker), framework PR-opened notes from earlier runs → not acted on because they record earlier runs' PR openings and carry no requirement (the TEST-08 code they refer to was backed out by the sandbox reset `a7ddb99`).

## Plan Overview
Frontend-only file changes against a backend dependency that already exists. A new API client `frontend/src/api/version.ts` calls `GET {API_BASE_URL}/api/version` and returns the reported version, or `null` when the body carries no usable version (missing, not a string, blank, or the backend's `unknown` sentinel); network errors and non-OK statuses throw, matching the existing notes client. The API base URL, today private to `frontend/src/api/notes.ts`, moves to a shared module `frontend/src/api/baseUrl.ts` so both clients read one value from one source. `AppFooter.tsx` drops its `package.json` import, fetches the version once on mount, and renders `Task Notes v{version}` when resolved and `Task Notes` otherwise. `LandingPage.tsx` is not edited (it already renders `<AppFooter />`). Existing tests that asserted the `package.json` version (`AppFooter.test.tsx`, `LandingPage.test.tsx`, `e2e/tests/TEST-04_page_footer.spec.ts`) are updated to the new source.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, resolved exactly as `notes.ts` does today: `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of defining it; behaviour unchanged.
  - `frontend/src/api/version.ts` (new): `getBackendVersion(): Promise<string | null>`. Fetches `${API_BASE_URL}/api/version`; on `!response.ok` throws `Error("Loading the version failed: {status} {statusText}")` (same shape as `notes.ts`'s `requestFailed`); parses JSON and returns the `version` field trimmed when it is a non-empty string other than `unknown`, else `null`. The sentinel is a named constant `BACKEND_UNKNOWN_VERSION = "unknown"` with a comment pointing at `UNKNOWN_VERSION` in `backend/app/services/version_service.py`. Extra fields in the body (a later `commit` field, TEST-09) are ignored.
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `../../package.json` import; `useState<string | null>(null)`; `useEffect` calls `getBackendVersion()` once with an `isMounted` guard (the pattern `LandingPage.tsx` uses), `.catch` leaves the state `null`. Render `{APP_NAME}` followed by ` v{version}` only when `version` is a non-null string, so no `undefined`, `null`, stray `v` or trailing space can appear. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
- Routes: none.
- State management: local component state in `AppFooter` only; no context, no global store.
- Loading state: `Task Notes` (no version). Failure state (network error, non-OK status, unparseable body): `Task Notes`. Backend reports `unknown` or a blank/missing version: `Task Notes`. Resolved: `Task Notes v0.1.0` (for the current `backend/pyproject.toml`).
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's existing inline style unchanged: `fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main from TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`) and returns the backend's own version from its distribution metadata at runtime, with no database dependency; it is covered by `backend/tests/integration/test_version_integration.py` and `backend/tests/unit/test_version_service_unit.py`. CORS already allows `GET` from `http://localhost:5183` (`backend/app/core/config.py` `DEFAULT_CORS_ORIGINS`, `backend/app/main.py`). The item is still cross-tier in behaviour; see Re-Plan Feedback.

## API Integration Plan
No external API integration. The only call is to this project's own backend, through the client layer under `frontend/src/api/`.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`, overridden by `VITE_API_BASE_URL`)
- Request: no body, no parameters
- Response: `200` with JSON `{"version": "0.1.0"}` (existing TEST-05 contract, unchanged by this item). The client reads only `version`; any additional field is ignored. `{"version": "unknown"}` is the backend's own "could not resolve" answer and is treated as no version.

## Technology Selection
- `frontend/src/api/version.ts` (version client): chose the platform `fetch` API, as `notes.ts` already uses, over adding an HTTP client library (none installed, none needed for one GET).
- Fetch-on-mount in `AppFooter`: chose React's built-in `useState` and `useEffect` over a data-fetching dependency (none installed; one request with no caching or refetch needs).
- `frontend/src/api/baseUrl.ts`: no stdlib call, native platform feature or installed dependency covers sharing one configured value between two modules, so a three-line module is built here; chosen over duplicating the `VITE_API_BASE_URL` fallback in `version.ts`, which would give one deployment-dependent value two sources.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of `API_BASE_URL` (env `VITE_API_BASE_URL`, default `http://localhost:8010`), shared by the notes and version clients
- [A] frontend/src/api/version.ts: `getBackendVersion()` client for `GET /api/version`, returning the backend's version or `null`
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client with `fetch` stubbed (OK body, `unknown` sentinel, blank and missing and non-string version, non-OK status, network rejection, configured base URL)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright specs for criteria 1 and 5 plus the unreachable-backend edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it locally; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import, fetch the version from the backend on mount, render `Task Notes v{version}` or `Task Notes`
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert the version-present path, the version-absent paths (resolved `null`, rejected), the loading state, and the unchanged landmark and test id
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` alongside `../api/notes` and assert the footer shows the mocked backend version instead of the `package.json` version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: replace the `frontend/package.json` version assertions with the version the page's own `GET /api/version` response reported, since the footer no longer shows the frontend's version

`frontend/src/components/LandingPage.tsx` is not modified: it already renders `<AppFooter />`, and the fetch lives in the footer. No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes, and `docs/DEVELOPMENT.md` already describes the footer reading `GET /api/version` at runtime (its footer paragraph, left over from the backed-out run, also describes TEST-10's commit suffix, which stays TEST-10's to land).

## Testing Strategy
- Unit tests: the version client (`version.test.ts`, `fetch` stubbed as `notes.test.ts` does) and the footer component (`AppFooter.test.tsx`, `../api/version` mocked with `vi.mock`), plus the footer assertion in `LandingPage.test.tsx`.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (the frontend's existing Vitest convention; `CLAUDE.md`'s `backend/tests/unit/` applies to the backend)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`
- Integration tests: none new. The feature adds no repository, model, migration or endpoint; the endpoint it consumes is already covered by `backend/tests/integration/test_version_integration.py` (TEST-05).
  - Directory: `backend/tests/integration/`
- E2E tests: footer shows the version the backend reports (live backend); footer shows a backend-reported version that differs from the frontend's `0.0.0` (`page.route` fulfilling `{"version": "9.9.9-e2e"}`); edge case: `page.route` aborting `/api/version` leaves the footer reading exactly `Task Notes`. Match the API call on `new URL(url).pathname === "/api/version"`, not a substring (the Vite module `src/api/version.ts` would match a substring, the trap `TEST-03_simple_note_form.spec.ts` documents). Wait for the footer text, never a fixed timeout.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one per criterion plus an unreachable-backend edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | Single declared source, amended: the backend's `GET /api/version` at runtime, never a string in the component | Unit | verifying it needs no navigation or interaction: `version.test.ts` asserts the request goes to `{API_BASE_URL}/api/version` and returns its `version`, `AppFooter.test.tsx` asserts the rendered text is the mocked client's value; the backend side is TEST-05's integration test |
| 3 | Unresolvable version renders without it, never `undefined`, `null` or an empty gap | Unit | verifying it needs no navigation or interaction: every unresolved input (rejected fetch, `null`, blank, `unknown`) is reproduced deterministically by mocking the client, asserting the exact text `Task Notes` |
| 4 | A component test asserts both paths: version present and version absent | Unit | the criterion is itself a component test in `AppFooter.test.tsx` |
| 5 | A frontend built against a different version shows the backend's version, not its own | E2E | — |
| 6 | Loading and failure states render `Task Notes` with no version, placeholder or `unknown` | Unit | verifying it needs no navigation or interaction: a never-resolving and a rejecting mock of `getBackendVersion` render the two states deterministically; the E2E edge-case spec additionally exercises the unreachable case in a browser |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | `page.goto("/")`, capture the `GET /api/version` response, assert `app-footer` contains `Task Notes v{response.version}` | Given the app is running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Version from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports 0.1.0 and the frontend package is 0.0.0, When I open the page, Then the footer shows 0.1.0 |
| 3 | Unresolved renders without it | covered at Unit, see Criterion coverage (plus the E2E abort edge case) | Given the backend is stopped, When I open the page, Then the footer reads "Task Notes" with no version text |
| 4 | Component test, both paths | covered at Unit, see Criterion coverage | Given the frontend unit suite, When it runs, Then AppFooter tests for present and absent versions pass |
| 5 | Backend's version, not the frontend's | `page.route` fulfils `/api/version` with `{"version": "9.9.9-e2e"}`; assert footer contains `v9.9.9-e2e` and not `v0.0.0` | Given the backend reports 9.9.9-e2e, When I open the page, Then the footer reads "Task Notes v9.9.9-e2e" |
| 6 | Loading and failure states | covered at Unit, see Criterion coverage | Given the version request is blocked, When I open the page, Then the footer reads exactly "Task Notes" |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: stack started from the repo root with `docker compose up --build`; `backend/pyproject.toml` declares `version = "0.1.0"`.
1. Open `http://localhost:8010/api/version` in a browser → the JSON reads `{"version":"0.1.0"}`.
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading.
3. Scroll to the bottom of the page and read the footer → it reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend's GET /api/version at runtime
Prerequisites: as for criterion 1; `frontend/package.json` declares `"version": "0.0.0"`.
1. Open `http://localhost:5183/` with the browser DevTools Network tab open → a `GET` request to `http://localhost:8010/api/version` appears with status 200.
2. Read the footer → it reads `Task Notes v0.1.0`, the backend's value, not `v0.0.0`.
3. Open `frontend/src/components/AppFooter.tsx` → there is no version literal and no `package.json` import in it.

### Criterion 3: An unresolvable version renders without it
Prerequisites: stack running as for criterion 1.
1. Run `docker compose stop backend` from the repo root → the backend container stops.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap.
3. Run `docker compose start backend`, wait for it to be up, reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test` from the repo root → `frontend/src/components/AppFooter.test.tsx` and `frontend/src/api/version.test.ts` are in the run, with `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a test with a resolved version (footer reads `Task Notes v{version}`) and tests with no version (footer reads exactly `Task Notes`).

### Criterion 5: The footer shows the backend's version, not the frontend's own
Prerequisites: stack running as for criterion 1.
1. Open `http://localhost:5183/`, then in DevTools use Network request overrides (Chrome: Overrides, "Override content" on the `/api/version` request) to return `{"version":"9.9.9-manual"}`.
2. Reload the page → the footer reads `Task Notes v9.9.9-manual`, though the frontend bundle's own `package.json` version is `0.0.0`.
3. Remove the override and reload → the footer reads `Task Notes v0.1.0`.

### Criterion 6: Loading and failure states are the recorded ones
Prerequisites: stack running as for criterion 1.
1. In DevTools Network, right-click the `/api/version` request and choose "Block request URL", then reload `http://localhost:5183/` → the footer reads exactly `Task Notes` (failure state: no blank footer, no `unknown`).
2. Unblock it, set Network throttling to "Slow 3G" and reload → while the request is pending the footer reads `Task Notes`; once it completes it changes to `Task Notes v0.1.0` (loading state, then resolved).
3. Reset throttling to "No throttling".
