# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written in the description):**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> **Superseded in part by the newest tracker comment** (see Re-Plan Feedback): the version must come from the backend at runtime through `GET /api/version`, not from `package.json` at build time.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, the backend's `GET /api/version` fetched at runtime (amended by the tracker comment, replacing "frontend package metadata or a build-time variable"), never a string typed into the component.
- [ ] 3. When the version cannot be resolved (the request fails, answers non-OK, answers an unexpected shape, or the backend reports its `unknown` sentinel), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap: it reads exactly `Task Notes`.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. A frontend built against a different backend shows the backend's version, not its own `package.json` version (added by the tracker comment).
- [ ] 6. Before the `GET /api/version` request resolves, the footer reads exactly `Task Notes`, with no placeholder text (added by the tracker comment: loading state decided and recorded).

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 is amended and criterion 5 added. The comment overrides the description's "frontend package metadata or a build-time variable". `AppFooter.tsx` drops its `import { version } from "../../package.json"` and fetches the version through a new client, `frontend/src/api/version.ts`. **On "Add a GET /api/version endpoint":** this endpoint already exists on main (TEST-05: `backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`). It returns `{"version": "<[project].version of backend/pyproject.toml>"}`, which is the backend's own version, and the CORS middleware already allows `GET` from `http://localhost:5183`. So no backend file is created or modified, and the backend half of the request is already satisfied. Re-adding the endpoint would duplicate TEST-05.
- Comment (tracker), part 2: "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: the decision is **the footer always renders and always shows the app name. The version part appears only once a real version has resolved.**
  - Loading (before the fetch resolves): the footer reads exactly `Task Notes`, with no "loading…" placeholder and no spinner (criterion 6). Reason: in normal operation the request finishes within one frame on a local API, and a placeholder would flash.
  - Failure (unreachable, non-OK, malformed body): the footer reads exactly `Task Notes`, not blank and not `unknown` (criterion 3). Reason: the description's criterion 3 asks for "renders without it". A footer reading `unknown` would claim knowledge of the version, and a blank footer would lose the app name TEST-04 shipped.
  - The backend's own `unknown` sentinel (returned by `version_service.get_app_version` when the distribution metadata is missing) is treated as unresolved too, so the footer never prints `vunknown`. This is an assumption: the comment contrasts "blank" with "unknown", and criterion 3 excludes non-values.
  - Loading and failure look the same on screen by design. The version element (`data-testid="app-footer-version"`) is absent in both, and that absence is what tests assert.
- Comment (tracker), part 3: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Backend Plan`. The item is **no longer frontend-only in behaviour**: the footer now depends at runtime on the backend's `GET /api/version`, and on the backend being up and CORS allowing the frontend origin. It still needs **no backend file change**, because TEST-05 already ships that endpoint. The File Manifest therefore carries no `[B]` entry, and this is deliberate rather than an omission. A partial deploy whose backend predates TEST-05 would answer 404, and the footer then renders the failure state.
- Assumption (description note): the description says the item "modifies `LandingPage.tsx`". This plan does **not** modify `frontend/src/components/LandingPage.tsx`, because the fetch lives inside `AppFooter`, which keeps the footer self-contained. Only `LandingPage.test.tsx` changes: it asserts the `package.json` version in the footer and must now mock the version client. This also narrows the overlap with BUG-04 to the test file.

## Plan Overview
The footer gets its version from the backend at runtime instead of from `frontend/package.json` at build time. The steps:
- Add a typed fetch client `frontend/src/api/version.ts` with `getVersion()`, which calls the existing `GET /api/version`.
- Move the API base URL (today a private constant in `frontend/src/api/notes.ts`) into one shared module, `frontend/src/api/baseUrl.ts`, so the default `http://localhost:8010` and the `VITE_API_BASE_URL` override have one source (`coding_standards.md` Section 5, "one value, one source").
- `AppFooter` fetches on mount and renders `Task Notes` plus, once resolved, ` v{version}`.

