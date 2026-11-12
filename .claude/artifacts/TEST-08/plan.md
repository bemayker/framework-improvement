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

Source: ClickUp task 123k99ctgch (workspace 30307190, list Validation sandbox). The tracker comment recorded under `## Re-Plan Feedback` overrides the description where they disagree; criterion 2 below is written as amended by it.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. Amended by the tracker comment: that source is the **backend's** version (`[project].version` in `backend/pyproject.toml`, already served at runtime by `GET /api/version`), fetched by the footer at runtime; a frontend built against an older backend shows the backend's version, not its own `package.json` version.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap. Per the tracker comment, the loading state and the failure state are decided explicitly (see `## Plan Overview` → Loading and failure states).
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. [...] This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: (a) the footer stops importing `frontend/package.json` and fetches `GET /api/version` at runtime through a new client `frontend/src/api/version.ts`; criterion 2 is re-read as "the backend's version". (b) Loading and failure states are decided and recorded in `## Plan Overview`: both render the app name alone ("Task Notes"), never a blank footer and never the word "unknown". (c) Backend scope, said explicitly: the item is no longer frontend-only in what it depends on, but it needs **no backend file change**, because `GET /api/version` already exists on main (TEST-05, a declared dependency of this item and done): `backend/app/routers/version.py`, `backend/app/services/version_service.py` (reads `[project].version` of the `task-notes-backend` distribution, falls back to the sentinel `unknown`), `backend/app/schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py` and `backend/tests/unit/test_version_service_unit.py`. Adding the endpoint again would duplicate TEST-05. The Backend Plan therefore reads "No backend changes required", and the backend dependency is stated here and in the API Contract instead of appearing in the manifest. (d) Assumption, recorded rather than asked: the backend's `unknown` sentinel means "the version cannot be resolved" and is treated exactly like a failed fetch (criterion 3), so the footer never prints "vunknown".
- Comment (tracker, operator note about a sandbox state reset): not acted on, because it is an operational note about the sandbox, not a requirement on this item (the dispatch carried it as such).
- The description's note "It modifies `LandingPage.tsx`": not acted on. The footer owns its own fetch, so `frontend/src/components/LandingPage.tsx` is **not modified**; only its test file changes (the footer's version text in that test now comes from a mocked client). This narrows the overlap with BUG-04.

## Plan Overview
Frontend change that rewires the existing TEST-04 footer from a build-time `package.json` import to a runtime fetch of the backend's version.

- New API client `frontend/src/api/version.ts` with one function, `getBackendVersion()`, calling `GET {API_BASE_URL}/api/version` and returning the version string, or `null` when the backend reports its `unknown` sentinel or a blank value. It throws on a non-OK response, a network error (the rejected `fetch`), and a body without a string `version` field.
- The API base URL currently lives as a private constant in `frontend/src/api/notes.ts`. A second client must not repeat it (one value, one source: `coding_standards.md` Section 5), so it moves to `frontend/src/api/baseUrl.ts`, imported by both clients; behaviour of `notes.ts` is unchanged.
- `frontend/src/components/AppFooter.tsx` fetches once on mount (the same `useEffect` plus `isMounted` guard `LandingPage.tsx` uses for notes) and holds `version: string | null` in state, initial `null`.

### Loading and failure states (decided, per the tracker comment)
| State | What the footer renders | DOM |
|---|---|---|
| Before `GET /api/version` resolves (loading) | `Task Notes` | `<footer data-testid="app-footer">` containing the name only; no `app-version` element |
| Resolved with a version, e.g. `0.1.0` | `Task Notes v0.1.0` | name plus `<span data-testid="app-version"> v0.1.0</span>` |
| Unreachable, non-OK, malformed body, or backend reports `unknown` / blank | `Task Notes` | same as loading: name only, no `app-version` element |

Why this choice: a blank footer would drop the app name the footer already showed (TEST-04) and reads as broken; `unknown` is a string a reader can mistake for a real version and is exactly the "showing a placeholder" criterion 3 rules out. Rendering the name alone keeps the footer stable while loading, so a resolved version is appended rather than the footer flickering from a placeholder. No spinner, no "Loading…" text, no retry, no error message (none was asked for).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `../../package.json` import; fetch via `getBackendVersion()` on mount; render `Task Notes` always and `<span data-testid="app-version"> v{version}</span>` only when `version` is a non-empty string. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
  - `frontend/src/api/version.ts` (new): `getBackendVersion(): Promise<string | null>`, typed response `VersionResponse = { version: string }`, plus the sentinel constant `BACKEND_UNKNOWN_VERSION = "unknown"` (mirrors `UNKNOWN_VERSION` in `backend/app/services/version_service.py`).
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of declaring it.
  - `frontend/src/components/LandingPage.tsx`: **not modified**.
