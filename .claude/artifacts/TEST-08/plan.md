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
Criteria 1 to 4 are the description's own; criterion 2 is restated as the tracker comment corrected it (the comment overrides the description where they disagree). Criteria 5 and 6 are the two consequences the comment asked to be handled explicitly, so they are planned and tested like the rest.

- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, the backend's version as served at runtime by `GET /api/version` (backed by `[project].version` in `backend/pyproject.toml`), never a string typed into the component and no longer the frontend's `package.json`.
- [ ] 3. When the version cannot be resolved (request fails, non-OK status, malformed body, or the backend's own `unknown` sentinel), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (tracker comment) A frontend bundle whose own `package.json` version differs from the backend's shows the backend's version, not its own.
- [ ] 6. (tracker comment) The loading state is decided and recorded: before the `/api/version` request resolves, the footer reads `Task Notes` alone, with no version, no placeholder and no trailing space.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by the following:
  (a) **Source of the version.** The footer now fetches `GET /api/version` at runtime through a new client module (`frontend/src/api/version.ts`). The `package.json` import is removed from `AppFooter.tsx`. Criterion 2 is restated accordingly and criterion 5 is added.
  (b) **The backend change.** The comment frames this as adding a backend change to a frontend-only item. Checked on main at plan base `bc70dc4`: `GET /api/version` already exists. TEST-05 (merged) added `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py`, registered in `backend/app/main.py`. It returns `{"version": "<[project].version of task-notes-backend>"}` (currently `0.1.0`), and its CORS middleware already allows `GET`. **So this item has no backend changes.** The backend half of the correction was already delivered by TEST-05, which is also one of TEST-08's declared dependencies in `feature_map.md`. That is why the File Manifest carries no `[B]` entry. The dependency is a runtime one: the frontend now requires the backend to be reachable to show a version.
  (c) **Loading state (decided):** the footer shows `Task Notes` alone until the request resolves (criterion 6). There is no "loading" text and no placeholder, so the line never shows a value that is not true.
  (d) **Failure state (decided):** if `/api/version` is unreachable, answers non-OK, returns a body without a non-empty string `version`, or returns the backend's own `unknown` sentinel (`UNKNOWN_VERSION` in `version_service.py`, emitted when package metadata is not installed), the footer shows `Task Notes` alone. It is **blank of a version, not a footer reading `unknown`**. Reason: criterion 3 of the item requires the footer to render without the version when it cannot be resolved, and a literal `unknown` would be a string typed into the component, which criterion 2 forbids. Treating the backend sentinel as unresolved is a recorded assumption. The alternative, rendering `Task Notes vunknown`, would put the backend's failure marker on screen as though it were a version.
  (e) **Assumption.** The fetch happens once, on mount. The footer does not poll or refetch, because nothing in the item or the comment asks for a live-updating version.
- Description note "It modifies `LandingPage.tsx`" → not acted on: the fetch lives inside `AppFooter`, so `LandingPage.tsx` needs no edit. Only its test file changes, to mock the new client module.
- Merged since the last plan: n/a (fresh plan, branched from current main `bc70dc4`).

## Plan Overview
This is a frontend-only change against an endpoint that already exists. A new `frontend/src/api/version.ts` client calls `GET {API_BASE_URL}/api/version` and resolves to the version string, or rejects when the version cannot be resolved. `AppFooter` calls it once on mount and keeps `string | null` in state. It renders `Task Notes v{version}` once resolved, and `Task Notes` alone while pending or after a failure. The API base URL, currently private to `frontend/src/api/notes.ts`, moves to `frontend/src/api/baseUrl.ts` so the two clients share one source (the "one value, one source" rule for deployment-dependent values in `coding_standards.md`). Existing tests that asserted the `package.json` version (`AppFooter.test.tsx`, `LandingPage.test.tsx`, `e2e/tests/TEST-04_page_footer.spec.ts`, and TEST-04's UAT artifacts) are updated, because the old behaviour they pin is exactly what the comment corrected.

## Frontend Plan
- Components to create/modify: `frontend/src/components/AppFooter.tsx` (modify: drop the `package.json` import; add a `useEffect` that calls `fetchBackendVersion()` once with an `isMounted` guard like `LandingPage.tsx`'s notes load; state `version: string | null`, initially `null`; on rejection keep `null`; render `{APP_NAME}` followed by ` v{version}` only when `version` is a non-empty string, so no `undefined`, `null` or trailing space can reach the DOM). The `data-testid="app-footer"` attribute and the `<footer>` (contentinfo) element are unchanged. `LandingPage.tsx` is not modified.
- Client modules: `frontend/src/api/baseUrl.ts` (new) exports `API_BASE_URL`, resolved exactly as today: `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`. `frontend/src/api/notes.ts` imports it in place of its private constant. `frontend/src/api/version.ts` (new) exports `fetchBackendVersion(): Promise<string>`. It throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response, and throws when the body's `version` is not a non-empty string or equals the backend sentinel `unknown`. Network errors propagate as rejections. Components never call `fetch` directly (`coding_standards.md` Section 4's client-layer rule, applied to the project's own backend as `notes.ts` already does).
- Routes: none.
- State management: local `useState` in `AppFooter`; no shared store.
- Design reference notes: AI freestyle. Design Reference mode is NONE. The footer keeps its existing TEST-04 styles unchanged (font-size 0.875rem, color #5f5f5f, margin-top 1.5rem), and the version follows the app name on one line separated by a single space with a `v` prefix, as today.

## Backend Plan
No backend changes required.

`GET /api/version` already exists on main (TEST-05). See `## Re-Plan Feedback` (b): the backend change the tracker comment asks for was already delivered by that item, so this plan only consumes it.

## API Integration Plan
No external API integration.

The only endpoint consumed is this project's own backend, described under `## API Contract`.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`, overridable by `VITE_API_BASE_URL`)
- Request: no body, no parameters
- Response: 200 with `{"version": "0.1.0"}`. The value is `[project].version` of `task-notes-backend`, and the backend returns the sentinel `{"version": "unknown"}` when its package metadata is not installed (the frontend treats this as unresolved). Any non-OK status, network error or malformed body is also treated as unresolved by the frontend.

## Technology Selection
- `frontend/src/api/version.ts` (version client): chose the platform `fetch` API, the same as `notes.ts`, over adding an HTTP client library, because `fetch` covers one GET with a status check.
- `frontend/src/api/baseUrl.ts` (shared base URL): chose extracting the existing constant over a configuration library or a second copy in `version.ts`, because one exported constant is the whole need and a copy would break "one value, one source".
- Footer loading/failure state: chose React's built-in `useState` and `useEffect` (already installed) over a data-fetching library such as React Query, because a single mount-time request needs no cache or retry layer.
- E2E backend version lookup: chose Node's standard `node:fs` read of `backend/pyproject.toml` plus a regular expression over adding a TOML parser to the E2E dependencies, because one `version = "..."` line is all that is read. TEST-04's spec already reads a manifest the same way.
- No new dependency is added anywhere.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: the single exported `API_BASE_URL`, resolved from `VITE_API_BASE_URL` with the documented `http://localhost:8010` default
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`, rejecting on every unresolved case listed in the API Contract
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the client with `fetch` stubbed (OK, non-OK, malformed body, sentinel, configured base URL)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs for the footer showing the backend's version, and showing the name alone when `/api/version` is aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it locally (no behaviour change)
- [A] frontend/src/components/AppFooter.tsx: fetch the version from the backend on mount; render the name alone while pending or on failure; drop the `package.json` import
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; replace the `package.json` version assertion with the present, absent, pending and differs-from-bundle cases
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` alongside `../api/notes`; the footer assertion checks the mocked backend version instead of `package.json`
- [D] e2e/tests/TEST-04_page_footer.spec.ts: drop the `frontend/package.json` version assertions (now wrong by design); keep the name, landmark, heading and mobile checks; version coverage moves to the TEST-08 spec
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: replace the step asserting the version matches `frontend/package.json` with one asserting it matches the backend's `GET /api/version`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: same correction to the step that compares the footer against `frontend/package.json`

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature adds two source files under the existing `frontend/src/api/` directory and changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: the version client (`frontend/src/api/version.test.ts`, `fetch` stubbed as in `notes.test.ts`) and the footer component (`AppFooter.test.tsx`, client module mocked) in Vitest; `notes.test.ts` stays green unchanged as the regression check on the base-URL extraction.
  - Directory: `frontend/src/` (Vitest, colocated `*.test.ts(x)`, the existing frontend convention; CLAUDE.md's unit directory `backend/tests/unit/` is the backend's)
  - Naming: `{module}.test.ts(x)`
- Integration tests: no new ones. No router, repository or endpoint changes. `GET /api/version` stays covered by TEST-05's `backend/tests/integration/test_version_integration.py`, which this plan cites as criterion 2's backend-side evidence.
  - Directory: `backend/tests/integration/`
- E2E tests: the footer shows the backend-reported version in a real browser against the running stack, plus an edge-case spec aborting `/api/version` via `page.route`.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one per criterion plus an edge case (backend unreachable).
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version from GET /api/version in the footer` | — |
| 2 | The version comes from one declared source, the backend's `GET /api/version`, never a typed-in string | Unit | `requests the version from GET /api/version on the default base URL`, `uses VITE_API_BASE_URL for the version request when it is configured`, `test_get_version_returns_200_with_version_from_pyproject` | Verifying it needs no navigation or interaction: it is which URL the client calls and what the endpoint reads, checked at the client and router level |
| 3 | When the version cannot be resolved, the footer renders without it | Unit | `renders the app name without a version when the version request fails`, `rejects when the backend reports the unknown sentinel`, `rejects when the response is not OK`, `rejects when the body has no version string` | Verifying it needs no navigation or interaction: it is a rendering rule for a rejected promise. The E2E edge-case spec `shows only the app name when GET /api/version is unreachable` additionally exercises it in a browser |
| 4 | A component test asserts both paths: version present and version absent | Unit | `renders the version the backend reports`, `renders the app name without a version when the version request fails` | The criterion is itself a demand for component tests |
| 5 | A bundle whose own `package.json` version differs shows the backend's version | Unit | `shows the backend version even when it differs from the frontend package version` | Verifying it needs no navigation or interaction: it is a comparison of two values in one render. The E2E spec for criterion 1 also asserts the footer does not contain the bundle's `0.0.0` |
| 6 | While the request is pending, the footer reads `Task Notes` alone | Unit | `renders the app name without a version while the version request is pending` | Verifying it needs no navigation or interaction, and a browser cannot hold a request pending deterministically without a hardcoded wait |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | `page.goto("/")`; `getByTestId("app-footer")` contains `Task Notes` and `v` followed by the version read from `backend/pyproject.toml` | Given the backend is running, When I open the landing page, Then the footer shows "Task Notes v0.1.0" |
| 2 | Single declared source, the backend | covered at Unit, see Criterion coverage | Given the backend reports version X, When I open the landing page, Then the footer shows vX |
| 3 | Unresolved version renders without it | covered at Unit; edge-case spec aborts `**/api/version` with `page.route` and asserts the footer text is exactly `Task Notes` | Given the version endpoint is unreachable, When I open the landing page, Then the footer shows "Task Notes" with no version |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend tests, When they run, Then the present and absent cases pass |
| 5 | Backend version wins over bundle version | covered at Unit; the criterion 1 spec also asserts `not.toContainText("v0.0.0")` | Given the frontend bundle is 0.0.0 and the backend is 0.1.0, When I open the landing page, Then the footer shows v0.1.0 |
| 6 | Loading state shows the name alone | covered at Unit, see Criterion coverage | Given the version request is slow, When the page first renders, Then the footer shows "Task Notes" alone until the version arrives |

## Manual verification plan
Common prerequisites for every criterion: the stack is running locally, with the backend on `http://localhost:8010` and the frontend on `http://localhost:5183`. `backend/pyproject.toml` declares `version = "0.1.0"` and `frontend/package.json` declares `"version": "0.0.0"` (as on main at plan time; if either was bumped since, substitute the current values below).

### Criterion 1: The footer renders the version string on the landing page
Prerequisites: common prerequisites.
1. Open `http://localhost:5183/` in a browser → the landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer.
2. Read the footer text → it reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend's GET /api/version, never a typed-in string
Prerequisites: common prerequisites; browser DevTools open on the Network tab.
1. Open `http://localhost:5183/` → the Network tab lists one `GET http://localhost:8010/api/version` request with status 200.
2. Click that request and open its Response → the body is `{"version":"0.1.0"}`.
3. Compare with the footer → the footer's `v0.1.0` is the same value as the response body.
4. Open `frontend/src/components/AppFooter.tsx` in an editor and search it for `0.1.0` and for `package.json` → neither appears.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: common prerequisites; Chrome DevTools open.
1. In DevTools, open the command menu (Cmd+Shift+P), run "Show Network request blocking", enable it, and add the pattern `*/api/version` → the pattern is listed and checked.
2. Reload `http://localhost:5183/` → the `/api/version` request shows as `(blocked:devtools)`.
3. Read the footer → it reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing space (select the footer text to confirm nothing follows "Notes").
4. Untick the blocking pattern and reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run includes `renders the version the backend reports` and `renders the app name without a version when the version request fails`, and reports `0 failed`.

### Criterion 5: The backend's version wins over the bundle's own version
Prerequisites: common prerequisites.
1. Open `frontend/package.json` and confirm `"version": "0.0.0"`; open `backend/pyproject.toml` and confirm `version = "0.1.0"` → the two differ.
2. Open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, and nowhere on the page does `0.0.0` appear.

### Criterion 6: While the request is pending, the footer reads "Task Notes" alone
Prerequisites: common prerequisites; Chrome DevTools open on the Network tab.
1. Set the Network throttling dropdown to "Slow 3G" → the dropdown shows "Slow 3G".
2. Reload `http://localhost:5183/` and watch the footer while `/api/version` is still pending in the Network tab → the footer reads `Task Notes` alone, with no placeholder text.
3. Wait for the `/api/version` request to finish → the footer changes to `Task Notes v0.1.0` without a page reload.
4. Set throttling back to "No throttling".
