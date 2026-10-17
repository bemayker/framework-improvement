# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written on the ticket):**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (ClickUp task 123k99ctgch, workspace 30307190, list 901524718831.)

## Acceptance Criteria
<!-- Criterion 2 is restated as amended by the tracker comment (a comment overrides the description where the two disagree). Criterion 5 records the two states the comment asks to be decided explicitly; it adds no behaviour beyond what criterion 3 already requires. -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. Amended by the tracker comment: that source is the backend at runtime, read from GET /api/version (which reports the backend package version, `[project].version` in `backend/pyproject.toml`), not `frontend/package.json` at build time. A frontend built against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved (GET /api/version unreachable, non-2xx, or a body with no usable version), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (Tracker comment) The loading state and the failure state are decided and recorded: before the fetch resolves, and when it fails, the footer shows the app name `Task Notes` alone, with no version segment, no placeholder and no trailing space.

## Re-Plan Feedback
- Comment (tracker): "The version must come from the backend at runtime, not from package.json at build time." → Addressed by: criterion 2 is restated; `AppFooter.tsx` stops importing `frontend/package.json` and instead calls a new client `frontend/src/api/version.ts` that fetches GET /api/version on mount. `frontend/package.json` (0.0.0) is no longer read by any app code; the backend currently reports 0.1.0, so the visible value changes and the two TEST-04 tests that assert the package.json value are updated (File Manifest).
- Comment (tracker): "Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it." → Addressed by: the endpoint already exists on main since TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, covered by `backend/tests/integration/test_version_integration.py`) and already returns the backend's installed package version, so this plan adds no endpoint and does not touch it. The footer fetch is the new work. Planned fresh against main at 3fefb2d; an earlier run's implementation of this item was reverted by the sandbox reset (eed558f) and nothing from it is assumed.
- Comment (tracker): "A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: the version is fetched per page load, never bundled; an E2E spec stubs GET /api/version with a value that exists nowhere in the frontend and asserts the footer shows it, which proves the value is runtime, not build-time.
- Comment (tracker): "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: decision recorded as criterion 5 and in the Frontend Plan. Loading: the footer renders `Task Notes` immediately (not blank, so the landmark and app name never flicker in), with no version segment. Failure: identical, `Task Notes` with no version segment, never `unknown`, never `vundefined`. Reason: criterion 3 on the ticket already says to render without the version rather than a placeholder, and a footer that reads `unknown` would state something false-looking about the build; the name alone is the honest answer. The backend's own `unknown` sentinel (returned by `version_service.py` when package metadata is missing) is treated as unresolved for the same reason, so the footer never shows the word `unknown`. Assumption, recorded because the comment did not settle it: loading and failure render the same text, so the footer does not distinguish them visually.
- Comment (tracker): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in the Plan Overview and Backend Plan. The item is no longer frontend-only in what it depends on: the footer now needs the backend running and reachable at `VITE_API_BASE_URL` (default http://localhost:8010) to show a version. It makes no backend code change, because the endpoint the comment asks for already shipped with TEST-05; the File Manifest carries no backend file and no `[B]` tag, deliberately.
- Concurrent work (dispatch note, not a comment): TEST-09 (PR 202) adds a `commit` field to the GET /api/version response. Not assumed present and not read; the client reads only `version` and ignores every other field, and a unit test sends a body with an extra `commit` field to prove it.

## Plan Overview
Frontend change only, with a new runtime dependency on an existing backend endpoint. `AppFooter` fetches the version from GET /api/version (shipped by TEST-05) through a new typed client module, `frontend/src/api/version.ts`, and renders `Task Notes v0.1.0` once it resolves, or `Task Notes` alone while loading and when the version cannot be resolved. The API base URL constant moves out of `notes.ts` into a shared `frontend/src/api/baseUrl.ts` so both clients read one source (`coding_standards.md` Section 5, one value, one source). `LandingPage.tsx` is not modified: it already renders `<AppFooter />`, which owns its own fetch. No backend code changes (see Re-Plan Feedback). Tests: Vitest component and client tests for every state, one new Playwright spec, and the existing TEST-04 spec repointed from the frontend package.json version to the backend version.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, resolved exactly as `notes.ts` resolves it today (`import.meta.env.VITE_API_BASE_URL`, falling back to the documented default `http://localhost:8010`). The constant and its default move here unchanged; behaviour is identical.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of declaring it. No other change.
  - `frontend/src/api/version.ts` (new): exports `fetchAppVersion(): Promise<string | null>`. Calls `fetch` on the API base URL plus `/api/version`. A non-OK response rejects with `Loading the version failed: <status> <statusText>` (same shape as `notes.ts`). A network error rejects as fetch rejects. An OK body resolves to the `version` field when it is a non-empty string other than the backend sentinel `unknown`; otherwise (missing field, non-string, empty, or `unknown`) it resolves to `null`. All other body fields are ignored. Response type declared (`VersionResponse` with `version: string`), no `any`.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `../../package.json` import. Add `useState<string | null>(null)` for the version and a `useEffect` that calls `fetchAppVersion()` once on mount, sets the result on success, leaves it `null` on rejection, and guards with an `isMounted` flag on unmount (the same pattern `LandingPage.tsx` uses for `listNotes`). Render: the footer always contains `Task Notes`; when the version is a string it also renders a `<span data-testid="app-version">` holding ` v` plus the version, so the separating space lives inside the span and there is no trailing space or empty gap when it is absent. `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` are unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local component state in `AppFooter` (`useState` and `useEffect`); no global store, no context. Loading state = version `null` before resolution, rendered as the app name alone. Failure state = version stays `null`, rendered identically. Both decided per the tracker comment (Re-Plan Feedback).
- Out of scope, deliberately: no request timeout, no retry, no polling or refresh (the version is read once per page load). A backend that hangs leaves the footer in its loading state, which is visually the failure state. A timeout is the separate CHORE-02 follow-up in `feature_map.md` and is not planned here.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer values stay as they are: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version span inherits them with no style of its own.

## Backend Plan
No backend changes required. The GET /api/version endpoint the tracker comment asks for already exists on main (TEST-05: `backend/app/routers/version.py`, `backend/app/schemas/version.py`, `backend/app/services/version_service.py`, registered in `backend/app/main.py`), and CORS already allows the frontend origin `http://localhost:5183` (`backend/app/core/config.py`). This item depends on that endpoint at runtime and changes none of it. TEST-09 is concurrently adding a `commit` field to the same response; this plan neither needs nor blocks that change.

## API Integration Plan
No external API integration. The only call is to this project's own backend, through the client layer in `frontend/src/api/`.

## API Contract
- Method: GET
- URL: /api/version (on `API_BASE_URL`, default http://localhost:8010)
- Request: no body, no query parameters, no headers beyond the browser defaults.
- Response: 200 with a JSON object whose `version` field is a string, for example version `0.1.0`, today the whole body. Any additional fields (TEST-09's `commit`) are tolerated and ignored by the client. The backend returns version `unknown` when its package metadata is missing; the client treats that value as unresolved.
- Errors handled by the client: network failure (fetch rejects), any non-2xx status (rejects with the status and reason), a body without a usable `version` (resolves `null`). The footer renders the app name alone in every one of these cases.

## Technology Selection
- HTTP call to GET /api/version: chose the platform `fetch` (already used by `notes.ts`) over adding an HTTP library such as axios, because `fetch` covers one GET with a status check.
- Footer loading and failure state: chose React `useState` and `useEffect` (React is installed) over a data-fetching library such as TanStack Query or SWR, because one request per mount with no caching or refetch needs nothing more.
- `frontend/src/api/baseUrl.ts`: chose moving the existing `API_BASE_URL` constant into a shared module over duplicating it in `version.ts` or importing it from `notes.ts`; no stdlib call, native platform feature or installed dependency covers a project constant, so it is the existing three lines relocated.
- `frontend/src/api/version.ts`: no stdlib call, native platform feature or installed dependency covers a typed client for this project's own endpoint, so it is built here, following `notes.ts`.
- `e2e/helpers/backendVersion.ts`: chose reading `[project].version` out of `backend/pyproject.toml` with Node `fs` and one regular expression over adding a TOML parser dependency, because one key on one line of a file this repo owns needs no parser; the existing TEST-04 spec already reads a manifest file with `fs` the same way.
- No new dependency is added anywhere, so no lockfile changes.

## File Manifest
<!-- Phase tags: [A] Frontend Plan, [D] Testing Strategy (E2E specs and helpers), [G] Acceptance Test Outline (UAT artifacts). No [B]: the Backend Plan carries no work. -->
### New files
- [A] frontend/src/api/baseUrl.ts: shared `API_BASE_URL` (env `VITE_API_BASE_URL`, default http://localhost:8010), moved from notes.ts
- [A] frontend/src/api/version.ts: typed client `fetchAppVersion` for GET /api/version, resolving the version or null, rejecting on network and non-OK errors
- [A] frontend/src/api/version.test.ts: Vitest client tests with `fetch` stubbed (OK body, OK body with an extra commit field, missing or empty version, the unknown sentinel, non-OK, network rejection, default base URL)
- [D] e2e/helpers/backendVersion.ts: reads the backend version from backend/pyproject.toml for the E2E specs
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: footer shows the backend version on the landing page; stubbed response proves the runtime source; aborted request shows the name alone
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from ./baseUrl instead of declaring it; behaviour unchanged
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import; fetch the version on mount via fetchAppVersion; render the version span only when resolved
- [A] frontend/src/components/AppFooter.test.tsx: replace the package.json assertion with mocked-client tests for present, loading, rejected and null paths
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version and assert the footer shows the mocked version instead of the package.json version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: assert the backend version from the helper instead of frontend/package.json (the footer no longer shows the frontend version)

No lockfile entry: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` entry: the feature changes no project structure, run configuration, dependency or test infrastructure (the E2E stack already runs the backend for the TEST-03 notes specs).

## Testing Strategy
- Unit tests (Vitest, frontend): `frontend/src/api/version.test.ts` stubs global `fetch` (the `notes.test.ts` pattern) and covers: an OK body resolves its version; an OK body carrying an extra `commit` field still resolves the version; a body with no version, an empty version, a non-string version, or the `unknown` sentinel resolves `null`; a non-OK response rejects with `Loading the version failed: 503 Service Unavailable`; a rejected fetch rejects; the request goes to `http://localhost:8010/api/version` when `VITE_API_BASE_URL` is unset. `frontend/src/components/AppFooter.test.tsx` mocks `../api/version` and covers: version present (mocked value `9.9.9-test`, which exists nowhere in the frontend, appears as `v9.9.9-test` in the footer); loading (an unresolved promise: footer text is exactly `Task Notes`, no `app-version` element); rejected (footer text exactly `Task Notes`, no `app-version`, no `undefined`, `null` or `unknown`); resolved `null` (same); plus the existing app-name and contentinfo landmark tests kept. `frontend/src/components/LandingPage.test.tsx` adds the `../api/version` mock and asserts the footer shows the mocked version. The existing `notes.test.ts` stays as it is and keeps covering the base URL move.
  - Directory: co-located with the source under `frontend/src/` (existing frontend convention; the `backend/tests/unit/` path in CLAUDE.md is the backend one)
  - Naming: `{Module}.test.ts(x)`, matching the existing frontend tests
- Integration tests: no new integration test. No router, repository or migration changes; GET /api/version is already covered by `backend/tests/integration/test_version_integration.py` (TEST-05), which this item does not modify.
  - Directory: backend/tests/integration/
- E2E tests (Playwright): `e2e/tests/TEST-08_footer_app_version.spec.ts` with three tests: (1) navigate to `/` against the real backend and assert the footer contains `v` plus the backend version read by `e2e/helpers/backendVersion.ts`; (2) edge case, runtime source: `page.route` fulfils `**/api/version` with version `9.9.9-e2e`, navigate to `/`, assert the footer contains `v9.9.9-e2e`; (3) edge case, unreachable: `page.route` aborts `**/api/version`, assert the footer reads exactly `Task Notes`, and contains none of `undefined`, `null`, `unknown`. Locators: `data-testid` `app-footer` and `app-version`. `e2e/tests/TEST-04_page_footer.spec.ts` keeps its four tests and swaps the package.json read for the helper.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one Gherkin scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/ (script in e2e/uat/scripts/)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from one declared source, the backend at runtime via GET /api/version, never typed into the component | Unit | Verifying it needs no navigation or interaction: it is the client calling /api/version and the component rendering whatever the mocked client returns (a value absent from the frontend), checked in `version.test.ts` and `AppFooter.test.tsx`; the backend half is already covered by TEST-05 integration tests |
| 3 | When the version cannot be resolved, the footer renders without it, never `undefined`, `null`, `unknown` or a gap | Unit | Verifying it needs no navigation or interaction: it is a rendering branch for a rejected or null client result, asserted on exact footer text in `AppFooter.test.tsx` |
| 4 | A component test asserts both paths: version present, and version absent | Unit | The criterion is itself a component test; it is satisfied by `AppFooter.test.tsx` existing with both cases |
| 5 | Loading and failure states decided and recorded: `Task Notes` alone in both | Unit | Verifying it needs no navigation or interaction: it is the render with an unresolved promise and with a rejection, asserted in `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Go to `/` with the backend running; footer `app-footer` contains `v` plus the version from backend/pyproject.toml | Given the backend is running, When I open the landing page, Then the footer shows Task Notes and the backend version |
| 2 | Version comes from the backend at runtime | Covered at Unit, see Criterion coverage; the E2E edge spec with a stubbed `9.9.9-e2e` response additionally shows it | Given the backend reports a version different from the frontend package version, When I open the landing page, Then the footer shows the backend version |
| 3 | Unresolvable version renders the footer without it | Covered at Unit, see Criterion coverage; the E2E edge spec with an aborted request additionally shows it | Given the backend is stopped, When I open the landing page, Then the footer shows only Task Notes |
| 4 | Component test covers present and absent | Covered at Unit, see Criterion coverage | Given the frontend test suite, When I run AppFooter tests, Then they pass with 0 failed |
| 5 | Loading and failure states recorded | Covered at Unit, see Criterion coverage | Given a slow or failing version request, When the page renders, Then the footer shows only Task Notes |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is up with `docker compose up -d --build` from the repo root (db, backend on port 8010, frontend on port 5183); `backend/pyproject.toml` reads `version = "0.1.0"` (use whatever value that line holds).
1. Open http://localhost:8010/api/version in the browser → the JSON shows `version` `0.1.0` (a `commit` field may also appear once TEST-09 has merged; ignore it).
2. Open http://localhost:5183/ → the landing page shows the `Task Notes` heading, the note form and the note list.
3. Scroll to the bottom of the page and read the footer → it reads `Task Notes v0.1.0`, the same version as step 1.

### Criterion 2: The version comes from the backend at runtime, not from frontend/package.json
Prerequisites: as for Criterion 1; `frontend/package.json` reads `"version": "0.0.0"`.
1. Open http://localhost:5183/ → the footer reads `Task Notes v0.1.0`, not `v0.0.0`: the value shown is the backend version, not the frontend package version.
2. Open the browser developer tools, Network tab, and reload the page → one request to `http://localhost:8010/api/version` returns 200; the footer version matches its `version` field.
3. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no `package.json` import; the version comes from `fetchAppVersion` in `frontend/src/api/version.ts`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as for Criterion 1.
1. Run `docker compose stop backend` from the repo root → the backend container stops; http://localhost:8010/api/version no longer answers.
2. Reload http://localhost:5183/ → the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap after the name.
3. Run `docker compose start backend`, wait until http://localhost:8010/api/version answers, then reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → expected result `0 failed`; the AppFooter file lists a version-present test and version-absent tests (rejected request, null result, loading).
2. Open `frontend/src/components/AppFooter.test.tsx` → one test asserts the footer shows the mocked version, and at least one asserts the footer text is exactly `Task Notes` with no `app-version` element.

### Criterion 5: Loading and failure states show the app name alone
Prerequisites: as for Criterion 1.
1. Open http://localhost:5183/ with developer tools open, Network tab, throttling set to `Slow 3G`, and reload → while the `/api/version` request is pending the footer already reads `Task Notes` (never blank, never `unknown`); when the request completes it changes to `Task Notes v0.1.0`.
2. In the Network tab, right-click the `/api/version` request, choose `Block request URL`, and reload → the footer reads `Task Notes` and stays that way.
3. Unblock the URL and reset throttling to `No throttling`, then reload → the footer reads `Task Notes v0.1.0`.