- Routes: none (the footer is on `/`, which already renders `AppFooter`).
- State management: local component state in `AppFooter` (`useState<string | null>(null)`); no context or store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Keep TEST-04's existing footer values: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version span inherits them.

## Backend Plan
No backend changes required.

The feature depends on the existing `GET /api/version` (TEST-05, done; see `## Re-Plan Feedback` (c)). Its source is `[project].version` in `backend/pyproject.toml` (currently `0.1.0`), its CORS default already allows the frontend origin `http://localhost:5183` for GET, and its integration and unit tests already exist. TEST-09 (concurrent, not a dependency) may add a field to this response; the client below reads only `version` and ignores extra fields, so that change is compatible.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` on `API_BASE_URL` (`VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200 with JSON `{"version": "0.1.0"}`. The backend answers `{"version": "unknown"}` when its distribution metadata is not installed; the client maps that, and a blank string, to `null`. Extra fields are ignored. Any non-200 status, a network error, or a body whose `version` is not a string makes `getBackendVersion()` throw (`Loading the version failed: {status} {statusText}` for a non-OK response, `Loading the version failed: unexpected response shape` for a malformed body); `AppFooter` catches and renders the name only.
- Timeout and retry: none. This is the project's own backend, not an external API under `CLAUDE.md` API References, and the existing notes client sets neither; a hanging request leaves the footer in its loading state, which renders the same as the failure state.

## Technology Selection
- Version source: chose the existing backend endpoint `GET /api/version` (installed `importlib.metadata`, TEST-05) over the frontend's `package.json` import and over a Vite `define` build-time variable, because the tracker comment requires the backend's runtime version and both build-time options report the frontend bundle.
- `frontend/src/api/version.ts`: chose the native `fetch` (platform feature, already used by `notes.ts`) over adding an HTTP client library such as axios; no new dependency.
- Loading/failure state in `AppFooter`: chose React's built-in `useState` and `useEffect` (installed) over a data-fetching library (react-query or SWR, not installed) for a single one-shot GET.
- `frontend/src/api/baseUrl.ts`: no stdlib call, native feature or installed dependency covers sharing one module constant; it is the existing `notes.ts` expression moved, not new logic.
- `e2e/helpers/backendVersion.ts`: chose Node's built-in `node:fs` plus one regular expression over a TOML parser dependency, to read `[project].version` from `backend/pyproject.toml` in the specs.
- E2E unreachable-backend case: chose Playwright's built-in `page.route` (installed) over stopping the backend container mid-run.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: the single `API_BASE_URL` (from `VITE_API_BASE_URL`, default `http://localhost:8010`), moved out of `notes.ts` so both clients share one source
- [A] frontend/src/api/version.ts: `getBackendVersion()` client for `GET /api/version`, typed response, `unknown`/blank mapped to `null`, throws on non-OK, network error and malformed body
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client with `fetch` stubbed
- [D] e2e/helpers/backendVersion.ts: reads `[project].version` from `backend/pyproject.toml` for the footer specs
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: footer shows the backend version; footer shows the name only when `/api/version` is unreachable
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script that build-feature writes alongside it

### Modified files
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the backend version on mount; render the name always and the `app-version` span only when a version resolved
- [A] frontend/src/components/AppFooter.test.tsx: rewrite with `../api/version` mocked: version present, pending, failed, `null` (unknown), and the existing name and landmark tests
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it (behaviour unchanged)
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version`; the footer assertion expects the mocked backend version instead of the `package.json` version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: its version assertions read the backend version via `e2e/helpers/backendVersion.ts` instead of `frontend/package.json` (they would otherwise fail, since the footer now shows 0.1.0, not 0.0.0)
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the "matches the version field of frontend/package.json" step now names `backend/pyproject.toml` via `GET /api/version`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: same correction to the expected version source

No dependency is added or changed, so no lockfile (`frontend/package-lock.json`, `package-lock.json`, `backend/uv.lock`) is touched.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test-infrastructure change (`VITE_API_BASE_URL` already exists and keeps its default).
`frontend/src/components/LandingPage.tsx` and every backend file are deliberately absent: see `## Backend Plan` and `## Re-Plan Feedback`.

## Testing Strategy
- Unit tests (Vitest, frontend): `frontend/src/api/version.test.ts` for the client (stub `fetch` with `vi.stubGlobal`, as `notes.test.ts` does); `frontend/src/components/AppFooter.test.tsx` for the component's present, pending and absent paths (mock `../api/version` with `vi.mock`, as `LandingPage.test.tsx` mocks `../api/notes`); `frontend/src/components/LandingPage.test.tsx` updated so the page still renders the footer with the mocked backend version. The existing `frontend/src/api/notes.test.ts` must keep passing unchanged (it verifies the base-URL move, including the `VITE_API_BASE_URL` override through `vi.resetModules`).
  - Directory: co-located with the source under `frontend/src/` (the existing frontend convention; `CLAUDE.md`'s unit directory `backend/tests/unit/` is the backend's)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, as the existing frontend tests
