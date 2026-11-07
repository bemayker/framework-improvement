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
<!-- Criterion 2 is amended and criteria 5 to 7 are added by the tracker comment recorded under Re-Plan Feedback, which overrides the description where the two disagree. -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. (amended by tracker comment) The version comes from a single declared source, the backend at runtime via `GET /api/version`, never from `frontend/package.json` at build time and never a string typed into the component.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (from tracker comment) A frontend whose own bundle version differs from the backend's shows the backend's version, not its own.
- [ ] 6. (from tracker comment) Loading state, decided and recorded: before `GET /api/version` resolves, the footer reads exactly `Task Notes`, with no version, no `v`, no placeholder and no spinner.
- [ ] 7. (from tracker comment) Failure state, decided and recorded: when `/api/version` is unreachable, answers non-2xx, answers a body without a non-empty string `version`, or answers the backend's own `unknown` sentinel, the footer reads exactly `Task Notes` (same as criterion 3), never `unknown`, never blank.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 is rewritten to name the backend at runtime as the single declared source, and criterion 5 is added. `AppFooter.tsx` drops its `package.json` import and fetches `GET /api/version` through a new client module `frontend/src/api/version.ts`. The comment overrides the description's "frontend package metadata or a build-time variable".
- Comment (tracker), same comment: "Add a GET /api/version endpoint" → Not acted on as new work, because it already exists on main at plan base e8c6bac: `backend/app/routers/version.py` (TEST-05, registered in `backend/app/main.py`) answers `GET /api/version` with `{"version": "<backend/pyproject.toml [project].version>"}`, read from installed package metadata by `backend/app/services/version_service.py`, currently `0.1.0`, and is covered by `backend/tests/integration/test_version_integration.py`. Its CORS middleware already allows `GET` from `http://localhost:5183`, the origin the notes client already calls from. The plan consumes the endpoint as it stands and adds no backend file.
- Comment (tracker), same comment: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by stating it here and in `## Backend Plan`: the item is no longer frontend-only in its dependency, because the footer now depends on a backend endpoint at runtime, but it needs no backend code change, because that endpoint already shipped with TEST-05 (a declared dependency of this item, done). The File Manifest therefore carries no `[B]` entry, deliberately. The description's note "It modifies LandingPage.tsx" is also not acted on: the fetch lives in `AppFooter.tsx`, so `LandingPage.tsx` is untouched (only its test file changes), which keeps this item off the file BUG-04 is expected to edit.
- Comment (tracker), same comment: "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers." → Addressed by criteria 6 and 7. Decision: both states render the app name alone, `Task Notes`. Never blank (the app name is always present, so the footer is never an empty box and its landmark never collapses), never `unknown`. Reason: criterion 3 from the description already requires "renders without it" when the version cannot be resolved, and a failed fetch is exactly that case; using the same answer for loading means the footer never flickers through a placeholder that a reader could mistake for a version. Assumption recorded: the backend's own `unknown` sentinel (`UNKNOWN_VERSION` in `version_service.py`, returned when the distribution metadata is missing) is treated as "cannot be resolved" and hidden too, since showing it would be the `unknown` footer the comment distinguishes from the chosen answer.
- Assumption: the footer text with a version stays in TEST-04's existing shape, `Task Notes v{version}` (for example `Task Notes v0.1.0`), so only the source of `{version}` changes.
- Assumption: no retry and no polling. The version is fetched once on mount; a backend redeployed under a mounted page is shown after a reload. Retry and refresh are not in the criteria (no gold plating, `user_story_alignment.md` Section 3).
- Assumption: the existing TEST-04 tests and UAT artifacts that assert the footer shows `frontend/package.json`'s version (`0.0.0`) become false by this change, and are updated rather than left failing: `AppFooter.test.tsx` and `LandingPage.test.tsx` (unit), `e2e/tests/TEST-04_page_footer.spec.ts` (E2E), and TEST-04's Gherkin scenario and manual UAT script. These are in the manifest below.
- Concurrency note: TEST-09 (running this round) adds a build-commit field to the same `GET /api/version` response. That is additive for this plan: the client reads only `version` and ignores any other field, so the two items share no file and no contract break.

