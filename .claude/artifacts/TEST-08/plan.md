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
> Source: ClickUp task 123k99ctgch (workspace 30307190, list 901524718831). The tracker correction comment (see Re-Plan Feedback) overrides criterion 2 and the "frontend only" note.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. (amended by the tracker correction) The version comes from the backend at runtime: the footer fetches `GET /api/version`, whose single declared source is `backend/pyproject.toml` via package metadata. It is never read from `frontend/package.json` at build time and never typed into the component, so a frontend rebuilt against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved (`/api/version` unreachable, a non-2xx answer, a body without a usable version, or the backend's own `unknown` sentinel), the footer renders the app name without a version, never `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (added by the tracker correction) Before `/api/version` resolves, the footer renders the app name without a version (the recorded loading state), and the version appears once the request resolves.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. ..." → Addressed by: criterion 2 is rewritten and criterion 5 added (above); `AppFooter` drops the `package.json` import and fetches `GET /api/version` through a new client `frontend/src/api/version.ts`. **Loading state, recorded:** while the request is pending the footer reads `Task Notes` with no version and no placeholder. **Failure state, recorded:** network error, non-2xx, a body without a non-empty string `version`, or the backend's `unknown` sentinel all render `Task Notes` with no version. I chose the blank-version footer over a footer reading `unknown` because criterion 3 asks for the footer to render without the version, and because `unknown` would read as a version string to someone diagnosing a partial deploy; the absence of a version is the honest signal that the API did not answer. No retry: the next page load retries.
- Comment (tracker), same correction, second consequence: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan" → Addressed by: this item is no longer frontend-only at runtime: the footer now depends on the backend's `GET /api/version`. **That endpoint already exists on main** (TEST-05, `backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`, registered in `backend/app/main.py`), returns `{"version": "0.1.0"}` from `backend/pyproject.toml` package metadata, is covered by `backend/tests/integration/test_version_integration.py`, and CORS already allows `GET` from `http://localhost:5183`. So the comment's "Add a GET /api/version endpoint" is already satisfied and this plan writes **no backend code**: the backend dependency is a runtime dependency on an existing endpoint, stated in `## Backend Plan`, not a manifest entry. Assumption recorded: the comment did not know TEST-05 had shipped the endpoint; re-adding it would duplicate a route.
- Comment (tracker), operator note 2026-09-07: "Reset to to do ... Code revert pending: the operator reverts a9695cc (with 8794a99 and ffbfc12) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged." → Not a spec change. Precondition checked against plan base 3b00cacf: satisfied in substance. Main carries none of TEST-08's earlier code: `frontend/src/components/AppFooter.tsx` is TEST-04's version (imports `version` from `package.json`), there is no `frontend/src/api/version.ts`, `frontend/src/api/baseUrl.ts`, `e2e/tests/TEST-08_footer_app_version.spec.ts` or TEST-08 UAT file, and TEST-06's and TEST-07's routers (echo, uptime) are absent from `backend/app/routers/`. The later Arm E resets (most recently 3b00cacf, "reset Arm E code to reset-base-r2 for release run 0.3.522 run 2 T8b") removed the re-built TEST-08 code, so the 2026-09 revert is superseded rather than pending. The note's remark about TEST-04's footer assertion is acted on: this plan updates TEST-04's footer tests and UAT files, because they assert the `frontend/package.json` version that the correction replaces.
- Merged since the last plan: n/a (fresh plan, no `plan.md` existed for TEST-08; branched from current main 3b00cacf).

## Plan Overview
Frontend change backed by an existing backend endpoint. A new typed client `fetchBackendVersion()` in `frontend/src/api/version.ts` calls `GET {API_BASE_URL}/api/version`. `AppFooter` owns its own fetch in a `useEffect` (with an unmount guard, the same pattern `LandingPage` uses for notes) and renders `Task Notes` while pending or on failure, and `Task Notes v{version}` once resolved. The API base URL, currently private to `frontend/src/api/notes.ts`, moves to `frontend/src/api/baseUrl.ts` so both clients read one source (`coding_standards.md` Section 5, one value one source). `LandingPage.tsx` is **not** modified: the footer stays self-contained, which also removes the map's predicted conflict with BUG-04 on that file. TEST-04's tests and UAT files that pin the footer to the `frontend/package.json` version are updated to the new source.

## Frontend Plan
- Components to create/modify: modify `frontend/src/components/AppFooter.tsx` (drop the `package.json` import; `useState<string | null>(null)` for the version, `useEffect` calling `fetchBackendVersion()`, `.catch` leaving it `null`, `isMounted` guard; render `{APP_NAME}` followed, only when a version is held, by `<span data-testid="app-version"> v{version}</span>`, so the absent path has no trailing space and no empty element). New client `frontend/src/api/version.ts` and shared `frontend/src/api/baseUrl.ts`; `frontend/src/api/notes.ts` imports `API_BASE_URL` from it instead of declaring its own. `frontend/src/components/LandingPage.tsx` unchanged.
- Routes: none (landing page `/` only).
- State management: local component state in `AppFooter`; no global store.
- Client contract (`version.ts`): `fetchBackendVersion(): Promise<string | null>`. Resolves to the version string; resolves to `null` when the backend answered 2xx but the body has no non-empty string `version` or it equals the backend sentinel `unknown` (constant `BACKEND_UNKNOWN_VERSION`, with a comment naming `backend/app/services/version_service.py` `UNKNOWN_VERSION` as its counterpart); throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response and lets a network error reject, the same error shape as `notes.ts`. No timeout or retry: this is the project's own backend, consumed the way `notes.ts` already consumes it, and a failure only hides a version.
- Design reference notes: AI freestyle (Design Reference mode NONE). Keep the existing footer style untouched: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version span inherits it.

## Backend Plan
No backend changes required.

The footer depends at runtime on the existing `GET /api/version` (TEST-05), which already returns `{"version": "<backend/pyproject.toml version>"}` with HTTP 200, needs no database, answers `unknown` when the distribution is not installed, and is reachable cross-origin from `http://localhost:5183` (CORS allows `GET`). Its existing tests in `backend/tests/integration/test_version_integration.py` and `backend/tests/unit/test_version_service_unit.py` stay as they are and are cited as coverage for criterion 2. This is the backend change the tracker correction asked to be named: it is a dependency on an endpoint main already has, not new backend code.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version`
- Request: no body, no parameters.
- Response: 200 `{"version": "0.1.0"}` (existing TEST-05 contract, unchanged). The client treats `{"version": "unknown"}`, `{"version": ""}` or a body without a string `version` as "no version" (`null`); any non-2xx or network failure rejects, and the footer renders the name only.

## Technology Selection
- Version fetch (`frontend/src/api/version.ts`): chose the browser's native `fetch` over adding axios or a data-fetching library (react-query, SWR), because one GET with no caching or retry needs nothing more and `notes.ts` already uses `fetch`.
- Footer loading/failure state: chose React's built-in `useState` and `useEffect` over a state library, because one value local to one component needs no store.
- Shared base URL (`frontend/src/api/baseUrl.ts`): chose moving the existing two lines out of `notes.ts` over duplicating them in `version.ts`, because a deployment-dependent value must have one source; no stdlib or dependency is involved.
- E2E failure path: chose Playwright's built-in `page.route(...).abort()` over stopping the backend container inside the spec, because the installed runner can simulate an unreachable endpoint per test without touching shared services.
- No new dependency is added, so no manifest or lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of `API_BASE_URL` (`import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`), moved out of `notes.ts`
- [A] frontend/src/api/version.ts: typed `fetchBackendVersion()` client for `GET /api/version`, with the null and throw rules in the Frontend Plan
- [A] frontend/src/api/version.test.ts: client unit tests with a stubbed `fetch` (resolved version, `unknown` sentinel, unusable body, non-OK status)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs for the backend version in the footer and the unreachable-endpoint edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it; behaviour unchanged (its existing tests, including the `VITE_API_BASE_URL` override, must still pass)
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version at runtime; loading and failure render the name only; drop the `package.json` import
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert present, pending, failed and unusable paths and that the backend value, not `package.json`'s, is shown; drop the `renders the version imported from package.json` test
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` so the page test does not hit the network; the footer test asserts the mocked backend version instead of the `package.json` version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: stop asserting the `frontend/package.json` version (superseded by TEST-08's correction); keep the name, landmark, heading and mobile assertions
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step now matches the backend version from `GET /api/version`, not `frontend/package.json`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and steps 3 to 4 compare the footer to `GET /api/version` instead of `frontend/package.json`

No dependency is added or changed, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: the feature adds two files inside the existing `frontend/src/api/` layer and changes no structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: Vitest. `frontend/src/api/version.test.ts` for the client (stubbed global `fetch`, the pattern `notes.test.ts` uses); `frontend/src/components/AppFooter.test.tsx` for the four footer states with `vi.mock("../api/version")`; `LandingPage.test.tsx` mocks the same module. Mock values use `9.9.9` so they can never coincide with `frontend/package.json`'s `0.0.0` or the backend's `0.1.0`. The absent-path assertions check the footer's text content is exactly `Task Notes` and that `app-version` is not in the document.
  - Directory: co-located `*.test.tsx` / `*.test.ts` under `frontend/src/` (project-standards Layout; the backend unit directory `backend/tests/unit/` is not touched)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: no new ones. The endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py` (cited for criterion 2); this item adds no router, repository or migration.
  - Directory: backend/tests/integration/
- E2E tests: `shows the backend version in the landing page footer` reads the expected version from `backend/pyproject.toml` (`[project]` `version`, the same file the endpoint's metadata comes from), navigates to `/`, and asserts the footer contains `Task Notes v{that version}`. Edge case `shows the app name without a version when /api/version is unreachable` aborts `**/api/version` with `page.route` before navigating and asserts the footer text is exactly `Task Notes`. Locators: `data-testid="app-footer"` and `app-version`.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version in the landing page footer`, `renders the footer with the app name and version` | — |
| 2 | The version comes from the backend at runtime via GET /api/version, never package.json or a typed string | Unit | `renders the backend version rather than the frontend package version`, `returns the backend version from the default base URL`, `test_get_version_returns_200_with_version_from_pyproject` | verifying it needs no navigation or interaction: it is a data-source rule, proven by a mocked backend value distinct from package.json and by the existing endpoint integration test |
| 3 | When the version cannot be resolved the footer renders without it | Unit | `renders the app name without a version when the request fails`, `renders the app name without a version when the backend has no usable version`, `returns null when the backend reports the unknown sentinel`, `throws with the status and reason when the response is not OK` | verifying it needs no navigation or interaction: it is the component's rendering of a rejected or empty fetch (the E2E edge spec `shows the app name without a version when /api/version is unreachable` adds a browser check) |
| 4 | A component test asserts both paths: version present and version absent | Unit | `renders the version the backend reports`, `renders the app name without a version when the request fails` | the criterion is itself a component test |
| 5 | Before /api/version resolves the footer renders the app name without a version | Unit | `renders the app name without a version while the request is pending` | verifying it needs no navigation or interaction: a pending promise is controllable only in a component test; a browser timing check would be flaky |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Navigate to `/`, assert `app-footer` contains `Task Notes v{backend/pyproject.toml version}` | Given the backend is running, When I open the landing page, Then the footer shows "Task Notes v0.1.0" |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given frontend/package.json says 0.0.0 and GET /api/version says 0.1.0, When I open the landing page, Then the footer shows 0.1.0 |
| 3 | Unresolvable version renders the name only | covered at Unit; edge spec aborts `**/api/version` and asserts text `Task Notes` | Given the backend is stopped, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they pass |
| 5 | Loading state renders the name only | covered at Unit, see Criterion coverage | Given a slow network, When I open the landing page, Then the footer reads "Task Notes" until the version arrives |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is up (`docker compose up -d` from the repository root), backend on http://localhost:8010, frontend on http://localhost:5183.
1. In a terminal run `curl -s http://localhost:8010/api/version` → it prints `{"version":"0.1.0"}` (the `version` in `backend/pyproject.toml`).
2. Open `http://localhost:5183/` in a browser → the landing page with the "Task Notes" heading is shown.
3. Scroll to the footer at the bottom of the page → it reads `Task Notes v0.1.0`, the same value step 1 printed.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: as for Criterion 1.
1. Open `frontend/package.json` → its `version` field is `0.0.0`.
2. Open `http://localhost:5183/` and read the footer → it reads `Task Notes v0.1.0`, the backend's value, not `0.0.0`.
3. Open the browser DevTools Network tab and reload the page → one `GET http://localhost:8010/api/version` request with status 200 and response `{"version":"0.1.0"}` appears.
4. In `frontend/src/components/AppFooter.tsx`, search for `package.json` and for `0.1.0` → neither occurs.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as for Criterion 1.
1. Run `docker compose stop backend` → the backend container stops.
2. Reload `http://localhost:5183/` → the page still renders, and the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap.
3. In DevTools Network, find the `/api/version` request → it failed (connection refused).
4. Run `docker compose start backend` and reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains the tests `renders the version the backend reports` and `renders the app name without a version when the request fails`.

### Criterion 5: Before /api/version resolves, the footer renders the app name without a version
Prerequisites: as for Criterion 1.
1. Open `http://localhost:5183/`, open DevTools Network, and set throttling to `Slow 3G`.
2. Reload the page and watch the footer → it first reads `Task Notes` with no version and no placeholder, then changes to `Task Notes v0.1.0` once the `/api/version` request completes.
3. Set throttling back to `No throttling`.

## Scope changes

- 2026-11-25 e2e/tests/TEST-08_footer_app_version.spec.ts reads the expected version from the backend under test (`GET /api/version`) instead of backend/pyproject.toml, and asserts it is a semver-like string different from frontend/package.json's `0.0.0`. Reason: the footer shows the running backend's value, so a spec reading pyproject.toml only agrees when the backend was built from this checkout (orchestrator doubt); the request is setup only, the assertions go through the rendered footer.