- Backend unit tests: none new; no backend code changes. Existing `backend/tests/unit/test_version_service_unit.py` already covers the version source and its `unknown` fallback.
- Integration tests: none new; no endpoint added or modified. Existing `backend/tests/integration/test_version_integration.py` already covers `GET /api/version` returning the `backend/pyproject.toml` version.
  - Directory: `backend/tests/integration/`
- E2E tests: the footer showing the backend version on `/` against the running stack (proves the browser-to-backend wiring, including CORS, which only a browser exercises), and the feature's edge-case spec: with `**/api/version` aborted through `page.route`, the footer shows `Task Notes` with no `app-version` element and no `undefined`/`null`/`unknown` text. The TEST-04 spec's version assertions are repointed to the backend version.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version from GET /api/version in the landing page footer` | — |
| 2 | The version comes from a single declared source (the backend's version, fetched at runtime), never a string typed into the component | Unit | `renders the version returned by the backend rather than the frontend package version`, `fetches GET /api/version from the default base URL and returns the version` | verifying it needs no navigation or interaction: it is which source the component and client read, asserted by mocking the client with a version distinct from `frontend/package.json` and by asserting the client's URL; the backend side is already covered by `test_get_version_returns_200_with_version_from_pyproject` |
| 3 | When the version cannot be resolved, the footer renders without it (no `undefined`, `null` or empty gap); loading and failure states as recorded | Unit | `renders only the app name while the version request is pending`, `renders only the app name when the version request fails`, `renders only the app name when the backend reports no version`, `returns null when the backend reports the unknown sentinel`, `throws when the response body has no version string` | verifying it needs no navigation or interaction: it is a render branch on a resolved, rejected or pending promise; the E2E edge-case spec `renders the footer without a version when /api/version is unreachable` additionally exercises it in the browser |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version returned by the backend rather than the frontend package version`, `renders only the app name when the version request fails` | the criterion itself names a component test, which is a unit-tier Vitest test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")`, expect `getByTestId("app-version")` to contain the `backend/pyproject.toml` version read by `e2e/helpers/backendVersion.ts` | Given the stack is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the backend's version |
| 2 | Single declared source: the backend version at runtime | covered at Unit, see Criterion coverage | Given the backend version (0.1.0) differs from the frontend package version (0.0.0), When I open the landing page, Then the footer shows 0.1.0 |
| 3 | Footer renders without the version when it cannot be resolved | covered at Unit, see Criterion coverage; edge-case spec aborts `**/api/version` and expects the footer text to be exactly "Task Notes" | Given requests to /api/version are blocked, When I open the landing page, Then the footer reads "Task Notes" with no version, "undefined", "null" or "unknown" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they pass with 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repository root with `docker compose up -d --build` (backend on http://localhost:8010, frontend on http://localhost:5183); `backend/pyproject.toml` has `version = "0.1.0"` under `[project]`.
1. Open http://localhost:8010/api/version in the browser → the page shows `{"version":"0.1.0"}`.
2. Open http://localhost:5183/ → the landing page shows the heading "Task Notes" and the note form.
3. Scroll to the bottom of the page and read the footer → it reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not from the frontend package
Prerequisites: as Criterion 1; `frontend/package.json` has `"version": "0.0.0"`, so the two sources differ.
1. Open http://localhost:5183/ and read the footer → it reads `Task Notes v0.1.0`, the backend's version, and does not contain `0.0.0`.
2. Open DevTools → Network, reload the page, filter on `version` → one `GET http://localhost:8010/api/version` request with status 200 and response `{"version":"0.1.0"}`.
3. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no `package.json` import; the version comes from `getBackendVersion()`.

### Criterion 3: The footer renders without the version when it cannot be resolved
Prerequisites: as Criterion 1, in Chrome.
1. Open http://localhost:5183/, open DevTools → Network, reload, right-click the `version` request and choose "Block request URL" → the URL `http://localhost:8010/api/version` appears under Network request blocking.
2. Reload the page → the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap after the name.
3. In DevTools Network conditions, set throttling to "Slow 3G", unblock the URL and reload → while the request is pending the footer reads `Task Notes`; when it completes it reads `Task Notes v0.1.0` without the footer changing position.
4. Remove the request block and reset throttling to "No throttling" → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the tests "renders the version returned by the backend rather than the frontend package version" and "renders only the app name when the version request fails" are listed, with `0 failed`.
2. Run `npm --prefix frontend test -- src/api/version.test.ts src/components/LandingPage.test.tsx src/api/notes.test.ts` → `0 failed`.