## Plan Overview
The landing-page footer stops importing `version` from `frontend/package.json` and instead fetches the backend's version at runtime from the existing `GET /api/version` endpoint (TEST-05). A new typed client module, `frontend/src/api/version.ts`, owns the fetch; the API base URL resolution moves out of `frontend/src/api/notes.ts` into a shared `frontend/src/api/baseUrl.ts` so both clients read one source (`coding_standards.md` Section 5, one value one source). `AppFooter` fetches once on mount and renders `Task Notes v{version}` when it resolves to a usable string, and `Task Notes` alone while loading or on any failure. No backend change: the endpoint already exists on main. Tests that pinned the footer to the `package.json` version are updated to the backend version.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx`: remove the `../../package.json` import; hold `backendVersion: string | null` in `useState(null)`; in a mount-only `useEffect`, call `fetchBackendVersion()` and set the result, guarding with an `isMounted` flag as `LandingPage.tsx` already does for `listNotes`. Render `Task Notes` followed by ` v{backendVersion}` only when `backendVersion` is a non-null string. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged. Add `data-testid="app-footer-version"` on a `<span>` wrapping ` v{backendVersion}` so tests can assert presence and absence without string surgery.
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. Calls `GET {API_BASE_URL}/api/version`. Returns the `version` string when the response is OK and the body is an object whose `version` is a non-empty string other than `unknown`. Returns `null` for a network error, a non-OK status, a non-JSON body, a missing or non-string or empty `version`, or `unknown`. It never throws: the footer has exactly one non-version answer, so the client collapses every failure to `null` rather than making the component distinguish them. Response type `VersionResponse = { version: string }`.
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, resolved as `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts`: import `API_BASE_URL` from `./baseUrl` instead of defining `DEFAULT_API_BASE_URL` and `API_BASE_URL` locally. Behaviour unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local `useState` in `AppFooter`; no global store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's existing style object unchanged: `fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`. No new visual values.

## Backend Plan
No backend changes required. This item now depends on a backend endpoint, which the description did not anticipate (tracker comment, recorded above), but that endpoint, `GET /api/version`, already exists on main from TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`) and returns the backend's version from `backend/pyproject.toml`. CORS already permits `GET` from the frontend origin. Nothing on the backend is added or modified by this item.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05; consumed, not changed)
- Request: no body, no parameters
- Response: `200` with JSON `{"version": "0.1.0"}`. The client reads only `version`; any additional field (TEST-09 adds a build commit this round) is ignored. The backend answers `{"version": "unknown"}` when its package metadata is absent; the client treats that as unresolved.
- Client contract: `fetchBackendVersion()` resolves to the version string, or to `null` on every failure path listed in `## Frontend Plan`; it never rejects.

## Technology Selection
- `frontend/src/api/version.ts` HTTP call: chose the browser's native `fetch`, already used by `frontend/src/api/notes.ts`, over adding an HTTP client library such as axios, because `fetch` covers a single GET with no retry.
- Loading and failure state in `AppFooter`: chose React's built-in `useState` and `useEffect`, the pattern `LandingPage.tsx` already uses for `listNotes`, over a data-fetching library such as react-query or SWR, because one fetch on mount with no caching or refetch needs none.
- `frontend/src/api/baseUrl.ts`: no stdlib call, native platform feature or installed dependency resolves this project's API base URL, so it is a two-line module extracted from `notes.ts` rather than duplicated into `version.ts`.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/version.ts: typed client for GET /api/version, returning the version string or null and never throwing
- [A] frontend/src/api/baseUrl.ts: single source of the API base URL shared by the notes and version clients
- [A] frontend/src/api/version.test.ts: unit tests for the version client with fetch stubbed (OK body, non-OK status, network error, missing or empty or non-string version, unknown sentinel, VITE_API_BASE_URL override)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser spec proving the footer shows the version the backend returned at runtime, plus the unreachable-endpoint edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: build-feature Section 14 step 3 copy of the manual UAT script