Tests follow the existing patterns:
- client tests stub `fetch`;
- component tests mock the client module;
- a new Playwright spec reads the version from the page's own `/api/version` response;
- TEST-04's spec and UAT artifacts, which hard-assert `frontend/package.json`'s version, are updated so they stay true.

Layers touched: frontend only (components, api). Backend: none, because the endpoint already exists (see Re-Plan Feedback).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx` (modify):
    - Remove the `package.json` import.
    - Add `useState<string | null>(null)` and a mount `useEffect` that calls `getVersion()`, guarded by an `isMounted` flag like `LandingPage.tsx`'s notes load.
    - On resolve with a non-null string, store it. On rejection, keep `null`.
    - Render `<footer data-testid="app-footer" style={footerStyle}>Task Notes{version && <span data-testid="app-footer-version"> v{version}</span>}</footer>`. The span is not rendered at all when `version` is null, so the text is exactly `Task Notes` with no trailing space. `footerStyle` and `APP_NAME` are unchanged.
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts` (modify): imports `API_BASE_URL` from `./baseUrl` instead of declaring its own. There is no behaviour change, and `notes.test.ts`'s `vi.resetModules()` + dynamic import keeps working because `baseUrl.ts` is re-evaluated too.
  - `frontend/src/api/version.ts` (new): `getVersion(): Promise<string | null>`.
    - Fetches `${API_BASE_URL}/api/version`.
    - Non-OK: throws `Loading the version failed: {status} {statusText}`, the same message shape as `notes.ts`.
    - Body whose `version` is not a non-empty string: throws `Unexpected version response`.
    - Returns `null` when the backend reports its `unknown` sentinel, held as `UNRESOLVED_BACKEND_VERSION = "unknown"` in this module, with a comment naming `version_service.UNKNOWN_VERSION` as its origin.
    - Exports type `VersionResponse = { version: string }`.
- Routes: none (landing page `/` only).
- State management: local component state in `AppFooter`. No global store.
- Design reference notes: AI freestyle. The existing footer style is kept as is (`fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`), and the version span inherits it.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main from TEST-05 and returns the backend's own version (`backend/app/routers/version.py`, `backend/app/services/version_service.py`). It is registered in `backend/app/main.py`, its CORS allows `GET` from `http://localhost:5183`, and `backend/tests/integration/test_version_integration.py` covers it. The tracker comment asks for a backend change, so this is stated here explicitly: the item now **depends** on the backend at runtime but **edits** no backend file.

## API Integration Plan
No external API integration. The footer consumes this project's own backend through `frontend/src/api/version.ts`.

