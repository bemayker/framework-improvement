# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written in the description).**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> **Tracker comment (newest, overrides the description where they disagree):** the version must come from the backend at runtime via `GET /api/version`, not from `package.json` at build time; a frontend rebuilt against an older backend must show the backend's version. Record the loading and failure states explicitly, and say in the plan that this adds a backend dimension to a description framed as frontend-only.

## Acceptance Criteria
<!-- Criterion 2 is restated per the tracker comment, which overrides the description's "frontend package metadata or a build-time variable". Criterion 5 is added from the same comment. -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, the backend's `GET /api/version` read at runtime (which itself reads `backend/pyproject.toml` package metadata), never a string typed into the component and never the frontend's `package.json`: a frontend bundle built against a different backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved (the request fails, the backend is unreachable or answers non-OK, the body has no string `version`, or the backend reports its `unknown` sentinel), the footer renders `Task Notes` without a version rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. Before the request resolves, the footer shows `Task Notes` with no version and no placeholder text; the version appears when the response arrives.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 is restated to the backend runtime source and the footer fetches `GET /api/version` through a new client `frontend/src/api/version.ts`. **The endpoint already exists on main**: `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py` were delivered by TEST-05 (status done), return `{"version": "<backend/pyproject.toml version>"}` from package metadata, are registered in `backend/app/main.py`, and are covered by `backend/tests/integration/test_version_integration.py`. Its CORS posture already admits the frontend origin (`allow_origins` default `http://localhost:5183`, `allow_methods` includes GET). So the "add an endpoint" part of the comment is satisfied by existing code and this plan creates no backend file; adding a second endpoint would be duplicate work.
- Comment (tracker), consequence 1, loading and failure states → Addressed by: decision recorded, not defaulted. **The footer is never blank.** It always renders the app name `Task Notes`. The version suffix `v{version}` (in a `data-testid="app-version"` span) is appended only once `GET /api/version` succeeds with a usable string. **Loading** (before the fetch settles): `Task Notes` alone, no spinner, no ellipsis, no placeholder. **Failure** (unreachable, network error, non-OK status, malformed body, or the backend's own `unknown` sentinel from `version_service.UNKNOWN_VERSION`): `Task Notes` alone, never the word `unknown`. Rationale: criterion 3 forbids an empty gap and `undefined`/`null`, and a reader asking "which API am I talking to" is better served by no answer than by a literal `unknown` that could be misread as a version string. Loading and failure are deliberately visually identical; the distinguishing signal is the presence of the `app-version` element. This is criteria 3 and 5.
- Comment (tracker), consequence 2, the backend change → Addressed by: stated here and in Plan Overview rather than left to the manifest. The item **does** now depend on a backend contract (`GET /api/version`), but that contract is already shipped by TEST-05 (a declared dependency of TEST-08 in `feature_map.md`), so the **backend file change is zero** and `## Backend Plan` says "No backend changes required." with the reason. The description's "touches no backend file" remains literally true; its "frontend only" framing does not, because the feature is now only correct while the backend serves that endpoint.
- Assumption (recorded, no human to ask): the backend's `unknown` sentinel counts as "cannot be resolved" under criterion 3. The client treats it, and an empty or whitespace string, as no version.
- Assumption: no fetch timeout is added. A hung request leaves the footer in its loading state, which renders identically to the failure state (`Task Notes` alone), so criterion 3 holds without one. A timeout is not in any criterion (`user_story_alignment.md` Section 3).
- Assumption: TEST-09 (planned concurrently) is expected to add a build-commit field to the `GET /api/version` response. The new client reads only `version` and ignores any other field, so TEST-09's additive change cannot break this footer; a unit test pins that tolerance.
- Description note "It modifies `LandingPage.tsx`" → not acted on: `AppFooter` owns its own fetch, so `LandingPage.tsx` needs no change and only its test changes (it currently asserts the `package.json` version in the footer). This also narrows the overlap with BUG-04, which edits the note-form wiring.

## Plan Overview
Frontend change that switches the footer's version source from the frontend bundle's `package.json` (imported at build time by TEST-04) to the backend's existing `GET /api/version`, fetched at runtime on mount. Layers touched: a new typed API client for the version endpoint, a shared API base URL module extracted from `notes.ts` so both clients resolve the backend from one source, and the `AppFooter` component with explicit loading and failure states. **Backend: no file changes**; the endpoint and its tests already exist (TEST-05). Existing tests that assert the `package.json` version in the footer (`AppFooter.test.tsx`, `LandingPage.test.tsx`, `e2e/tests/TEST-04_page_footer.spec.ts`) and TEST-04's Gherkin and manual script line that names `frontend/package.json` as the source are updated, because the footer will no longer show that value. No new dependency, no migration, no external API.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/apiBaseUrl.ts` (new): exports `API_BASE_URL`, resolved exactly as `notes.ts` does today (`import.meta.env.VITE_API_BASE_URL` with the documented default `http://localhost:8010`). One value, one source for both clients (the "one value, one source" rule for deployment-dependent values in `coding_standards.md`).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./apiBaseUrl` instead of declaring it; no behaviour change.
  - `frontend/src/api/version.ts` (new): `export async function getBackendVersion(): Promise<string | null>`. GETs `${API_BASE_URL}/api/version`. Throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response, same shape as `notes.ts`. Throws `Error("Loading the version failed: unexpected response shape")` when the body has no string `version`. Returns `null` when `version` is empty or whitespace, or equals the backend sentinel `unknown` (named constant `BACKEND_UNKNOWN_VERSION = "unknown"`, comment pointing at `backend/app/services/version_service.py`). Otherwise returns the trimmed string. Ignores every other field in the body.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import. Hold `version: string | null` in `useState(null)`. On mount, `useEffect` calls `getBackendVersion()`; on resolve set it, on reject leave it `null`; guard the setter with an `isMounted` flag as `LandingPage.tsx` does. Render `<footer data-testid="app-footer">Task Notes{version && <> <span data-testid="app-version">v{version}</span></>}</footer>`: the space and the `v` prefix exist only when a version exists, so there is never a trailing gap. Keep `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local component state in `AppFooter` (`useState` and `useEffect`); no global store.
- Design reference notes: AI freestyle. The version span inherits the existing footer style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`), no new values.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05: `backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`, registered in `backend/app/main.py`), reads the version from installed package metadata for `backend/pyproject.toml`, and is covered by `backend/tests/integration/test_version_integration.py`. CORS already allows GET from the frontend origin. The tracker comment's backend requirement is met by that existing contract, which this feature now consumes.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters.
- Response: `200 OK`, `{"version": "0.1.0"}`. The client reads `version` only; additional fields (for example a build commit TEST-09 may add) are ignored. When the backend cannot resolve its own metadata it answers `{"version": "unknown"}`, which the client maps to no version.