### Modified files
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import; fetch the backend version on mount; render the version span only when resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock ../api/version; assert version present, version absent (null), loading state reads Task Notes only, and the landmark and test id
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version and replace the package.json version assertion with the mocked backend version
- [A] frontend/src/api/notes.ts: import API_BASE_URL from ./baseUrl instead of defining it locally
- [D] e2e/tests/TEST-04_page_footer.spec.ts: replace the frontend/package.json version expectation with the version read from the page's own GET /api/version response
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step now matches the backend's GET /api/version, not frontend/package.json
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisite and the version comparison step now read the backend's version, not frontend/package.json

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure (the new spec and test files follow the existing directories and naming).

## Testing Strategy
- Unit tests (Vitest): `frontend/src/api/version.test.ts` covers the client with `fetch` stubbed via `vi.stubGlobal`, as `notes.test.ts` does: happy path, non-OK status, network rejection, malformed body (missing, empty, non-string `version`), the `unknown` sentinel, and the `VITE_API_BASE_URL` override (with `vi.resetModules`, as in `notes.test.ts`). `AppFooter.test.tsx` mocks `../api/version` and covers version present (`Task Notes v0.1.0`, version span present), version absent (`null`: text exactly `Task Notes`, no version span, no `undefined`, `null` or `v`), loading (a never-resolving promise: text exactly `Task Notes`), backend version differing from `frontend/package.json` (mock returns `9.9.9`, footer shows `9.9.9` and not the package.json value), and the contentinfo landmark. `notes.test.ts` must still pass unchanged after the base-URL extraction.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (existing frontend convention; CLAUDE.md's unit directory `backend/tests/unit/` is the backend's)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`
- Integration tests: no new integration test. The only backend surface involved, `GET /api/version`, is unchanged and already covered by `backend/tests/integration/test_version_integration.py`; this item adds no router, repository or migration (`testing_standards.md` Section 6).
  - Directory: `backend/tests/integration/`
- E2E tests (Playwright): criterion 1 only, plus the feature's edge-case spec. (a) Load `/`, capture the page's own `GET /api/version` response with `page.waitForResponse`, and assert the `app-footer-version` span contains that response's `version`; this proves the real cross-origin browser fetch, which no unit test can. (b) Edge case: `page.route("**/api/version", route => route.abort())`, load `/`, assert the footer is visible and reads exactly `Task Notes` with no version span. Locators: `data-testid`. The TEST-04 spec is updated to read its expected version from the same intercepted response instead of `frontend/package.json`.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one Gherkin scenario per acceptance criterion plus one edge case (endpoint unreachable).
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | Version comes from the backend at runtime via GET /api/version, never package.json or a typed string | Unit | verifying it needs no navigation or interaction: the client test asserts the URL fetched and the component test asserts the rendered value is the client's result; criterion 1's E2E additionally exercises the real fetch |
| 3 | When the version cannot be resolved, the footer renders without it (no undefined, null or gap) | Unit | verifying it needs no navigation or interaction: a null client result and each failure path are rendering and parsing rules; the E2E edge-case spec also covers the aborted request |
| 4 | A component test asserts both paths: version present and absent | Unit | the criterion is itself a component test |
| 5 | A frontend whose bundle version differs from the backend's shows the backend's version | Unit | verifying it needs no navigation or interaction: the component test mocks a backend version (9.9.9) different from package.json and asserts which one renders |
| 6 | Loading state: before the fetch resolves, the footer reads exactly Task Notes | Unit | verifying it needs no navigation or interaction: a never-resolving mocked promise holds the component in its loading state deterministically, which a browser cannot do without timing |
| 7 | Failure state: unreachable, non-2xx, malformed or unknown answers show exactly Task Notes | Unit | verifying it needs no navigation or interaction: each failure path is a client parsing rule asserted with a stubbed fetch |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Load `/`, intercept the page's GET /api/version response, assert `app-footer-version` contains its `version` | Given the backend is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the backend's version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports version 0.1.0, When I open the landing page, Then the footer shows 0.1.0 and not the frontend package.json version 0.0.0 |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage (E2E edge-case spec also aborts the request) | Given GET /api/version is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then the present and absent cases pass |
| 5 | Backend version wins over the bundle's | covered at Unit, see Criterion coverage | Given frontend package.json says 0.0.0 and the backend says 0.1.0, When I open the landing page, Then the footer shows 0.1.0 |
| 6 | Loading state shows Task Notes only | covered at Unit, see Criterion coverage | Given GET /api/version has not answered yet, When the landing page renders, Then the footer reads exactly "Task Notes" |
| 7 | Failure state shows Task Notes only | covered at Unit, see Criterion coverage | Given GET /api/version answers 500, When I open the landing page, Then the footer reads exactly "Task Notes" and not "unknown" |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running with `docker compose up` from the repository root (frontend at http://localhost:5183, backend at http://localhost:8010).
1. In a terminal, run `curl -s http://localhost:8010/api/version` → the output is `{"version":"0.1.0"}` (note the value; a later bump of `backend/pyproject.toml` changes it).
2. Open http://localhost:5183/ in a browser → the landing page with the heading "Task Notes" is shown.
3. Scroll to the bottom of the page and read the footer → it reads `Task Notes v0.1.0`, the same version step 1 printed.

