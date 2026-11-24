# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> ## What
>
> The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> ## Acceptance criteria
>
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> ## Notes
>
> Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

## Acceptance Criteria
<!-- Criterion 2 and 3 are amended by the tracker comment recorded under Re-Plan Feedback: a comment overrides the description where the two disagree. -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. (amended by tracker comment) The version comes from a single declared source, the backend's own version served at runtime by `GET /api/version`, never from `frontend/package.json` at build time and never a string typed into the component. A frontend running against a backend of a different version shows the backend's version, not its own.
- [ ] 3. (amended by tracker comment) While the version request is pending, and when the version cannot be resolved (`/api/version` unreachable, non-OK, malformed, or reporting the backend's `unknown` sentinel), the footer renders `Task Notes` without a version, rather than `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: criterion 2 rewritten so the source is the backend at runtime; `AppFooter` fetches `GET /api/version` through a new client `frontend/src/api/version.ts` and no longer imports `frontend/package.json`.
- Comment (tracker), the "add a GET /api/version endpoint" part → Not acted on as a code change, because the endpoint already exists on the plan base (cfa85c39): TEST-05 shipped `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py`, registered in `backend/app/main.py`, returning `{"version": "<[project].version of backend/pyproject.toml>"}` via `importlib.metadata`, with integration tests in `backend/tests/integration/test_version_integration.py`. So, stated explicitly as the comment asks: this item is no longer frontend-only in its dependency, because it now relies on a backend endpoint, but it makes no backend file change, and the File Manifest therefore carries no `[B]` entry. The existing endpoint is the contract the footer consumes (see API Contract) and its existing integration test is cited as coverage for criterion 2.
- Comment (tracker), loading and failure states → Decision recorded: the footer always renders, and always reads `Task Notes`. The ` v{version}` suffix (inside `data-testid="app-version"`) is added only once a usable version has arrived. Pending: `Task Notes` (no suffix, no placeholder, no spinner). Failure (network error, non-2xx, a body without a non-empty string `version`, or the backend's own `"unknown"` sentinel): `Task Notes` (no suffix). Chosen over a blank footer, because the footer's app-name half is static and TEST-04's landmark and name must not disappear when the API is down, and chosen over a footer reading `unknown`, because criterion 3 of the item asks for the footer to render without the version rather than with a stand-in, and a literal `unknown` in a footer is exactly the stand-in it rules out. Consequence named so nobody reads it as a defect: pending and failed look the same, so a reader can tell "version known" from "version not known", but not "not yet" from "not available"; the failure is visible in the browser's network panel, and the backend logs its own warning when it serves `unknown`.
- Comment (tracker), the backend's `"unknown"` sentinel → Assumption recorded: `version_service.get_app_version()` returns the string `unknown` when its package metadata is missing. The footer treats that value as unresolved (criterion 3), so it never prints `vunknown`. The comparison is against the literal `unknown`, defined once as a named constant in `frontend/src/api/version.ts`.
- Not acted on, observed while reading: `docs/DEVELOPMENT.md` line 28 says `GET /api/version` reports the first 12 characters of `BUILD_COMMIT`; the code on the plan base does not (TEST-09's change is absent after the sandbox reset). It is not this item's criterion, so it is left for the item that owns that endpoint's commit field.

## Plan Overview
Frontend-only code change that consumes an existing backend endpoint. `AppFooter` stops importing `frontend/package.json` and instead requests `GET /api/version` once on mount through a new typed client module, rendering `Task Notes v{version}` once the backend answers with a usable version and `Task Notes` before that or on any failure. The deployment-dependent API base URL, today private to `frontend/src/api/notes.ts`, moves to one shared module so both clients read the same source. The TEST-04 E2E spec, its UAT scenario and its manual script currently assert the footer shows `frontend/package.json`'s version; they are updated to the backend's version, since this item deliberately changes what the footer shows (otherwise the TEST-04 spec fails in CI: frontend `0.0.0` versus backend `0.1.0`). `LandingPage.tsx` is not modified; only its test changes.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`, so the base URL has one source (the "one value, one source" rule of `coding_standards.md`, deployment-dependent values).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of defining it; no behaviour change.
  - `frontend/src/api/version.ts` (new): `getBackendVersion(): Promise<string | null>`. Fetches `${API_BASE_URL}/api/version`. Throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response, like the notes client. Returns the `version` string when the body is an object whose `version` is a non-empty string other than the sentinel `UNKNOWN_BACKEND_VERSION = "unknown"`; returns `null` for a well-formed answer that carries no usable version (empty string or `unknown`), and throws on a malformed body. Network errors propagate as the rejected `fetch` promise.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import. `useState<string | null>(null)`; `useEffect` on mount calls `getBackendVersion()`, sets the state on resolve, leaves it `null` on reject, with the same `isMounted` guard `LandingPage.tsx` uses. Render `<footer data-testid="app-footer" style={footerStyle}>Task Notes{version !== null && <span data-testid="app-version"> v{version}</span>}</footer>`, so the unresolved text content is exactly `Task Notes` with no trailing space. `APP_NAME` constant and `footerStyle` unchanged.
- Routes: none new.
- State management: local component state in `AppFooter` (no shared state; `LandingPage` is untouched and keeps rendering `<AppFooter />`).
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer style is kept as is: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version suffix inherits it.

## Backend Plan
No backend changes required. The endpoint the tracker comment asks for, `GET /api/version`, already exists on the plan base (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`). CORS already admits the frontend origin for `GET` (`backend/app/core/config.py` default `http://localhost:5183`, `main.py` `allow_methods=["GET", "POST"]`). This item depends on that endpoint at runtime and changes none of it.

## API Integration Plan
No external API integration. The footer consumes this project's own backend through `frontend/src/api/version.ts`, the same client-layer pattern `frontend/src/api/notes.ts` follows.

## API Contract
- Method: GET
- URL: `/api/version` (absolute: `${VITE_API_BASE_URL ?? "http://localhost:8010"}/api/version`)
- Request: no body, no query, no headers beyond the browser's defaults.
- Response: 200, `application/json`, `{"version": "0.1.0"}` where the value is `[project].version` of `backend/pyproject.toml` as installed; `{"version": "unknown"}` when the backend's package metadata is missing (the endpoint never answers 500 for that case).
- Client interpretation: non-empty string other than `unknown` → shown as ` v{version}`; `unknown` or empty string → not shown; non-2xx, network error, or a body without a string `version` → not shown.

## Technology Selection
- Version HTTP client (`frontend/src/api/version.ts`): chose the platform `fetch` over adding an HTTP library (axios or similar), because the notes client already uses `fetch` and one GET needs nothing more.
- Footer data loading: chose React's installed `useState`/`useEffect` over a data-fetching library (TanStack Query, SWR), because none is installed and one request on mount with no caching or refetching does not warrant a dependency.
- Shared base URL (`frontend/src/api/baseUrl.ts`): no stdlib call, native platform feature or installed dependency covers it, so it is a three-line module moved out of `notes.ts`; chosen over a second copy of the default in `version.ts`, which would give one deployment-dependent value two sources.
- Response validation: chose a `typeof` check in `version.ts` over a schema library (zod is not installed), because the body has one string field.
- Expected version in the E2E specs: chose Node's `fs.readFileSync` plus a regular expression on `backend/pyproject.toml`'s `version = "..."` line over a TOML parser dependency, because Node has no TOML parser in its standard library and the one line is fixed-format; the TEST-04 spec already reads a file the same way.
- No new dependency is added, so no lockfile changes.

## File Manifest
<!-- Phase tags follow the plan-feature template. No [B]: see Backend Plan and Re-Plan Feedback. -->
### New files
- [A] frontend/src/api/baseUrl.ts: the one source of the API base URL (`VITE_API_BASE_URL` with the `http://localhost:8010` default), moved from notes.ts
- [A] frontend/src/api/version.ts: typed client for GET /api/version, `getBackendVersion()`, with the `unknown` sentinel constant and non-OK and malformed-body handling
- [A] frontend/src/api/version.test.ts: Vitest unit tests of the version client with `fetch` stubbed (OK, sentinel, non-OK, malformed body)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec, footer shows the backend version from pyproject.toml, and shows only the app name when /api/version is aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import API_BASE_URL from ./baseUrl instead of defining it; behaviour unchanged
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version on mount, render `Task Notes` plus ` v{version}` only when resolved; drop the package.json import
- [A] frontend/src/components/AppFooter.test.tsx: mock ../api/version; cover present, pending, failed and `unknown` paths; keep the name and landmark tests
- [A] frontend/src/components/LandingPage.test.tsx: also mock ../api/version and assert the footer shows the mocked backend version instead of package.json's
- [D] e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from backend/pyproject.toml instead of frontend/package.json, since the footer now shows the backend's version
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step now names backend/pyproject.toml (served by /api/version) instead of frontend/package.json
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare the footer to backend/pyproject.toml instead of frontend/package.json

No dependency is added or changed, so no lockfile is listed. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: frontend Vitest. `version.test.ts` drives the real client with `fetch` stubbed (the `notes.test.ts` pattern): usable version returned, sentinel and empty string return `null`, non-OK throws with status and reason, malformed body throws, the default base URL is used. `AppFooter.test.tsx` mocks `../api/version` and covers the present path, the pending path, the rejected path and the sentinel path, plus the existing name and landmark tests. `LandingPage.test.tsx` mocks `../api/version` so it no longer depends on the network.
  - Directory: beside the source file under `frontend/src/` (project-standards Layout)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: no new integration test, because no backend code changes. The existing `backend/tests/integration/test_version_integration.py` already covers the endpoint this item consumes and is cited for criterion 2.
  - Directory: backend/tests/integration/
- E2E tests: one spec for this item with two tests: the landing page footer shows the backend's version (criterion 1), and the edge case, `/api/version` aborted with `page.route`, leaves the footer reading exactly `Task Notes` with no `app-version` element. The TEST-04 spec is updated to expect the backend's version. Expected version read from `backend/pyproject.toml`.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version from /api/version in the landing page footer` | E2E row: verifying it needs the page loaded in a browser against the running backend |
| 2 | The version comes from the backend at runtime via GET /api/version, never package.json or a literal | Unit | `renders the backend version once /api/version resolves`, `returns the version the backend reports, from the default base URL`, `test_get_version_returns_200_with_version_from_pyproject` | verifying it needs no navigation or interaction: it is a data-source rule, proven by the component rendering whatever the mocked client returns (no bundle value involved), the client calling /api/version, and the existing integration test tying that endpoint to pyproject.toml |
| 3 | Pending or unresolvable version renders `Task Notes` without `undefined`, `null`, `unknown` or a gap | Unit | `renders only the app name while the version request is pending`, `renders only the app name when the version request fails`, `renders only the app name when the backend reports the unknown sentinel`, `returns null when the backend reports the unknown sentinel`, `throws when the response has no string version` | verifying it needs no navigation or interaction: it is a rendering rule over the client's result; the E2E edge-case spec `shows only the app name when /api/version is unreachable` exercises it once more in the browser |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the backend version once /api/version resolves`, `renders only the app name when the version request fails` | verifying it needs no navigation or interaction: the criterion is itself a component-test requirement |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Goto `/`, expect `app-footer` to contain `Task Notes` and `app-version` to contain `v{pyproject version}` | Given the stack is running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" (backend/pyproject.toml's version) |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given frontend/package.json says 0.0.0 and backend/pyproject.toml says 0.1.0, When I open the landing page, Then the footer shows v0.1.0 |
| 3 | Pending or unresolvable version renders only the app name | covered at Unit, see Criterion coverage; edge-case spec aborts /api/version and expects exactly `Task Notes` | Given the backend is stopped, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test covers present and absent | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running (`docker compose up -d --build` from the repository root), and `backend/pyproject.toml` has `version = "0.1.0"`.
1. Open `http://localhost:5183/` in a browser → the landing page shows the "Task Notes" heading, the note form and the note list.
2. Scroll to the bottom of the page → the footer reads `Task Notes v0.1.0`.
3. Open DevTools, Network tab, reload the page → one request to `http://localhost:8010/api/version` with status 200 and response `{"version":"0.1.0"}`.

### Criterion 2: The version comes from the backend at runtime, not from the frontend bundle
Prerequisites: as for criterion 1; `frontend/package.json` has `"version": "0.0.0"`.
1. Open `frontend/package.json` and read its `version` field → `0.0.0`.
2. Run `curl -s http://localhost:8010/api/version` → `{"version":"0.1.0"}`.
3. Open `http://localhost:5183/` and read the footer → `Task Notes v0.1.0`, the backend's value, not `v0.0.0`.
4. Open `frontend/src/components/AppFooter.tsx` → it contains no `package.json` import and no version literal; the value comes from `getBackendVersion()` in `frontend/src/api/version.ts`.

### Criterion 3: Pending or unresolvable version renders only the app name
Prerequisites: as for criterion 1.
1. Open `http://localhost:5183/`, DevTools, Network tab, set throttling to "Slow 3G", reload → until the `/api/version` request completes the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or trailing gap; once it completes it reads `Task Notes v0.1.0`.
2. Set throttling back to "No throttling". Run `docker compose stop backend` from the repository root.
3. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`; the Network tab shows the `/api/version` request failed; the rest of the page still renders.
4. Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers, reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: no failed or errored test on the summary line, exit code 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains `renders the backend version once /api/version resolves` (version present) and `renders only the app name when the version request fails` (version absent).