## API Contract
- Method: GET
- URL: `/api/version` (from the frontend: `${VITE_API_BASE_URL ?? "http://localhost:8010"}/api/version`)
- Request: no body, no parameters
- Response: `200 OK`, `{"version": "0.1.0"}` (the value is `[project].version` of `backend/pyproject.toml`; it is `"unknown"` when the backend's distribution metadata is not installed)
- Errors as handled by the client: a network failure rejects the fetch and is propagated; non-2xx throws `Loading the version failed: {status} {statusText}`; a missing, non-string or empty `version` throws `Unexpected version response`. `AppFooter` absorbs all three and renders `Task Notes`.

## Technology Selection
- `frontend/src/api/version.ts` (version client): chose the browser's native `fetch`, following `frontend/src/api/notes.ts`, over adding an HTTP library (axios, ky). `fetch` covers one GET with a JSON body.
- Version state in `AppFooter`: chose React's built-in `useState` + `useEffect` (already installed) over a data-fetching dependency (React Query, SWR). One request on mount needs no cache or retry layer.
- `frontend/src/api/baseUrl.ts`: no stdlib call, native platform feature or installed dependency covers sharing one constant between two modules, so it is built here as a two-line module. It is chosen over duplicating the default URL in `version.ts`, which `coding_standards.md` Section 5 forbids ("one value, one source").
- `e2e/tests/TEST-08_footer_app_version.spec.ts`: chose the installed `@playwright/test`, with its `page.waitForResponse` and `page.route`, over any new test dependency.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of the API base URL (`VITE_API_BASE_URL` or the `http://localhost:8010` default), shared by the notes and version clients
- [A] frontend/src/api/version.ts: `getVersion()` client for `GET /api/version`, with typed response, non-OK and shape errors, and `unknown` sentinel mapped to `null`
- [A] frontend/src/api/version.test.ts: Vitest tests for `getVersion` with `fetch` stubbed (success, non-OK, malformed body, sentinel, base URL)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec; the footer shows the version the page's own `/api/version` response carries, and shows only `Task Notes` when that request is aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus the failure edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it locally (no behaviour change)
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the version via `getVersion()` on mount; render the `app-footer-version` span only once a version resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; replace the `package.json` assertion with the present, absent (failure, sentinel), loading and backend-over-frontend tests
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` alongside `../api/notes`; the footer test asserts the mocked backend version instead of `package.json`'s
- [D] e2e/tests/TEST-04_page_footer.spec.ts: stop reading `frontend/package.json`; assert the footer contains the version from the page's own `/api/version` response (it would otherwise fail, since backend `0.1.0` differs from frontend `0.0.0`)
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the "matches the version field of frontend/package.json" step now reads "matches the version GET /api/version returns"
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisite and step 4 compare the footer to `GET /api/version` instead of `frontend/package.json`

No lockfile entry: this feature adds no dependency. No `README.md` or `docs/DEVELOPMENT.md` edit: no project structure, run configuration, dependency or test infrastructure changes (neither file mentions the footer's version source).

## Testing Strategy
- Unit tests:
  - Frontend (Vitest): `getVersion` in `frontend/src/api/version.test.ts`, with `fetch` stubbed via `vi.stubGlobal` as in `notes.test.ts`. `AppFooter` in `frontend/src/components/AppFooter.test.tsx`, with `vi.mock("../api/version")`.
  - `LandingPage.test.tsx`: its existing footer test is adapted to the mocked version client, and its other tests stay as they are.
  - Backend unit tests: not warranted, because no backend code changes. `version_service` is already covered by `backend/tests/unit/test_version_service_unit.py`.
  - Directory: co-located with the source, `frontend/src/**` (`project-standards.md` Naming: co-located `{Name}.test.tsx` / `{module}.test.ts`)
  - Naming: `{Name}.test.tsx` / `{module}.test.ts`
- Integration tests: none added. The only endpoint involved, `GET /api/version`, is unchanged, and `backend/tests/integration/test_version_integration.py` already covers it (200 with the pyproject version, and 405 on POST).
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 (the footer on the real landing page shows the version the real backend returns), plus the feature's edge-case spec (`/api/version` aborted via `page.route`, so the footer reads exactly `Task Notes`).
  - Both specs match the request on `new URL(url).pathname === "/api/version"`, never a substring or loose glob. Vite serves `src/api/version.ts` from a URL that contains `/api/version`, the same trap TEST-03's spec documents for `/api/notes`.
  - `TEST-04_page_footer.spec.ts` is updated so it no longer asserts `package.json`'s version.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus the unreachable-backend edge scenario; TEST-04's scenario step updated.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the version GET /api/version returns in the landing page footer` | — |
| 2 | The version comes from the backend's GET /api/version at runtime, never a string typed into the component | Unit | `renders the version the backend reports`, `returns the version the backend reports, from the default base URL` | verifying the source needs no navigation or interaction: mocking the client proves the rendered text is whatever the client returns, and the client test proves it is the `/api/version` body |
| 3 | When the version cannot be resolved, the footer reads exactly `Task Notes` (no undefined, null, unknown or gap) | Unit | `renders only the app name when the version request fails`, `renders only the app name when the backend reports the unknown sentinel`, `throws with the status and reason when the response is not OK`, `throws when the response carries no version string` | it is a rendering rule over a failed promise, which a component test drives deterministically; the E2E edge spec `renders only the app name when GET /api/version is unreachable` adds the browser check |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version the backend reports`, `renders only the app name when the version request fails` | the criterion is itself about the component test |
| 5 | A frontend built against a different backend shows the backend's version, not its own | Unit | `shows the backend's version, not the frontend package version` | it is a data-source rule: the test mocks the client to return `9.9.9` and asserts the footer shows `v9.9.9` and not `package.json`'s version, with no navigation needed |
| 6 | Before the version request resolves, the footer reads exactly `Task Notes` | Unit | `renders only the app name while the version request is pending` | a pending promise is deterministic only with a mocked client; in a browser the local request resolves too fast to observe |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Wait for the page's `GET /api/version` response (pathname match) while `page.goto("/")` runs, read `version` from its JSON, and expect `getByTestId("app-footer")` to contain `Task Notes` and `v{version}` | Given the app is running, When I open the landing page, Then the footer shows "Task Notes v" followed by the version the backend reports |
| 2 | Version comes from GET /api/version | covered at Unit, see Criterion coverage | Given the backend reports version X, When I open the landing page, Then the footer shows vX |
| 3 | Unresolved version renders `Task Notes` only | covered at Unit, see Criterion coverage; E2E edge spec aborts `/api/version` via `page.route` and expects the footer text to equal `Task Notes` and `app-footer-version` to have count 0 | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version and no "unknown" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When AppFooter.test.tsx runs, Then it passes |
| 5 | Backend version wins over the frontend's own | covered at Unit, see Criterion coverage | Given frontend package.json says 0.0.0 and the backend reports 0.1.0, When I open the landing page, Then the footer shows v0.1.0 |
| 6 | Loading state shows `Task Notes` only | covered at Unit, see Criterion coverage | Given the version request is slow, When the landing page first renders, Then the footer reads "Task Notes" until the version arrives |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running with `docker compose up -d` from the repository root (frontend on http://localhost:5183, backend on http://localhost:8010).
1. In a terminal, run `curl -s http://localhost:8010/api/version` → the output is `{"version":"0.1.0"}` (or whatever `[project].version` in `backend/pyproject.toml` currently says); note that value.
2. In a browser, open `http://localhost:5183/` → the landing page shows the "Task Notes" heading and the note form.
3. Scroll to the bottom of the page and read the footer → it reads `Task Notes v0.1.0`, with the version exactly equal to the value noted in step 1.

### Criterion 2: The version comes from the backend's GET /api/version at runtime
Prerequisites: as for Criterion 1; browser DevTools available.
1. Open DevTools, go to the Network tab, then reload `http://localhost:5183/` → a request to `http://localhost:8010/api/version` appears with status 200.
2. Click that request and open its Response tab → it shows `{"version":"0.1.0"}`.
3. Compare to the footer → the footer's version is the same string as the response body's `version`.
4. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no `package.json` import; the version comes from `getVersion()`.

### Criterion 3: An unresolved version renders the footer without it
Prerequisites: as for Criterion 1.
1. Run `docker compose stop backend` → the backend container stops; `curl -s http://localhost:8010/api/version` now fails to connect.
2. Reload `http://localhost:5183/` and read the footer → it reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap.
3. Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers again, then reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains the tests `renders the version the backend reports` (present path) and `renders only the app name when the version request fails` (absent path).

### Criterion 5: The backend's version wins over the frontend's own
Prerequisites: as for Criterion 1.
1. Open `frontend/package.json` and read its `version` field → it is `0.0.0` at the time of writing.
2. Run `curl -s http://localhost:8010/api/version` → it reports `0.1.0`, a different value.
3. Open `http://localhost:5183/` and read the footer → it reads `Task Notes v0.1.0` (the backend's version), and `0.0.0` appears nowhere in it.

### Criterion 6: Before the version request resolves, the footer reads `Task Notes`
Prerequisites: as for Criterion 1; Chrome DevTools available.
1. Open DevTools, Network tab, set throttling to `Slow 3G`, then reload `http://localhost:5183/` → the page renders progressively.
2. Watch the footer while the `/api/version` request is still pending in the Network tab → the footer reads exactly `Task Notes`, with no placeholder text such as "loading".
3. When the `/api/version` request completes → the footer changes to `Task Notes v0.1.0`.
4. Set throttling back to `No throttling`.
