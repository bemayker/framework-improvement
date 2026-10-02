# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on. Frontend only, under frontend/src/; modifies LandingPage.tsx/footer which TEST-04 touched (complete).
>
> Depends on TEST-04, TEST-05 (both done). Tracker: ClickUp 123k99ctgch. Amended by the newest tracker comment (see Re-Plan Feedback): the version comes from the backend at runtime via GET /api/version, not from package.json.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component. **Amended by tracker comment:** the single declared source is the backend's `GET /api/version` response, fetched at runtime (which itself resolves `[project].version` of `backend/pyproject.toml` via installed package metadata, TEST-05).
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback (if applicable)
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint ... have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: the comment overrides the description and AC2's "frontend package metadata or a build-time variable". The footer fetches `GET /api/version` at runtime through a new client module `frontend/src/api/version.ts`; the `import { version } from "../../package.json"` in `AppFooter.tsx` is removed, and so is every test assertion that reads `frontend/package.json` for the footer (Vitest and TEST-04's E2E spec/UAT artifacts).
- Comment (tracker), same comment, "Add a GET /api/version endpoint": → Not acted on as new code, because `GET /api/version` **already exists on main** (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, response `{"version": "0.1.0"}`, covered by `backend/tests/integration/test_version_integration.py` and `backend/tests/unit/test_version_service_unit.py`). CORS already allows `GET` from `http://localhost:5183` (`backend/app/main.py`, `backend/app/core/config.py`).
- Comment (tracker), same comment, "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan": → Addressed explicitly: the comment's requirement **would** add a backend change, but this plan makes **no backend change** because the endpoint it asks for already shipped in TEST-05. The item stays frontend-only in code; its runtime behaviour now depends on the backend. The Backend Plan says "No backend changes required" and the File Manifest carries no `[B]` entry.
- Comment (tracker), same comment, "Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers": → Decided and recorded (Frontend Plan → Footer states):
  - **Loading (before the fetch settles):** the footer renders `Task Notes` only. No version, no placeholder text, no spinner, no trailing ` v`. Not blank: the app name is always there.
  - **Failure (network error, non-2xx, malformed body, empty version, or the backend's own `unknown` sentinel):** the footer renders `Task Notes` only, identical to loading. Not blank, and **not** the word `unknown`. Reason: AC3 says "renders without it"; `unknown` is not a version and a footer reading `Task Notes vunknown` answers no one's question. A failure is not retried and not logged to the user.
  - **Success:** `Task Notes v{version}` with the version in its own `<span data-testid="app-version">`, which exists only in this state.
- Assumption (recorded, not blocking): the backend's `unknown` sentinel (TEST-05 `UNKNOWN_VERSION`, returned when package metadata is absent) is treated as "version cannot be resolved" under AC3. The frontend client names that sentinel in one constant with a comment pointing at TEST-05.
- Assumption (recorded): the response type declares only `version`; any other field (TEST-09 is concurrently adding `commit`) is tolerated and ignored. Consuming `commit` is TEST-10's scope, not this item's.
- Assumption (recorded): no timeout and no retry on the version fetch. A hung request leaves the footer in its loading state, which renders the same as failure, so it is harmless; adding an AbortController/backoff would be gold plating for a footer label (`user_story_alignment.md` Section 3).
- Assumption (recorded): the TEST-04 E2E spec and UAT artifacts that assert the footer shows `frontend/package.json`'s version become false under this change and are re-scoped (version assertions removed; name, landmark, layout assertions kept). The version assertions move to TEST-08's own spec and artifacts.

## Plan Overview
Frontend only. Replace the build-time `package.json` import in `AppFooter` with a runtime fetch of `GET /api/version`, through a dedicated client module that follows the `frontend/src/api/notes.ts` pattern (`coding_standards.md` Section 4: one client layer, typed response, non-OK and unexpected shapes handled). The API base URL, currently defined inside `notes.ts`, moves to one shared module so both clients read the same deployment-dependent value from one source (`coding_standards.md` Section 5). `AppFooter` owns the fetch in a `useEffect`, so `LandingPage.tsx` is unchanged. Tests: client unit tests with `fetch` stubbed, `AppFooter` component tests for present/loading/absent paths, `LandingPage` test updated to mock the version client, a TEST-08 E2E spec against the real stack, and TEST-04's E2E/UAT artifacts re-scoped.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/apiBaseUrl.ts` (new): exports `API_BASE_URL`, resolved from `import.meta.env.VITE_API_BASE_URL` with the documented default `http://localhost:8010` (moved verbatim from `notes.ts`, comment kept).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./apiBaseUrl` instead of declaring its own; behaviour unchanged.
  - `frontend/src/api/version.ts` (new): `export type VersionInfo = { version: string }` (extra fields tolerated, not read) and `export async function fetchBackendVersion(): Promise<string>`. GETs `${API_BASE_URL}/api/version`; throws `Loading the version failed: {status} {statusText}` on non-OK (same `requestFailed` shape as notes.ts); throws when the body's `version` is not a non-empty string or equals the backend sentinel `unknown` (`UNRESOLVED_BACKEND_VERSION = "unknown"`). Network errors propagate as the rejected `fetch` promise.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the package.json import; `const [version, setVersion] = useState<string | null>(null)`; a mount `useEffect` calls `fetchBackendVersion()`, sets the version on success, leaves it `null` on rejection, and guards against setting state after unmount (the `isMounted` pattern already used in `LandingPage.tsx`). Renders `<footer data-testid="app-footer">Task Notes{version !== null && <> v<span data-testid="app-version">{version}</span></>}</footer>`, so no text node, separator or span exists without a version. Style object unchanged.
  - `frontend/src/components/LandingPage.tsx`: unchanged (it already renders `<AppFooter />`).
- Footer states (recorded per the tracker comment): loading = `Task Notes`; failure = `Task Notes`; success = `Task Notes v{version}`. Never blank, never `unknown`, never `undefined`/`null`, never a dangling ` v`.
- Routes: none.
- State management: local `useState` + `useEffect` inside `AppFooter` (`backend_frontend.md` Section 3.3, native state first). No context, no custom hook (a single consumer).
- Test attributes: existing `app-footer` kept; new `app-version` on the version span (Section 3.6).
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's existing inline style values unchanged (`fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`).

## Backend Plan
No backend changes required. `GET /api/version` already exists on main from TEST-05 and returns `{"version": "<backend [project].version>"}`; CORS already allows `GET` from the frontend origin. The tracker comment's "add a GET /api/version endpoint" is therefore satisfied by existing code, recorded here as the comment asked.

## API Integration Plan
No external API integration. (The consumed endpoint is this project's own backend; its client is frontend code under the Frontend Plan.)

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters.
- Response 200: `{"version": "0.1.0"}`. Additional fields (e.g. TEST-09's `{"version": "0.1.0", "commit": "abc1234"}`) are tolerated and ignored by this item. A `version` of `"unknown"` is the backend's unresolved sentinel and is rendered as absent.
- Any non-2xx, a network error, or a body without a non-empty string `version`: the client rejects; the footer renders without a version.

## Technology Selection
- `frontend/src/api/version.ts` (HTTP client): chose the browser's native `fetch` (already used by `notes.ts`) over adding an HTTP library such as axios, because one GET with a status check is a few lines.
- Footer data loading: chose React's built-in `useState` + `useEffect` over a data-fetching dependency (react-query, SWR), because a single mount-time request with no caching or refetch needs nothing more.
- `frontend/src/api/apiBaseUrl.ts`: chose Vite's built-in `import.meta.env` (already used by `notes.ts`) over a config library; the module only relocates the existing value so it has one source.
- No new dependency is added; `frontend/package.json` and `frontend/package-lock.json` are untouched.

## File Manifest
### New files
- [A] frontend/src/api/apiBaseUrl.ts: single source of `API_BASE_URL` (VITE_API_BASE_URL with documented default http://localhost:8010), moved out of notes.ts
- [A] frontend/src/api/version.ts: typed client for GET /api/version; rejects on non-OK, malformed body, empty version, or the backend sentinel `unknown`
- [A] frontend/src/api/version.test.ts: unit tests for the version client with `fetch` stubbed (happy path, extra field tolerated, non-OK, malformed body, sentinel, network error, VITE_API_BASE_URL override)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser spec; footer shows the version the backend's /api/version response carried, and renders without a version when that request is aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios for AC1-AC4 including the loading and failure states
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from ./apiBaseUrl instead of declaring the default and env lookup locally; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: remove the package.json import; fetch the version at runtime via fetchBackendVersion; render the version span only when resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock ../api/version; assert present path, loading path and absent path (rejection), replacing the package.json version assertion
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version alongside ../api/notes; the footer test asserts the mocked backend version instead of package.json's
- [D] e2e/tests/TEST-04_page_footer.spec.ts: re-scope: drop the frontend/package.json read and the version assertions (now TEST-08's); keep the app name, contentinfo landmark, unchanged heading/subtitle and mobile visibility checks
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: re-scope: the version no longer matches frontend/package.json; point version verification at TEST-08 and fix the stale base URL (5173 to 5183) only in lines this edit already touches
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: re-scope: remove the package.json prerequisite and step 4's package.json comparison; reference TEST-08's script for version verification

No dependency change, so no lockfile is regenerated. `README.md` and `docs/DEVELOPMENT.md` need no edit: this item changes no project structure, run configuration, dependency or test infrastructure (checked: neither file describes the footer or its version source).

## Testing Strategy
- Unit tests (Vitest, frontend; colocated `*.test.ts(x)` beside the module, matching the existing frontend convention — CLAUDE.md's `backend/tests/unit/` paths are the backend's):
  - `frontend/src/api/version.test.ts`: `fetch` stubbed with `vi.stubGlobal` exactly as `notes.test.ts` does. Cases: returns `"0.1.0"` from `{"version": "0.1.0"}` and calls `http://localhost:8010/api/version`; tolerates `{"version": "0.1.0", "commit": "abc1234"}` and still returns `"0.1.0"`; rejects with `Loading the version failed: 503 Service Unavailable` on non-OK; rejects on `{}`, on `{"version": ""}` and on `{"version": 42}`; rejects on `{"version": "unknown"}`; propagates a `fetch` rejection (network error); uses `VITE_API_BASE_URL` when set (`vi.stubEnv` + `vi.resetModules`).
  - `frontend/src/components/AppFooter.test.tsx`: `vi.mock("../api/version")`. Present: mock resolves `"9.9.9-test"` (a value appearing in neither package.json nor pyproject, so a hardcoded or build-time value cannot pass), `findByTestId("app-version")` has text `9.9.9-test` and footer text is `Task Notes v9.9.9-test`. Loading: mock returns a never-settling promise; footer `textContent` is exactly `Task Notes` and `queryByTestId("app-version")` is null. Absent: mock rejects; after `waitFor` on the mock call, footer `textContent` is exactly `Task Notes`, contains neither `undefined`, `null`, `unknown` nor a trailing ` v`, and `app-version` is absent. Keeps the existing name and contentinfo-landmark tests. The mock is called exactly once per mount.
  - `frontend/src/components/LandingPage.test.tsx`: add `vi.mock("../api/version")` resolving a fixed version; the footer test asserts that value; the other tests are unchanged.
  - Directory: colocated under `frontend/src/` (existing convention). Naming: `{module}.test.ts(x)`.
- Integration tests: not warranted. Integration Tests is ENABLED, but this item adds or modifies no router, repository or migration (`testing_standards.md` Section 6); `GET /api/version` is already covered by `backend/tests/integration/test_version_integration.py` (TEST-05), unchanged.
- E2E tests: `e2e/tests/TEST-08_footer_app_version.spec.ts` (Playwright, base URL http://localhost:5183 from `playwright.config.ts`).
  - Happy path (AC1): register `page.waitForResponse` for a URL ending in `/api/version` before `page.goto("/")`, read the response JSON's `version`, then assert `getByTestId("app-version")` has exactly that text and `getByTestId("app-footer")` contains `Task Notes v{that version}`. The backend URL is taken from the observed response, so no host or port is hardcoded in the spec (`testing_standards.md` Section 5).
  - Edge case (AC3): `page.route("**/api/version", (route) => route.abort())` before `goto("/")`; assert the footer is visible with text exactly `Task Notes` and `app-version` has count 0.
  - TEST-04's spec is re-scoped as listed in the manifest so it no longer asserts the package.json version.
  - Directory: `e2e/tests/`. File: `TEST-08_footer_app_version.spec.ts`.
- UAT scenarios: `e2e/uat/scenarios/TEST-08_footer_app_version.feature` (UAT Generation ENABLED), one scenario per criterion plus the loading/failure states; manual script in `e2e/uat/scripts/`.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source (backend GET /api/version at runtime, per tracker comment), never typed into the component | Unit | verifying it needs no navigation or interaction: the source is the client module's request URL and the component rendering a mocked value that exists in no file; asserted in version.test.ts and AppFooter.test.tsx (the AC1 E2E also compares the footer to the live response) |
| 3 | When the version cannot be resolved, the footer renders without it (no undefined, null or empty gap) | Unit | verifying it needs no navigation or interaction: it is the component's render branch for a rejected fetch, asserted in AppFooter.test.tsx (also exercised as the feature's E2E edge-case spec) |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component test; AppFooter.test.tsx is that test and runs in the Vitest suite |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | Wait for the /api/version response on load of `/`, assert `app-version` equals its `version` and the footer reads `Task Notes v{version}` | Given the stack is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the version GET /api/version returns |
| 2 | Single declared source (backend /api/version at runtime) | covered at Unit, see Criterion coverage | Given frontend/package.json says 0.0.0 and the backend reports 0.1.0, When I open the landing page, Then the footer shows 0.1.0 |
| 3 | Footer renders without the version when it cannot be resolved | covered at Unit, see Criterion coverage; also the E2E edge case aborting /api/version | Given the backend is stopped, When I reload the landing page, Then the footer reads exactly "Task Notes" with no "v", "undefined", "null" or "unknown" |
| 4 | A component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then the version-present and version-absent cases both pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: from the repository root run `docker compose up --build` and wait until the `db`, `backend` and `frontend` services are started (the frontend log shows Vite listening on port 5183).
1. In a browser open `http://localhost:8010/api/version` → the page shows JSON such as `{"version": "0.1.0"}` (it may also carry a `commit` field once TEST-09 lands). Note the `version` value.
2. Open `http://localhost:5183` → the Task Notes landing page loads with the title "Task Notes".
3. Scroll to the bottom of the page → the footer reads `Task Notes v0.1.0`, the number matching the value noted in step 1 exactly.
4. Open DevTools, Elements tab, and inspect the footer → a `<footer data-testid="app-footer">` containing a `<span data-testid="app-version">0.1.0</span>`.

### Criterion 2: The version comes from a single declared source, never typed into the component
Prerequisites: the stack from Criterion 1 is running.
1. Open `frontend/package.json` in the repository → its `"version"` field reads `0.0.0`.
2. Open `backend/pyproject.toml` → its `[project]` `version` reads `0.1.0`.
3. Open `http://localhost:5183` and read the footer → it reads `Task Notes v0.1.0` (the backend's value), **not** `v0.0.0` (the frontend bundle's value).
4. DevTools, Network tab, reload the page, select the `version` request → it is a `GET http://localhost:8010/api/version` with status 200, and its response `version` is the value the footer shows.
5. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no `package.json` import; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack from Criterion 1 is running and the landing page is open at `http://localhost:5183`.
1. DevTools, Network tab, right-click the `version` request and choose "Block request URL", then reload the page → the footer reads exactly `Task Notes`: no ` v`, no `undefined`, no `null`, no `unknown`, and no blank space after the name.
2. Inspect the footer in the Elements tab → no `data-testid="app-version"` element exists inside it.
3. Remove the block (Network request blocking panel, untick the URL) and reload → the footer reads `Task Notes v0.1.0` again.
4. In a terminal run `docker compose stop backend`, then reload `http://localhost:5183` → the page still loads (title and note form visible) and the footer reads exactly `Task Notes`.
5. Run `docker compose start backend`, wait a few seconds, reload → the footer reads `Task Notes v0.1.0`.
6. Loading state: DevTools, Network tab, set throttling to "Slow 3G" and reload → while the version request is pending the footer reads `Task Notes` with no placeholder, then changes to `Task Notes v0.1.0` when it completes. Reset throttling to "No throttling".

### Criterion 4: A component test asserts both paths
Not a UI behaviour: verify by running the suite instead. From the repository root run `npm --prefix frontend test` → Vitest passes, and the output lists `AppFooter.test.tsx` with a version-present case and a version-absent case (plus the loading case) all passing.
