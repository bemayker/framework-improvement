# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (ClickUp task 123k99ctgch. The newest tracker comment corrects criterion 2 and the "frontend only" note; see Re-Plan Feedback. The criteria below are the corrected ones.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, the backend at runtime via `GET /api/version` (tracker comment overrides "frontend package metadata or a build-time variable"), never a string typed into the component and never `frontend/package.json`. A frontend running against a backend of another version shows the backend's version.
- [ ] 3. When the version cannot be resolved (request still pending, `/api/version` unreachable or erroring, unexpected response, or the backend's own `unknown` sentinel), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 is rewritten to the backend source; `AppFooter.tsx` stops importing `package.json` and fetches through a new client `frontend/src/api/version.ts`. **The endpoint the comment asks to add already exists**: `GET /api/version` was delivered by TEST-05 (`backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`), is registered in `backend/app/main.py` (`app.include_router(version_router)`), returns `{"version": "<pyproject version>"}` from installed package metadata, answers without a database, and is covered by `backend/tests/integration/test_version_integration.py`. It already does what the comment asks for (the backend's own version, resolved at runtime), so this plan adds no backend file. Adding a second endpoint would duplicate TEST-05's route.
- Comment (tracker), same comment: "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by, decided explicitly: **loading state**: the footer renders `Task Notes` with no version, no `v`, no placeholder text and no spinner. **Failure state** (network error, non-2xx, a body without a non-empty string `version`, or the backend answering its sentinel `unknown`, which `version_service.py` returns when package metadata is missing): the footer renders `Task Notes` only, exactly the loading rendering. **The footer never reads `unknown`.** Reasons: criterion 3 says "renders without it", and the footer is never blank because the app name is always present; a frontend-invented `unknown` and a backend-reported `unknown` would be indistinguishable to the reader, so neither is shown. Not acted on: no retry and no client-side timeout, consistent with `frontend/src/api/notes.ts`; a hung request leaves the footer in its loading rendering, which is the same rendering as failure, so nothing on screen is wrong (recorded in `shared_risks.md`).
- Comment (tracker), same comment: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in the Plan Overview and Backend Plan. The item is **no longer frontend-only in its dependencies**: it gains a runtime dependency on the backend (`GET /api/version`, CORS for the frontend origin) and its E2E spec needs the backend running. It is still **frontend-only in its file changes**, because the backend piece is TEST-05's existing endpoint. The map row's "Disjoint from TEST-08 (frontend only)" notes on TEST-06, TEST-07 and FEAT-1 stay true at the file level: no `backend/` path is in the File Manifest. Should a reviewer prefer a fresh endpoint anyway, that is a re-plan, not a build-time deviation.
- Description note "It modifies `LandingPage.tsx`" → not acted on for the component: `AppFooter` fetches its own version, so `LandingPage.tsx` keeps rendering `<AppFooter />` unchanged. Only `LandingPage.test.tsx` changes, because its footer test asserts the `package.json` version.

## Plan Overview
Frontend change with a runtime backend dependency. `AppFooter` drops its build-time `package.json` import and, on mount, asks the backend for its version through a new typed client `frontend/src/api/version.ts`, rendering `Task Notes v{version}` once resolved and `Task Notes` before that or on any failure. The API base URL, today a private constant in `notes.ts`, moves to one shared module `frontend/src/api/baseUrl.ts` so both clients resolve it from one source. Tests that asserted the `package.json` version (component, landing page, TEST-04 E2E and TEST-04 UAT artifacts) are updated to the backend source. No backend file changes: `GET /api/version` exists since TEST-05.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx` (modify): remove `import { version } from "../../package.json"`; hold `backendVersion: string | null` in `useState(null)`; in `useEffect` call `fetchBackendVersion()`, set the result when mounted (the `isMounted` guard `LandingPage.tsx` already uses), set `null` on rejection. Render `<footer data-testid="app-footer">` containing `Task Notes` and, only when `backendVersion` is a non-empty string, `<span data-testid="app-version"> v{backendVersion}</span>`. No span, no trailing space, no placeholder otherwise. Keep `APP_NAME` and `footerStyle` as they are.
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. GETs `${API_BASE_URL}/api/version`; throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response and `Error("Loading the version failed: unexpected response")` when the body is not an object with a string `version`; resolves `null` for an empty string or the backend sentinel `"unknown"` (named constant `UNRESOLVED_BACKEND_VERSION`, with a comment pointing at `backend/app/services/version_service.py`); otherwise resolves the version string. A network error propagates as `fetch`'s own rejection.
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, moved verbatim from `notes.ts` (`import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of declaring it; no behaviour change.
  - `frontend/src/components/LandingPage.tsx`: unchanged.
