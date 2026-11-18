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
> (ClickUp task 123k99ctgch. The newest tracker comment corrects criterion 2 and the "frontend only" note; see `## Re-Plan Feedback`. The criteria below are the description's, amended by that comment.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, the backend at runtime (`GET /api/version`), never from `frontend/package.json` at build time and never a string typed into the component. (Amended by the tracker comment; the description allowed package metadata or a build-time variable.)
- [ ] 3. When the version cannot be resolved (request fails, non-OK status, malformed body, or the backend's own `unknown` sentinel), the footer renders without it: it reads `Task Notes` alone, never `undefined`, `null`, `unknown`, a dangling `v` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. A frontend whose bundle declares a different version than the backend shows the backend's version, not its own. (Added by the tracker comment.)
- [ ] 6. Before the version request resolves, the footer reads `Task Notes` alone, the same text as the failure state. (Added by the tracker comment, which asks for the loading state to be decided and recorded.)

## Re-Plan Feedback
- Comment (tracker): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 amended and criterion 5 added. The footer drops its `package.json` import (TEST-04's source) and fetches `GET /api/version` through a new client module. **The endpoint already exists**: TEST-05 (done, a declared dependency of this item) shipped `backend/app/routers/version.py`, returning `{"version": "<[project].version of backend/pyproject.toml via package metadata>"}`, with unit and integration tests, and `backend/app/main.py` already registers it and allows `GET` from the browser origin through CORS. Adding it again would duplicate TEST-05, so this plan reuses it as is.
- Comment (tracker): "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: criteria 3 and 6. **Decision: loading and failure both render `Task Notes` with no version and no `v`.** Not blank (the footer element and app name are always present, so the layout never jumps and the contentinfo landmark TEST-04 established always exists), and not `unknown` (criterion 3 of the description forbids showing a placeholder value; a reader seeing no version knows none was resolved, a reader seeing `unknown` might take it for a version string). The backend's own `unknown` sentinel (`UNKNOWN_VERSION` in `backend/app/services/version_service.py`, returned when package metadata is missing) is treated as unresolved for the same reason. Loading and failure are deliberately the same text: a distinct loading label would flash on every page load for a request that normally answers in milliseconds. No retry and no polling: one request on mount, which is all the criteria ask for.
- Comment (tracker): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Plan Overview` and `## Backend Plan`. The item is **no longer frontend-only in behaviour**: the footer now depends at runtime on the backend's `GET /api/version`, and the description's "touches no backend file, genuinely parallel with TEST-07" framing is void as a statement about runtime coupling. It **is still frontend-only in files**: because TEST-05 already delivered the endpoint, the File Manifest lists no backend file, and the Backend Plan says so with this reason rather than silently. Assumption recorded: the comment asks to "add" the endpoint because its author did not know TEST-05 had shipped it; reusing it satisfies the comment's intent (the backend's version, at runtime) without duplicate work. If the author meant a second, differently shaped endpoint, that is a new item, not this one.
- Assumption (forced by the comment, recorded rather than asked): the description's note "It modifies `LandingPage.tsx`" is not followed. The fetch lives in `AppFooter.tsx`, so `LandingPage.tsx` needs no change; only its test file changes, to mock the new client. This keeps the item off the file BUG-04 is expected to edit.

## Plan Overview
Switch the footer's version source from the frontend bundle (`frontend/package.json`, imported at build time by TEST-04) to the backend at runtime (`GET /api/version`, shipped by TEST-05). Layers touched: frontend only in files (a new API client module, a shared base-URL module the two clients import, the footer component, and the tests that asserted the old source). **Backend: no file changes, but a new runtime dependency**: the footer now calls the backend, which the description's "frontend only" note did not anticipate; the endpoint it calls already exists. No external API, no database, no new dependency.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): the one place the backend base URL is resolved, `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, exported as `API_BASE_URL`. Moved verbatim out of `frontend/src/api/notes.ts`, so a second client does not create a second copy of a deployment-dependent value (`coding_standards.md` Section 5, "one value, one source").
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of declaring it; behaviour unchanged, existing `notes.test.ts` keeps passing unchanged (its `vi.resetModules()` re-import re-evaluates `baseUrl.ts` too).
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. `GET {API_BASE_URL}/api/version`; throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response, mirroring `notes.ts`; throws on a body whose `version` is not a non-empty string; returns `null` when the body's version equals the backend sentinel `unknown` (a line comment names `UNKNOWN_VERSION` in `backend/app/services/version_service.py` as the value it mirrors, per the project's documentation convention); otherwise returns the version string.
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. Hold `version: string | null` in `useState`, initial `null`. In `useEffect` on mount, call `fetchBackendVersion()` once; on resolve set the state, on reject leave it `null`; guard both with an `isMounted` flag as `LandingPage.tsx` already does. Render `Task Notes v{version}` when `version` is a non-empty string, else `Task Notes` with no trailing space and no `v`. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and the existing `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: **not modified**. It already renders `<AppFooter />`; the fetch is the footer's own concern.
- Routes: none.
- State management: local component state in `AppFooter` (one `useState`, one mount `useEffect`). No context, no store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's existing values: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; loading and failure states use the same style, only the text differs.

## Backend Plan
No backend changes required. `GET /api/version` already exists (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`), is registered in `backend/app/main.py`, and is reachable from the browser origin through the existing CORS middleware (`allow_methods` includes `GET`). Its integration test `test_get_version_returns_200_with_version_from_pyproject` already proves it reports `backend/pyproject.toml`'s version. This item adds a runtime dependency on that endpoint, not a backend file (see `## Re-Plan Feedback`).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05), called as `{API_BASE_URL}/api/version`
- Request: no body, no query parameters
- Response: 200, `{"version": "0.1.0"}` (the value is `[project].version` of `backend/pyproject.toml`; `"unknown"` when the distribution's metadata is not installed). The frontend treats `"unknown"`, an empty string, a non-string, a non-OK status and a network error alike: no version shown.

## Technology Selection
- Version fetch client (`frontend/src/api/version.ts`): chose the browser's native `fetch` (already the notes client's mechanism) over adding a data-fetching library such as TanStack Query or SWR, because one request on mount needs neither caching nor retries.
- Loading and failure state (`AppFooter.tsx`): chose React's built-in `useState` and `useEffect` over a suspense or data-fetching dependency, because one nullable string covers both states.
- Base URL module (`frontend/src/api/baseUrl.ts`): no stdlib call, native platform feature or installed dependency covers sharing one configured value between two modules, so it is a three-line module built here, extracted from existing code rather than new logic.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of the backend base URL (`VITE_API_BASE_URL` with the existing `http://localhost:8010` default), moved out of notes.ts
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`, mapping the `unknown` sentinel to `null`
- [A] frontend/src/api/version.test.ts: client tests with `fetch` stubbed (version returned, sentinel mapped to null, non-OK throws, malformed body throws); the URL test stubs `VITE_API_BASE_URL` and re-imports the module, asserting the resolved URL rather than the 8010 fallback literal (`coding_standards.md` Section 5, "assert the resolution, not the literal")
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: footer shows the version the backend's own response carries; edge spec with `/api/version` aborted shows `Task Notes` alone
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: build-feature's copy of the manual UAT script

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import; fetch the backend version on mount; render `Task Notes v{version}` or `Task Notes`
- [A] frontend/src/components/AppFooter.test.tsx: replace the package.json assertion with mocked-client tests for present, loading, rejected and sentinel paths
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of package.json's
- [D] e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from the page's own `/api/version` response instead of `frontend/package.json`, which this item stops displaying

No dependency changes, so no lockfile is touched. `README.md` and `docs/DEVELOPMENT.md` need no edit: this item changes no project structure, run configuration, dependency or test infrastructure, and neither file mentions the footer or its version source. `frontend/src/components/LandingPage.tsx` is deliberately not listed (see `## Re-Plan Feedback`). TEST-04's own UAT script and Gherkin file still describe the package.json source as history of that item and are left unchanged; their CI check is well-formedness only.

## Testing Strategy
- Unit tests (Vitest, frontend): the version client (`frontend/src/api/version.test.ts`, `fetch` stubbed like `notes.test.ts`) and the footer component (`frontend/src/components/AppFooter.test.tsx`, `../api/version` mocked like `LandingPage.test.tsx` mocks `../api/notes`). `LandingPage.test.tsx` gains a `vi.mock("../api/version")` so it stays isolated from the network.
  - Directory: co-located with the component or client under `frontend/src/` (project layout)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: no new ones. The only backend behaviour relied on, `GET /api/version` reporting the pyproject version, is already covered by TEST-05's `backend/tests/integration/test_version_integration.py`; this item adds no endpoint, repository or model.
  - Directory: backend/tests/integration/
- E2E tests: criteria 1 and 5 in a real browser against the real backend (wait for the page's own `GET /api/version` response, read its `version`, assert the footer contains `v{that version}`), plus the feature's edge-case spec: `page.route` aborts the version request and the footer reads exactly `Task Notes`. Match the request by `new URL(url).pathname === "/api/version"`, never by substring: under Vite dev the module `/src/api/version.ts` also contains `/api/version` (the same trap TEST-03's spec documents for notes). Also update TEST-04's spec, which would otherwise fail on the old source.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge scenario.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the version the backend reports in the landing page footer` | — |
| 2 | The version comes from the backend at runtime, never package.json or a typed string | Unit | `renders the version fetched from the backend`, `requests GET /api/version from the configured base URL` | verifying it needs no navigation or interaction: it is which source the component renders, observable by mocking the client and stubbing fetch |
| 3 | When the version cannot be resolved, the footer reads `Task Notes` alone | Unit | `renders the app name alone when the version request fails`, `renders the app name alone when the backend reports the unknown sentinel`, `returns null for the backend unknown sentinel` | verifying it needs no navigation or interaction: it is a render rule over a nullable value; the E2E edge spec `shows the app name alone when the version endpoint is unreachable` exercises it in the browser as well |
| 4 | A component test asserts both paths: version present and absent | Unit | `renders the version fetched from the backend`, `renders the app name alone when the version request fails` | the criterion is itself a component-test requirement |
| 5 | A frontend whose bundle declares a different version shows the backend's | E2E | `shows the version the backend reports in the landing page footer` | — |
| 6 | Before the request resolves, the footer reads `Task Notes` alone | Unit | `renders the app name alone while the version request is pending` | verifying it needs no navigation or interaction, and a browser cannot hold a real request pending deterministically; a never-resolving mocked promise can |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | Load `/`, await the `/api/version` response, assert `app-footer` contains `v{response.version}` | Given the backend is running, When I open the landing page, Then the footer shows "Task Notes v" followed by the backend's version |
| 2 | Version from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports version X, When the landing page loads, Then the footer shows X |
| 3 | Unresolved version renders without it | covered at Unit; edge spec aborts `/api/version` and asserts exact text `Task Notes` | Given the backend is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When it runs, Then the footer tests for present and absent versions pass |
| 5 | Backend's version wins over the bundle's | Same spec as 1: the expected value is read from the backend's response, never from frontend/package.json | Given the frontend bundle declares 0.0.0 and the backend reports 0.1.0, When I open the landing page, Then the footer shows v0.1.0 |
| 6 | Loading state reads `Task Notes` alone | covered at Unit, see Criterion coverage | Given the version request has not answered yet, When the landing page renders, Then the footer reads "Task Notes" |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running (`docker compose up` from the repo root), frontend on http://localhost:5183, backend on http://localhost:8010.
1. Open http://localhost:8010/api/version in the browser → the page shows `{"version":"0.1.0"}` (or whatever `[project].version` in backend/pyproject.toml currently reads); note that value.
2. Open http://localhost:5183/ → the landing page shows the heading "Task Notes".
3. Scroll to the bottom of the page → the footer reads `Task Notes v0.1.0`, the value noted in step 1.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: as for criterion 1.
1. Open http://localhost:5183/ with the browser's developer tools open on the Network tab → a `GET` request to `http://localhost:8010/api/version` appears with status 200.
2. Click that request and open its Response → it reads `{"version":"0.1.0"}`, the same value the footer shows.
3. Open `frontend/src/components/AppFooter.tsx` in an editor → it contains no `package.json` import and no version literal such as `0.1.0`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as for criterion 1.
1. Stop the backend only: `docker compose stop backend` → http://localhost:8010/api/version no longer loads.
2. Reload http://localhost:5183/ → the page still loads (the frontend container is still up) and the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing space or gap.
3. Restart it: `docker compose start backend`, then reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` → the run passes: its summary line reports no failed test and the command exits 0.
2. In the output, find the tests `renders the version fetched from the backend` and `renders the app name alone when the version request fails` → both are listed as passed.

### Criterion 5: A frontend whose bundle declares a different version shows the backend's
Prerequisites: as for criterion 1.
1. Open `frontend/package.json` → its `version` reads `0.0.0`; open `backend/pyproject.toml` → its `version` reads `0.1.0`.
2. Open http://localhost:5183/ → the footer reads `Task Notes v0.1.0`, the backend's value, and nowhere reads `v0.0.0`.

### Criterion 6: Before the version request resolves, the footer reads `Task Notes` alone
Prerequisites: as for criterion 1, Chrome developer tools.
1. Open the Network tab, set throttling to a custom profile with 5000 ms latency (or "Slow 3G"), and reload http://localhost:5183/ → while the `/api/version` request is still pending, the footer reads exactly `Task Notes`, with no "loading" text and no blank footer.
2. Wait for the request to complete → the footer changes to `Task Notes v0.1.0` without the page layout jumping.
3. Set throttling back to "No throttling".
