# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria.**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. **Amended by the newest tracker comment:** that source is the backend, read at runtime from `GET /api/version` (whose value is `[project].version` in `backend/pyproject.toml`), not `frontend/package.json` at build time. A frontend rebuilt against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 is amended (comment overrides description). The footer drops its `package.json` import and fetches `GET /api/version` through a new client module `frontend/src/api/version.ts`. **The endpoint already exists:** TEST-05 (a dependency of this item, merged) shipped `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py`, registered in `backend/app/main.py`, returning `{"version": "<pyproject version>"}`, with unit and integration tests. This plan reuses it unchanged rather than adding a second one; CORS already allows `GET` from `http://localhost:5183` (`backend/app/core/config.py`).
- Comment (tracker): "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: decided and recorded in Frontend Plan → State management. **Loading:** the footer renders the app name only, `Task Notes`, with no version and no placeholder text; the version span is added when the fetch resolves. **Failure** (network error, non-2xx, malformed body): the footer renders `Task Notes` only, exactly as while loading. It is **never blank** (the name is always present) and **never reads `unknown`**, because criterion 3 says the footer renders without an unresolved version. **Backend sentinel:** the backend's own `version_service.UNKNOWN_VERSION` (`"unknown"`, returned when its distribution metadata is missing) and a blank string are treated as unresolved too, so they also render `Task Notes` only. Assumption recorded: loading and failure look identical on purpose, because a transient "loading..." text in a footer would flash on every page load and carries no information the reader asked for.
- Comment (tracker): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in Backend Plan. The item is **no longer frontend-only in its dependency**: its value now comes from the backend at runtime, so a backend outage changes what the footer shows. It needs **no backend file change**, because the endpoint the comment asks for was delivered by TEST-05; the File Manifest therefore carries no `[B]` entry, and that absence is deliberate, not an omission. The description's note that the item "modifies `LandingPage.tsx`" no longer holds either: the fetch lives inside `AppFooter.tsx`, so `LandingPage.tsx` is untouched (only its test file changes), which also keeps this item off BUG-04's file.

## Plan Overview
Frontend-only code change. The footer component stops importing `version` from `frontend/package.json` and instead fetches the backend's version at runtime from the existing `GET /api/version` endpoint (TEST-05) through a new typed client module. The API base URL, today private to `frontend/src/api/notes.ts`, moves to one shared module so the notes client and the version client read the same value from the same source (`coding_standards.md` Section 5, one value, one source). The footer has three render states (loading, resolved, unresolved); two of them render the app name only. Tests: client unit tests, footer component tests for present/absent/loading, updated LandingPage test, one new E2E spec plus an update to TEST-04's E2E spec, which today asserts the `package.json` version and would fail once the footer shows the backend's.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/apiBaseUrl.ts` (new): exports `API_BASE_URL`, resolved from `import.meta.env.VITE_API_BASE_URL` with the existing default `http://localhost:8010`. Moved verbatim out of `notes.ts`; no new value.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./apiBaseUrl` instead of declaring it; behaviour unchanged.
  - `frontend/src/api/version.ts` (new): `getBackendVersion(): Promise<string | null>`. Calls `fetch(`${API_BASE_URL}/api/version`)`. Throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response, and throws on a body whose `version` is not a string (unexpected response shape). Returns `null` when the backend answered with a blank string or the backend's sentinel `"unknown"` (exported as `BACKEND_UNKNOWN_VERSION`, with a comment naming `backend/app/services/version_service.py` → `UNKNOWN_VERSION` as its counterpart). Otherwise returns the trimmed version string. Reads only the `version` field and ignores any other field, so a response that grows (TEST-09 adds the build commit) does not break it.
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. `useState<string | null>(null)` plus a mount-time `useEffect` calling `getBackendVersion()`, with the same `isMounted` unmount guard `LandingPage.tsx` uses. Renders `<footer data-testid="app-footer">Task Notes{resolved && <span data-testid="app-footer-version"> v{version}</span>}</footer>`. The version span exists only when a version resolved, so neither `undefined`, `null`, `v` nor a trailing space is ever rendered.
- Routes: none (landing page `/` only).
- State management: local component state in `AppFooter`. Three states, decided per the tracker comment: **loading** renders `Task Notes`; **resolved** renders `Task Notes v{version}` (e.g. `Task Notes v0.1.0`); **unresolved** (rejected fetch, or `null` from the client) renders `Task Notes`. Never blank, never `unknown`. One fetch per mount, no retry and no polling (not asked for).
- Design reference notes: AI freestyle. Design Reference mode is NONE; the footer keeps its existing inline style values unchanged (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`) and the version span inherits them.

## Backend Plan
No backend changes required. This is stated deliberately because the tracker comment asked for one: the `GET /api/version` endpoint it asks for already exists (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`), returns the backend's `pyproject.toml` version from installed package metadata, answers without a database, and is covered by `backend/tests/unit/test_version_service_unit.py` and `backend/tests/integration/test_version_integration.py`. CORS (`backend/app/core/config.py`, default origin `http://localhost:5183`, methods `GET` and `POST`) already lets the browser call it. The item now depends on the backend at runtime, but changes no backend file.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: `200` with `{"version": "0.1.0"}`. The client reads `version` only and tolerates extra fields (TEST-09 may add one). `"unknown"` or `""` means the backend could not resolve its version and is rendered as unresolved. Any non-2xx or network failure is unresolved on the footer.