## Technology Selection
- Version API client (`frontend/src/api/version.ts`): chose the browser's native `fetch`, as `notes.ts` already does, over adding a data-fetching or HTTP library, because one GET with a status check needs nothing more.
- Footer loading and failure state: chose React's built-in `useState` and `useEffect` over a query or suspense library, because a single fire-once request with two outcomes is a few lines.
- Shared base URL (`frontend/src/api/apiBaseUrl.ts`): no stdlib call, native platform feature or installed dependency is relevant; it is the existing `notes.ts` constant moved to one module so both clients resolve the backend the same way.
- No new dependency is added.

## File Manifest
### New files
- [A] frontend/src/api/apiBaseUrl.ts: single source of `API_BASE_URL` (`VITE_API_BASE_URL` with the `http://localhost:8010` default), shared by the notes and version clients
- [A] frontend/src/api/version.ts: `getBackendVersion()` client for `GET /api/version`, maps unusable values to `null`, throws on non-OK and malformed bodies
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client with `fetch` stubbed
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright specs for the backend version in the footer and the unreachable-backend edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: the artifact copy of the manual UAT script that build-feature writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./apiBaseUrl` instead of declaring it locally; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version on mount, render `Task Notes` alone while loading or on failure and `Task Notes v{version}` on success; drop the `package.json` import
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`, assert the present, pending, failed and unresolved paths, and that the backend value wins over `package.json`
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of the `package.json` version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: stop reading `frontend/package.json`; assert the footer shows the app name and a visible `app-version` element, since the exact value is now TEST-08's spec
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: correct the step that says the version matches `frontend/package.json` to say it matches the backend's `GET /api/version`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the same one-line source correction in TEST-04's manual script

No dependency changes, so no lockfile (`frontend/package-lock.json`, `backend/uv.lock`) is regenerated.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes (the new client reuses the existing `VITE_API_BASE_URL`).

