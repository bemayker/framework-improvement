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
<!-- Criteria 1 to 4 are the description's, with criterion 2 and 3 amended by the newest tracker comment (it overrides the description where they disagree). Criterion 5 is the comment's own requirement, made explicit so it has a covering test. -->
- [ ] 1. The footer renders the version string on the landing page, and that string is the version the backend reports at runtime.
- [ ] 2. The version comes from a single declared source, the backend's own version served by `GET /api/version` at runtime (backend/pyproject.toml `[project].version`, read from installed package metadata), never from `frontend/package.json`, a build-time variable, or a string typed into the component. A frontend rebuilt against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved (request still pending, backend unreachable, non-OK response, malformed body, or the backend's `unknown` sentinel), the footer renders the app name alone, `Task Notes`, rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. `GET /api/version` returns the backend's version as `{"version": "<semver>"}`.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 rewritten to make the backend the single source; `AppFooter.tsx` drops its `package.json` import and fetches `GET /api/version` through a new client module `frontend/src/api/version.ts`. The endpoint itself already exists on main at plan base e8e068c6 (`backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`, registered in `backend/app/main.py`, added by TEST-05; it returns `{"version": ...}` from the installed `task-notes-backend` metadata, i.e. `backend/pyproject.toml` version `0.1.0`), with integration tests in `backend/tests/integration/test_version_integration.py`. It is therefore reused, not re-added: re-adding it would be the duplicate work the item's dependency graph exists to prevent. Criterion 5 records the endpoint requirement and is covered by those existing tests.
- Comment (tracker): "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: decision recorded here and in criterion 3. **Loading state:** the footer renders `Task Notes` (app name only), no spinner, no placeholder text, no reserved space. **Failure state** (network error, non-OK status, a body without a non-empty `version` string, or the backend's own `unknown` sentinel from `version_service.UNKNOWN_VERSION`): the footer renders `Task Notes` alone, identical to the loading state. It is neither blank (the footer and its `contentinfo` landmark always render with the app name) nor `unknown`. Reason: the description's criterion 3 already asks for "renders without it" rather than a placeholder, and a version string is only worth showing when it is the real one; `unknown` would read as a version. The version is rendered in its own `<span data-testid="app-version">` that is absent from the DOM until a real version arrives, so "absent" is assertable and there is no trailing space or gap.
- Comment (tracker): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in the Plan Overview and Backend Plan. The item is no longer frontend-only in its dependencies: it now depends at runtime on the backend's `GET /api/version` and on the backend's CORS allowing the frontend origin for `GET` (already true in `backend/app/main.py`). It needs **no backend file change** because the endpoint is already on main, so the File Manifest carries no `[B]` entry and the Backend Plan says so; the backend's existing version tests are named as this item's coverage for criterion 5. The description's "Touches no backend file" remains literally true for the diff, but the parallelism claim against backend items is weaker: a backend item that changed `/api/version`'s shape (TEST-09's slice, CHORE-01) would now affect this footer.
- Comment (tracker): the ~50 other comments (mayker-dev "PR opened" notes from earlier runs and one 2026-09-07 operator reset note) → not acted on because they carry no requirement, per the dispatch's summary of them.
- Merged since the last plan: n/a (fresh plan, no prior plan.md for TEST-08; branched from current main e8e068c6).

## Plan Overview
The landing-page footer (`AppFooter`, rendered by `LandingPage`) stops importing `frontend/package.json` and instead fetches the backend's version from the existing `GET /api/version` on mount, through a new typed client module beside the notes client. It renders `Task Notes v{version}` once a real version arrives and `Task Notes` alone while loading or on any failure. The backend base URL, currently a private constant in `api/notes.ts`, moves to one shared module so both clients read one source. Backend: no file changes; the endpoint already exists on main (TEST-05) and its tests cover criterion 5. This is a frontend diff with a backend runtime dependency, which the tracker comment asked to be called out. Existing tests that assert the `package.json` version (the AppFooter and LandingPage component tests, the TEST-04 E2E spec and its UAT artifacts) are updated, because the footer's version now legitimately differs from `frontend/package.json` (`0.0.0` frontend vs `0.1.0` backend).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx`: remove `import { version } from "../../package.json"`. Add `useState<string | null>(null)` and a mount-only `useEffect` that calls `fetchBackendVersion()` and stores the result, with the same `isMounted` guard `LandingPage.tsx` uses so an unmounted footer never sets state. Render `<footer data-testid="app-footer" style={footerStyle}>Task Notes{version !== null && <span data-testid="app-version"> v{version}</span>}</footer>`. Keep `APP_NAME`, `footerStyle` and the `contentinfo` landmark exactly as they are.
  - `frontend/src/api/version.ts` (new): `export async function fetchBackendVersion(): Promise<string | null>`. GETs `${API_BASE_URL}/api/version`; returns the `version` string when the response is OK and the body is an object whose `version` is a non-empty string other than `"unknown"`; returns `null` on a rejected fetch (network error, backend down, CORS failure), a non-OK status, a JSON parse failure, a missing or non-string or empty `version`, or `"unknown"`. It never throws: the footer has exactly one failure presentation, so the client collapses every failure into `null`. Exports the response type `VersionResponse = { version: string }`.
  - `frontend/src/api/apiBaseUrl.ts` (new): `export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010";` with the existing comment intent moved over. `frontend/src/api/notes.ts` imports it instead of declaring its own `DEFAULT_API_BASE_URL` / `API_BASE_URL`; its behaviour is unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified. It already renders `<AppFooter />`.
- Routes: none (landing page `/` only).
- State management: local component state in `AppFooter` (`string | null`), fetched once on mount. No context, no global store, no retry, no polling: the version of a running backend does not change during a page view, and a reload re-fetches.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps its existing TEST-04 styling unchanged (font-size 0.875rem, color #5f5f5f, margin-top 1.5rem); the version span inherits it and adds no style.

## Backend Plan
No backend changes required. The `GET /api/version` endpoint the tracker comment asks for is already on main at e8e068c6 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, CORS allowing `GET` from the configured frontend origin). It returns the installed `task-notes-backend` version (backend/pyproject.toml `0.1.0`) and the sentinel `unknown` when package metadata is missing, which the frontend client treats as unresolved. Its existing integration tests cover criterion 5 and are named in the Criterion coverage table; this item adds no backend test file.

## API Integration Plan
No external API integration. (The footer consumes this project's own backend, through the client module named in the Frontend Plan.)

## API Contract
- Method: GET
- URL: `/api/version` (absolute: `${VITE_API_BASE_URL ?? "http://localhost:8010"}/api/version`)
- Request: no body, no query parameters
- Response: `200 OK`, `application/json`, body `{"version": "0.1.0"}`. The value is the backend's `[project].version`; it is the literal string `unknown` when the backend runs without installed package metadata (the frontend treats that as unresolved). Existing contract, unchanged by this item.

## Technology Selection
- Version fetch (`frontend/src/api/version.ts`): chose the browser's native `fetch` with a typed response over adding an HTTP client or data-fetching library (none is installed, and `api/notes.ts` already uses `fetch`), because one GET with no retries needs nothing more.
- Loading and failure state in `AppFooter`: chose React's built-in `useState` and `useEffect` (already installed) over a suspense/data-fetching dependency, because one value fetched once on mount is a few lines.
- Shared base URL (`frontend/src/api/apiBaseUrl.ts`): chose moving the existing constant into its own module over duplicating `DEFAULT_API_BASE_URL` in the new client, because a second copy of a deployment-dependent value breaks the one-value-one-source rule of `coding_standards.md` Section 5; Vite's `import.meta.env` (already in use) stays the configuration mechanism.
- Backend version source: no new component; the existing `GET /api/version` (stdlib `importlib.metadata`) is reused.

## File Manifest
### New files
- [A] frontend/src/api/apiBaseUrl.ts: single source of the backend base URL (`VITE_API_BASE_URL` with the documented `http://localhost:8010` default), moved out of `api/notes.ts`
- [A] frontend/src/api/version.ts: typed client for `GET /api/version`; returns the backend version or `null` for every unresolved case
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client (stubbed `fetch`, the real client body runs)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright specs: footer shows the version the backend served; footer shows the app name alone when `/api/version` is unreachable
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./apiBaseUrl` instead of declaring it; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the backend version on mount; render `Task Notes` plus an `app-version` span only when a version resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present, pending and failed paths; drop the `package.json` import
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` alongside `../api/notes`; the footer test asserts the mocked backend version instead of the `package.json` version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: replace the `frontend/package.json` version assertions with the version from the page's own `/api/version` response, since the footer no longer shows the frontend package version
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the step "that version number matches the version field of frontend/package.json" now names the backend's `GET /api/version` value
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare the footer to `GET /api/version` instead of `frontend/package.json`

No dependency is added or changed, so no lockfile (`frontend/package-lock.json`, `backend/uv.lock`) changes.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure (`VITE_API_BASE_URL` already exists and keeps its meaning).

## Testing Strategy
- Unit tests: the version client's success and every failure branch (`frontend/src/api/version.test.ts`, stubbed global `fetch`, the pattern `api/notes.test.ts` uses); `AppFooter` with `../api/version` mocked, for the resolved, pending and failed paths; `LandingPage` still renders the footer with the mocked backend version. `api/notes.test.ts` keeps passing unchanged, which verifies the base-URL move (including its `VITE_API_BASE_URL` override test).
  - Directory: frontend tests are co-located in `frontend/src/` as `*.test.ts(x)` (project-standards Layout); backend unit directory `backend/tests/unit/` is not touched.
  - Naming: `{Name}.test.tsx` / `{module}.test.ts`
- Integration tests: no new integration test, because the item adds no endpoint, router or repository code. Criterion 5 is covered by the existing `backend/tests/integration/test_version_integration.py`.
  - Directory: backend/tests/integration/
- E2E tests: one spec reading the version from the page's own `/api/version` response (`page.waitForResponse` on pathname `/api/version`, read its JSON) and asserting the footer's `app-version` reads ` v{that version}`; one edge-case spec that aborts `**/api/version` with `page.route` before `page.goto("/")` and asserts the footer reads exactly `Task Notes` and `app-version` is absent. No hardcoded backend URL or port: the expected value comes from the response the page itself received. TEST-04's spec is updated the same way.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus the unreachable-backend edge scenario.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the backend's version on the landing page | E2E | `footer shows the version the backend reports` | — |
| 2 | The version's single source is the backend's `GET /api/version`, never `package.json`, a build variable or a literal | Unit | `fetches the version from GET /api/version on the configured base URL`, `shows the version the backend reports, not the frontend package version` | verifying it needs no navigation or interaction: where the value comes from is a client and component wiring property, asserted by mocking the client with a value no file in the frontend contains |
| 3 | Unresolved version renders `Task Notes` alone, never `undefined`, `null`, `unknown` or a gap | Unit | `renders the app name alone while the version request is pending`, `renders the app name alone when the version request fails`, `returns null when the request fails with a network error`, `returns null when the response is not OK`, `returns null when the body has no version string`, `returns null when the backend reports the unknown sentinel` | verifying it needs no navigation or interaction: it is a rendering rule over each client outcome, each forced deterministically by a mock; the E2E edge spec `footer shows the app name alone when the version endpoint is unreachable` adds a browser check of the same rule |
| 4 | A component test asserts version present and version absent | Unit | `renders the app name and the backend version once the fetch resolves`, `renders the app name alone when the version request fails` | verifying it needs no navigation or interaction: the criterion is itself a requirement on the component test suite |
| 5 | `GET /api/version` returns the backend's version | Integration | `test_get_version_returns_200_with_version_from_pyproject`, `test_get_version_answers_when_database_url_is_unset` | verifying it needs no navigation or interaction: it is a router behaviour, already covered by existing tests on main |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the backend's version | Open `/`, wait for the page's `/api/version` response, assert `app-version` reads ` v{response.version}` | Given the app is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the version `GET /api/version` returns |
| 2 | Single source is the backend | covered at Unit, see Criterion coverage | Given the frontend package version is 0.0.0 and the backend's is 0.1.0, When I open the landing page, Then the footer shows 0.1.0 |
| 3 | Unresolved renders the app name alone | covered at Unit, see Criterion coverage; edge spec aborts `/api/version` and asserts the footer reads exactly "Task Notes" | Given the backend is stopped, When I open the landing page, Then the footer reads "Task Notes" with no version, no "unknown" and no trailing gap |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they pass |
| 5 | `GET /api/version` returns the backend version | covered at Integration, see Criterion coverage | Given the backend is running, When I request GET /api/version, Then the body is {"version": "0.1.0"} |

## Manual verification plan
### Criterion 1: The footer renders the backend's version on the landing page
Prerequisites: from the repository root, `docker compose up -d --build` has finished and `docker compose ps` shows `db`, `backend` and `frontend` running.
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0"}` (the value of `version` in `backend/pyproject.toml`).
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading, the note form, and a footer at the bottom.
3. Read the footer text → it reads exactly `Task Notes v0.1.0`, the same version as step 1.

### Criterion 2: The version's single source is the backend, not the frontend package
Prerequisites: the stack from Criterion 1 is running.
1. Open `frontend/package.json` and read its `version` field → it is `0.0.0`.
2. Open `http://localhost:5183/` and read the footer → it reads `Task Notes v0.1.0`, the backend's version, and not `v0.0.0`.
3. Open the browser's developer tools, Network tab, reload `http://localhost:5183/` → a `GET` request to `http://localhost:8010/api/version` appears with status `200` and response `{"version":"0.1.0"}`.
4. Search the frontend source for a typed version: `grep -rn "0.1.0" frontend/src` → no match.

### Criterion 3: An unresolved version renders the app name alone
Prerequisites: the stack from Criterion 1 is running.
1. Run `docker compose stop backend` → the backend container stops; `http://localhost:8010/api/version` no longer answers.
2. Open `http://localhost:5183/` and reload it → the page still renders the heading and the note form.
3. Read the footer → it reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing space or empty gap after the name.
4. In the developer tools Elements panel, inspect the `footer` element → it contains the text `Task Notes` and no `span` with `data-testid="app-version"`.
5. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers again, then reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains the tests `renders the app name and the backend version once the fetch resolves` and `renders the app name alone when the version request fails`.

### Criterion 5: `GET /api/version` returns the backend's version
Not a UI behaviour; the observable check is the HTTP response and the backend test file.
1. With the stack running, run `curl -s http://localhost:8010/api/version` → it prints `{"version":"0.1.0"}`.
2. With the backing database available per CLAUDE.md, run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → the run passes: no failed or errored test on its summary line, exit code 0.