## Technology Selection
- Version fetch: chose the browser's native `fetch`, already used by `frontend/src/api/notes.ts`, over adding an HTTP client library, because it covers a single GET.
- Footer loading state: chose React's own `useState` and `useEffect`, already installed, over a data-fetching library (React Query, SWR), because one fetch on mount with no cache or retry needs nothing more.
- `frontend/src/api/apiBaseUrl.ts`: no stdlib call, native platform feature or installed dependency covers sharing one configured value between two client modules, so the existing constant is moved into its own module rather than duplicated.
- No new dependency is added.

## File Manifest
### New files
- [A] frontend/src/api/apiBaseUrl.ts: the one source of the API base URL (VITE_API_BASE_URL with the existing default), shared by both clients
- [A] frontend/src/api/version.ts: typed client for GET /api/version, returning the version or null when the backend could not resolve it
- [A] frontend/src/api/version.test.ts: unit tests for the version client with fetch stubbed (resolved, sentinel, blank, non-OK, malformed body, extra fields ignored)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E spec, footer shows the version the backend served, and shows the app name only when /api/version is unreachable
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import API_BASE_URL from ./apiBaseUrl instead of declaring it locally; behaviour unchanged
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import; fetch the backend version on mount; render loading, resolved and unresolved states
- [A] frontend/src/components/AppFooter.test.tsx: mock ../api/version; assert version present, version absent (rejection, null), and the loading render
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version and assert the footer shows the mocked backend version instead of the package.json one
- [D] e2e/tests/TEST-04_page_footer.spec.ts: stop asserting the frontend/package.json version (no longer what the footer shows); assert the version the page received from /api/version instead

No dependency is added or changed, so no lockfile changes. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. `frontend/src/components/LandingPage.tsx` is intentionally not modified.

## Testing Strategy
- Unit tests: version client (`frontend/src/api/version.test.ts`, fetch stubbed as in `notes.test.ts`): resolved value returned trimmed; `"unknown"` and `""` return null; non-OK throws with status; body without a string `version` throws; extra fields ignored; URL built from the shared base URL. Footer component (`AppFooter.test.tsx`, `../api/version` mocked): version present renders `Task Notes v1.2.3` and the `app-footer-version` span; rejection renders exactly `Task Notes` with no version span and no `undefined`, `null` or `unknown` text; `null` renders the same; before resolution the footer renders `Task Notes`; landmark and test id kept. `LandingPage.test.tsx` mocks the version client and asserts the footer shows the mocked version. `notes.test.ts` keeps passing unchanged (base URL behaviour preserved). No backend unit test change: `version_service` is unchanged.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (Vitest, the project's existing frontend convention); backend unit directory `backend/tests/unit/` untouched
  - Naming: `{Module}.test.tsx` / `{module}.test.ts`, matching existing files
- Integration tests: no new ones. The endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, answers without a database, 405 on POST).
  - Directory: `backend/tests/integration/`
- E2E tests: `TEST-08_footer_app_version.spec.ts`: (1) navigate to `/`, capture the `/api/version` response with `page.waitForResponse`, assert the footer contains `v{that version}`, so no port or backend URL is hardcoded; (2) edge case: `page.route("**/api/version", route => route.abort())`, navigate to `/`, assert the footer text is exactly `Task Notes` and the `app-footer-version` test id is absent. TEST-04's spec is updated the same way for its version assertions.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source, the backend at runtime via GET /api/version | Unit | verifying it needs no navigation or interaction: the component test proves the rendered value is whatever the version client returns, the client test proves it is read from GET /api/version on the shared base URL, and the existing integration test proves the endpoint serves pyproject.toml's version |
| 3 | When the version cannot be resolved, the footer renders without it, never undefined, null or an empty gap | Unit | verifying it needs no navigation or interaction: it is a render rule over a rejected or null client result, asserted in the component test (the E2E edge-case spec exercises it once more as the feature's required edge case) |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component test, so the component test tier is the only one that can satisfy it |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Go to `/`, capture the `/api/version` response, assert `app-footer` contains `v{version}` | Given the backend is running, When I open the landing page, Then the footer reads "Task Notes v{backend version}" |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports 0.1.0 and frontend/package.json says 0.0.0, When I open the landing page, Then the footer shows v0.1.0 |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage; E2E edge-case spec aborts /api/version | Given /api/version is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When it runs, Then the AppFooter present and absent tests pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running (`docker compose up`), frontend at `http://localhost:5183`, backend at `http://localhost:8010`.
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0"}` (the value of `[project].version` in `backend/pyproject.toml`).
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading.
3. Scroll to the bottom of the page and read the footer → it reads `Task Notes v0.1.0`, matching the value from step 1.

### Criterion 2: The version comes from the backend at runtime, not from frontend/package.json
Prerequisites: as for criterion 1. `frontend/package.json` declares `"version": "0.0.0"` and `backend/pyproject.toml` declares `version = "0.1.0"`, so the two differ.
1. Open `http://localhost:5183/` and read the footer → it reads `Task Notes v0.1.0`, the backend's version, and not `v0.0.0`.
2. Open the browser developer tools, Network tab, reload `http://localhost:5183/` → one request to `http://localhost:8010/api/version` appears with status 200 and response `{"version":"0.1.0"}`.
3. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no import of `package.json`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack is running as for criterion 1.
1. Stop only the backend: `docker compose stop backend` → `http://localhost:8010/api/version` no longer answers.
2. Reload `http://localhost:5183/` and read the footer → it reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap.
3. Start the backend again: `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a test where the version client resolves to a version and the footer shows it, and a test where the client rejects or returns null and the footer shows `Task Notes` with no version.