### Criterion 2: The version comes from the backend at runtime, not package.json and not a typed string
Prerequisites: same as criterion 1.
1. Open `frontend/package.json` and read its `version` field → it is `0.0.0`.
2. Open http://localhost:5183/ and read the footer → it reads `Task Notes v0.1.0`, not `Task Notes v0.0.0`.
3. Open the browser DevTools Network tab, filter on `version`, and reload the page → one `GET http://localhost:8010/api/version` request with status 200 and response `{"version":"0.1.0"}` appears.
4. Open `frontend/src/components/AppFooter.tsx` → it contains no `package.json` import and no version literal such as `0.1.0`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack is running as in criterion 1.
1. Stop only the backend: run `docker compose stop backend` from the repository root.
2. Reload http://localhost:5183/ → the page still renders its heading and note form.
3. Read the footer → it reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap.
4. Run `docker compose start backend` and reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run reports `0 failed`, and the test names include a version-present case and a version-absent case.

### Criterion 5: A frontend whose bundle version differs from the backend's shows the backend's version
Prerequisites: the stack is running as in criterion 1, with `frontend/package.json` at `0.0.0` and `backend/pyproject.toml` at `0.1.0` (they already differ on main).
1. Open http://localhost:5183/ and read the footer → it reads `Task Notes v0.1.0` (the backend's), never `v0.0.0` (the frontend bundle's).

### Criterion 6: Loading state, the footer reads Task Notes before the fetch resolves
Prerequisites: the stack is running as in criterion 1; Chrome DevTools open.
1. In DevTools Network tab, open "Request blocking" or set throttling to a custom profile of 10000 ms latency, then reload http://localhost:5183/.
2. While the `api/version` request is still pending, read the footer → it reads exactly `Task Notes` (no placeholder, no spinner, no `v`).
3. Wait for the request to finish → the footer changes to `Task Notes v0.1.0`.
4. Turn throttling back to "No throttling".

### Criterion 7: Failure state, an unreachable or bad /api/version shows Task Notes, never unknown or blank
Prerequisites: the stack is running as in criterion 1; Chrome DevTools open.
1. In DevTools Network tab, right-click the `api/version` request and choose "Block request URL", then reload http://localhost:5183/ → the footer reads exactly `Task Notes`, is visible, and is not blank.
2. Unblock the URL and reload → the footer reads `Task Notes v0.1.0`.
3. The 500, malformed-body and `unknown`-sentinel answers cannot be produced through the UI without changing the backend; read the observable check instead: run `npm --prefix frontend test -- src/api/version.test.ts` → `0 failed`, with test names covering a non-OK status, a malformed body and the `unknown` sentinel.