- Routes: none.
- State management: local `useState` + `useEffect` in `AppFooter`, one request per mount, no global store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Keep the existing footer style untouched (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`); the version span inherits it.

## Backend Plan
No backend changes required. The item depends at runtime on TEST-05's existing `GET /api/version` (`backend/app/routers/version.py`, registered in `backend/app/main.py`), which already returns the backend's own version from package metadata and already allows `GET` from the default CORS origin `http://localhost:5183` (`backend/app/core/config.py`, `CORS_ORIGINS` in `docker-compose.yml`). This is a backend dependency the tracker description did not have, stated here per the tracker comment; it adds no backend file.

## API Integration Plan
No external API integration. (The project's own backend is consumed through `frontend/src/api/version.ts`, per the client-layer rule of `coding_standards.md` Section 4.)

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05), called as `${API_BASE_URL}/api/version`
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0"}` (value from `backend/pyproject.toml` `[project].version`; `"unknown"` when package metadata is missing). Frontend mapping: non-empty string other than `unknown` → shown; `unknown`, empty, wrong shape, non-2xx, network error → not shown.

## Technology Selection
- `frontend/src/api/version.ts` (version client): chose the browser's native `fetch` with a hand-written type guard over adding a client or schema library (axios, zod), because `notes.ts` already uses `fetch` and one string field needs no library.
- `frontend/src/api/baseUrl.ts` (shared base URL): chose moving the existing expression into one module over duplicating it in `version.ts`, because two copies of a deployment-dependent value is what `coding_standards.md` Section 5 forbids; no stdlib or dependency is involved.
- Loading and failure handling in `AppFooter`: chose React's built-in `useState`/`useEffect` over a data-fetching dependency (react-query, SWR), because one request per mount with no cache needs neither and the project installs neither.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of `API_BASE_URL` (moved from `notes.ts`)
- [A] frontend/src/api/version.ts: typed client `fetchBackendVersion()` for `GET /api/version`
- [A] frontend/src/api/version.test.ts: client unit tests with `fetch` stubbed
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser spec, backend version shown, and footer without version when `/api/version` is unreachable
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: build-feature's copy of the manual UAT script

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version at runtime; loading and failure render the app name only
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present, pending, failed and `unknown` paths; drop the `package.json` assertion
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the mocked backend version instead of `package.json`
- [D] e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from `backend/pyproject.toml` instead of `frontend/package.json`
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step now names the backend's `GET /api/version` as the source
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: same correction of the version source

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test-infrastructure change (the E2E stack already runs the backend through `docker-compose.yml`).

## Testing Strategy
- Unit tests: the version client (`frontend/src/api/version.test.ts`: OK response, sentinel and empty mapped to `null`, non-OK throws, wrong shape throws, `VITE_API_BASE_URL` honoured) and `AppFooter` (mocked client: resolved, pending, rejected, `null`). `LandingPage.test.tsx` mocks the client so it never hits the network. No backend unit tests: no backend code changes.
  - Directory: beside the file under `frontend/src/` (Vitest, project layout); backend `backend/tests/unit/` untouched
  - Naming: `{Module}.test.ts(x)`
- Integration tests: none new. The endpoint's router behaviour is already covered by `backend/tests/integration/test_version_integration.py` (TEST-05) and this item changes no backend code; it must stay green.
  - Directory: backend/tests/integration/
- E2E tests: footer shows the backend's version against the running stack; edge case with `page.route` aborting `**/api/version` shows `Task Notes` with no version element. The expected version is read from `backend/pyproject.toml` in the spec, never typed in. TEST-04's spec is updated to the same source.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version from GET /api/version in the footer` | — |
| 2 | The version comes from the backend at runtime via `GET /api/version`, never typed into the component nor from `package.json` | Unit | `renders the version the backend reports, not the frontend package version`, `returns the version the backend reports from /api/version` | verifying the source needs no navigation or interaction: a mocked client returning a version unlike `package.json` proves the wiring, and the client test proves the URL |
| 3 | When the version cannot be resolved the footer renders without it, never `undefined`, `null`, `unknown` or an empty gap | Unit | `renders the app name without a version while the request is pending`, `renders the app name without a version when the request fails`, `renders the app name without a version when the backend reports unknown`, `resolves null for the backend unknown sentinel`, `throws when the response is not OK`, `throws when the response has no version string` | it is a rendering rule over client outcomes, fully exercised by mocking the client; the browser edge-case spec below adds the real-network case |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version the backend reports, not the frontend package version`, `renders the app name without a version when the request fails` | the criterion itself names the component tier |

E2E edge-case spec (testing standards Section 4's per-feature edge case): `renders the footer without a version when /api/version is unreachable`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Go to `/`, expect `app-footer` visible containing `Task Notes` and `app-version` containing the `backend/pyproject.toml` version | Given the stack is running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Version from the backend at runtime | covered at Unit, see Criterion coverage | Given the frontend package version is 0.0.0 and the backend version is 0.1.0, When I open the page, Then the footer shows 0.1.0 |
| 3 | Unresolved version renders without it | covered at Unit; E2E edge case aborts `**/api/version` and expects no `app-version` element and footer text exactly `Task Notes` | Given the backend is stopped, When I open the page, Then the footer reads "Task Notes" with nothing after it |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend tests, When I run them, Then the AppFooter present and absent tests pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: from the repo root, `docker compose up -d --build` has finished and `curl http://localhost:8010/api/version` prints `{"version":"0.1.0"}`.
1. Open `http://localhost:5183/` in a browser → the landing page shows the "Task Notes" heading, the note form and a footer at the bottom.
2. Read the footer → it reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: the stack from Criterion 1 is running. Note that `frontend/package.json` says `"version": "0.0.0"` and `backend/pyproject.toml` says `version = "0.1.0"`.
1. Open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, the backend's version, not `0.0.0`.
2. Open the browser developer tools, Network tab, reload the page → a `GET` request to `http://localhost:8010/api/version` appears with status 200 and response `{"version":"0.1.0"}`.
3. In `frontend/src/components/AppFooter.tsx`, search for `package.json` and for any literal version such as `0.1.0` → neither appears.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack from Criterion 1 is running.
1. Run `docker compose stop backend` → the command reports the backend container stopped.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no blank space after it.
3. In developer tools, Elements tab, inspect the footer → it holds no element with `data-testid="app-version"`.
4. Run `docker compose start backend`, wait until `curl http://localhost:8010/api/version` answers, then reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run's summary reports no failed test, the tests `renders the version the backend reports, not the frontend package version` and `renders the app name without a version when the request fails` are listed as passed, and the command exits 0.