## Testing Strategy
- Unit tests: Vitest, colocated with the source as the frontend already does.
  - `frontend/src/api/version.test.ts`: the client with `fetch` stubbed (happy path, default URL, configured `VITE_API_BASE_URL`, non-OK throws, malformed body throws, `unknown` and empty map to `null`, extra fields ignored).
  - `frontend/src/components/AppFooter.test.tsx`: the component with `../api/version` mocked (present, pending, rejected, `null`, backend value over `package.json`, existing landmark and app-name tests kept).
  - `frontend/src/components/LandingPage.test.tsx`: footer on the full page with the version client mocked.
  - Directory: colocated under `frontend/src/` (the CLAUDE.md unit directory `backend/tests/unit/` is the backend's; no backend test changes)
  - Naming: `{module}.test.ts(x)`, the frontend's existing convention
- Integration tests: no new tests. The backend contract is already covered by `backend/tests/integration/test_version_integration.py` (TEST-05), which stays green and is cited below; no router, repository or migration changes.
  - Directory: backend/tests/integration/
- E2E tests: the footer showing the backend's real version through the browser (cross-origin fetch to `:8010`, which only a browser exercises), and the edge case of an unreachable `/api/version` (request aborted via `page.route`). TEST-04's spec is updated so it no longer asserts the `package.json` value.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus an unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the version the backend reports at GET /api/version`, `renders the footer with the app name and the backend version` | — |
| 2 | The version comes from the backend's `GET /api/version` at runtime, never a typed string and never `package.json` | Unit | `renders the backend version, not the frontend package.json version`, `returns the backend version from the default base URL`, `ignores extra fields such as a build commit`, `test_get_version_returns_200_with_version_from_pyproject` | Verifying the source needs no navigation or interaction: a mocked client returning a value different from `package.json` proves the component renders the backend's value, and the existing backend integration test proves the endpoint reads `pyproject.toml` |
| 3 | When the version cannot be resolved, the footer renders `Task Notes` without it, never `undefined`, `null`, `unknown` or an empty gap | Unit | `renders the app name without a version when the request fails`, `renders the app name without a version when the backend cannot resolve one`, `returns null when the backend reports the unknown sentinel`, `returns null when the backend reports an empty version`, `throws with the status and reason when the response is not OK`, `throws when the response has no string version field`, `shows the app name without a version when /api/version is unreachable` | Each failure mode is a client or render rule verifiable with a mocked response; the E2E edge-case spec is listed as additional evidence, not the covering tier |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version the backend reports`, `renders the app name without a version when the request fails` | The criterion is itself a component test |
| 5 | Before the request resolves, the footer shows `Task Notes` with no version and no placeholder | Unit | `renders the app name without a version while the request is pending` | A never-settling mocked promise holds the pending state deterministically; a browser test of a transient state would be timing-dependent |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Wait for the page's own `GET /api/version` response, read its `version`, assert `app-footer` contains `Task Notes v{version}` | Given the app and backend are running, When I open the landing page, Then the footer shows "Task Notes v" followed by the backend's version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports a version different from the frontend's package.json, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage (plus the E2E edge spec aborting `/api/version`) | Given the backend is unreachable, When I open the landing page, Then the footer shows exactly "Task Notes" and no "undefined", "null" or "unknown" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When it runs, Then the AppFooter present and absent tests pass |
| 5 | Loading state shows the app name only | covered at Unit, see Criterion coverage | Given a slow network, When the landing page loads, Then the footer shows "Task Notes" before the version appears |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running with `docker compose up -d --build` from the repo root; `backend/pyproject.toml` has `version = "0.1.0"`.
1. Run `curl -s http://localhost:8010/api/version` in a terminal → it prints a JSON body whose `version` is `0.1.0`.
2. Open `http://localhost:5183/` in a browser → the landing page with the "Task Notes" heading is shown.
3. Scroll to the footer at the bottom of the page → it reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not the frontend package.json
Prerequisites: Criterion 1 verified; the stack is running.
1. Open `frontend/package.json` → its `version` is `0.0.0`, which differs from the backend's `0.1.0`.
2. Open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, the backend's value, and not `v0.0.0`.
3. Edit `backend/pyproject.toml` to `version = "0.1.1"` and run `docker compose up -d --build backend` (rebuild only the backend, not the frontend) → the backend container restarts.
4. Reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.1` without any frontend rebuild.
5. Revert `backend/pyproject.toml` to `version = "0.1.0"` and run `docker compose up -d --build backend` → the footer reads `Task Notes v0.1.0` again after a reload.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack is running.
1. Run `docker compose stop backend` → the backend container stops.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing space or gap.
3. Open the browser DevTools Network tab → the `version` request shows as failed.
4. Run `docker compose start backend` and reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test` from the repo root → it runs `src/components/AppFooter.test.tsx`, `src/api/version.test.ts` and `src/components/LandingPage.test.tsx` among the frontend files, and reports `0 failed`.
2. Read `frontend/src/components/AppFooter.test.tsx` → it contains a test asserting the version is present (`renders the version the backend reports`) and one asserting it is absent (`renders the app name without a version when the request fails`).

### Criterion 5: Before the request resolves, the footer shows the app name only
Prerequisites: the stack is running; Chrome DevTools open.
1. In DevTools Network, set throttling to `Slow 3G`.
2. Reload `http://localhost:5183/` and watch the footer → it first reads `Task Notes` with no version and no placeholder (no "Loading", no ellipsis).
3. Wait for the `version` request to finish in the Network tab → the footer then reads `Task Notes v0.1.0`.
4. Set throttling back to `No throttling`.
