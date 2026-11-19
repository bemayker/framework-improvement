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
> Source: [TEST-08: Footer shows the app version](https://app.clickup.com/t/123k99ctgch). The tracker comment recorded under Re-Plan Feedback amends criterion 2 and adds criterion 5; the list below is the amended one this plan is built against.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from the backend at runtime: the footer fetches `GET /api/version` and shows the backend's version, never the frontend `package.json` version and never a string typed into the component. A frontend running against an older backend shows the backend's version, not its own. (Amended by the tracker comment, which overrides the description's "frontend package metadata or a build-time variable".)
- [ ] 3. When the version cannot be resolved (the request fails, the response is not OK, the body has no usable version, or the backend reports its own `unknown` sentinel), the footer renders without it: it reads `Task Notes` alone, never `undefined`, `null`, `unknown`, an empty gap or a dangling `v`.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. Loading state (from the tracker comment): before the version request resolves, the footer reads `Task Notes` alone, with no placeholder, spinner or `unknown` text.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: criterion 2 is rewritten to the backend-at-runtime source (the comment overrides the description's package.json / build-time wording), and the footer fetches `GET /api/version` through a new client module `frontend/src/api/version.ts`.
- Comment (tracker), the "Add a GET /api/version endpoint" part → Addressed by: checked on main at the plan base 49c5d32d. `GET /api/version` already exists (TEST-05: `backend/app/routers/version.py`, `backend/app/schemas/version.py`, `backend/app/services/version_service.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`). It returns `{"version": "<[project].version of backend/pyproject.toml>"}` (0.1.0 today) read from installed package metadata, and the backend image installs the project (`uv sync` in `backend/Dockerfile`), so it resolves in the running stack. This plan therefore touches **no backend file**: the backend change the comment anticipated is already on main. Stated here explicitly as the comment asked: the item is no longer frontend-only in its *dependencies* (the footer now depends on the backend's `/api/version` contract and on the browser being allowed to call it, which the existing CORS config already permits for `http://localhost:5183` with GET), but it remains frontend-only in its *file manifest*.
- Comment (tracker), loading state decision → Addressed by: before the fetch resolves the footer renders `Task Notes` alone (criterion 5). Not blank: the footer element and the app name are always present, so the landmark never collapses and the layout never jumps. Not a placeholder such as `v…` or `loading`: a version that is about to appear needs no announcement, and a placeholder would be one more string to flash and disappear.
- Comment (tracker), failure state decision → Addressed by: when `/api/version` is unreachable, answers non-OK, returns an unexpected shape, or reports the backend's `unknown` sentinel, the footer renders `Task Notes` alone (criterion 3). The choice recorded is **name-only, not `unknown`**: the description's criterion 3 already requires the footer to render without the version rather than a non-value, and `unknown` is the same kind of non-value as `undefined` or `null` to a reader. The loading and failure states are deliberately the same text, so a request that hangs forever renders exactly as a failed one; that is why no client timeout is added (see Technology Selection). No retry either: the version is informational and one request per page load is enough.
- Comment (tracker), "frontend rebuilt against an older backend must show the backend's version" → Addressed by: the frontend no longer reads `frontend/package.json` anywhere in `AppFooter`; the component unit test mocks the client with a version (`9.9.9`) different from the frontend package version and asserts the footer shows the mocked one and not `v0.0.0`.
Base note, not a merged-since verdict: main carries an earlier TEST-08 build (9e056d57) that the reset commit 49c5d32d removed, so the footer on main is TEST-04's package.json version. This plan is written against main as it now stands at 49c5d32d and repeats nothing of the removed build by reference.

## Plan Overview
Frontend-only change. A new typed API client `frontend/src/api/version.ts` calls the existing `GET /api/version`; `AppFooter` fetches it on mount and renders `Task Notes v{version}` once resolved, or `Task Notes` alone while loading and on any failure. The API base URL, today private to `frontend/src/api/notes.ts`, moves to a shared `frontend/src/api/baseUrl.ts` so both clients read one source. `LandingPage.tsx` is **not** modified: the fetch lives inside `AppFooter`, which keeps this item off the file BUG-04 edits. Tests that asserted the frontend package.json version (the AppFooter and LandingPage component tests, and TEST-04's E2E spec) are updated to the backend source, since this item deliberately changes that behaviour.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, resolved as `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts` so the deployment-dependent base URL has one source.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` and delete its local `DEFAULT_API_BASE_URL` / `API_BASE_URL` constants. No behaviour change; `notes.test.ts` keeps passing unchanged (its `vi.resetModules()` re-import re-evaluates `baseUrl.ts` too).
  - `frontend/src/api/version.ts` (new): `export type VersionResponse = { version: string }` and `export async function fetchBackendVersion(): Promise<string | null>`. GET `${API_BASE_URL}/api/version`. Non-OK response: throw `Error("Loading the version failed: {status} {statusText}")` (same shape as `notes.ts`). Body whose `version` is not a non-empty string after trimming: throw `Error("Loading the version failed: unexpected response")`. A `version` equal to `"unknown"` returns `null`; a line comment says it mirrors `UNKNOWN_VERSION` in `backend/app/services/version_service.py`. A network failure propagates as the `fetch` rejection.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import. Hold `backendVersion: string | null` in `useState(null)`; in a mount-only `useEffect` call `fetchBackendVersion()`, set the result on resolve, leave it `null` on reject, and guard both with an `isMounted` flag (the same pattern `LandingPage.tsx` uses). Render `{APP_NAME}` alone when `backendVersion` is `null`, and `{APP_NAME} v{backendVersion}` otherwise, so no `v`, space, `undefined` or `null` is ever emitted on the absent path. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
- Routes: none; the footer stays on `/` inside `LandingPage`.
- State management: local component state in `AppFooter`; no context or store.
- Design reference notes: AI freestyle (Design Reference mode NONE). No visual change: the footer keeps TEST-04's existing `footerStyle` (font-size 0.875rem, color #5f5f5f, margin-top 1.5rem); only its text content changes.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05) and returns the backend's version; see Re-Plan Feedback for the check and why the tracker comment's backend change is therefore already satisfied.

## API Integration Plan
No external API integration. The only call is to this project's own backend, through the client layer under `frontend/src/api/`.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no query parameters
- Response: 200 `{"version": "0.1.0"}` (the value is `[project].version` of `backend/pyproject.toml`; `"unknown"` when the backend's package metadata is missing). The client reads only `version` and ignores any other field, so an additive field from a concurrent item (TEST-09's build commit) does not affect it.
- Frontend function: `fetchBackendVersion(): Promise<string | null>`; resolves the version string, resolves `null` for the backend's `unknown` sentinel, rejects on network failure, non-OK status or an unusable body.

## Technology Selection
- `frontend/src/api/version.ts` (version client): chose the browser's native `fetch`, as `notes.ts` already does, over adding an HTTP library or a data-fetching dependency; one GET needs nothing more.
- Request timeout: chose no timeout over `AbortSignal.timeout` (native) because the loading and failure states render the same text, so a hung request is indistinguishable from a failed one to the reader; a timeout would add code with no visible effect.
- Retry with backoff: not added; the version is informational and read once per page load, so retrying a failed read buys nothing the next page load does not.
- `frontend/src/api/baseUrl.ts`: chose moving the existing constant into a shared module (no new code) over duplicating `notes.ts`'s base-URL default in the new client, so the deployment-dependent value keeps one source.
- Footer loading and failure state: chose plain React `useState` plus `useEffect` (already installed) over a suspense or query library; no new dependency.
- No new dependency is added anywhere in this plan.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: shared `API_BASE_URL` (env `VITE_API_BASE_URL` with the documented default `http://localhost:8010`), moved out of `notes.ts`
- [A] frontend/src/api/version.ts: typed client `fetchBackendVersion()` for `GET /api/version`, mapping the backend's `unknown` sentinel to `null` and throwing on non-OK or unusable bodies
- [A] frontend/src/api/version.test.ts: Vitest tests for the version client with `fetch` stubbed (OK, `unknown` sentinel, non-OK, unusable body, network rejection)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec, the footer shows the backend's version, and renders name-only when `/api/version` is aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script that build-feature writes alongside it

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it locally; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: fetch the version from the backend on mount; render `Task Notes v{version}` when resolved and `Task Notes` alone while loading and on failure; drop the `package.json` import
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; replace the package.json version test with the present, pending, failed and `unknown` paths
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of the frontend package.json version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from `backend/pyproject.toml` instead of `frontend/package.json`, since this item changes the footer's source; the other TEST-04 assertions are unchanged
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step now names the backend's `/api/version` (backend/pyproject.toml) instead of `frontend/package.json`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare the footer to `backend/pyproject.toml`'s version instead of `frontend/package.json`'s

No dependency is added or changed, so no lockfile changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the change alters no project structure, run configuration, dependency or test infrastructure (the footer simply calls an endpoint the running stack already serves).

## Testing Strategy
- Unit tests: the version client (`frontend/src/api/version.test.ts`, `fetch` stubbed as `notes.test.ts` does) and the `AppFooter` component's present, pending, failed and `unknown` paths (`frontend/src/components/AppFooter.test.tsx`, client mocked with `vi.mock("../api/version")`); `LandingPage.test.tsx` updated to mock the client. No backend unit tests: no backend code changes, and `backend/tests/unit/test_version_service_unit.py` already covers the service.
  - Directory: frontend tests are co-located with their modules under `frontend/src/` (project standards layout); the backend directories `backend/tests/unit/` are not touched.
  - Naming: `{Module}.test.tsx` / `{module}.test.ts` co-located (project standards naming).
- Integration tests: none new. The endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py`; this item adds no router, repository or migration.
  - Directory: backend/tests/integration/
- E2E tests: one spec for criterion 1 (navigate to `/`, the footer shows the backend's version read from `backend/pyproject.toml`) plus the feature's edge-case spec (`page.route("**/api/version", (route) => route.abort())`, the footer reads exactly `Task Notes`). TEST-04's spec is updated to the backend source so it keeps passing.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend-reported version in the landing page footer` | — |
| 2 | The version comes from the backend at runtime via GET /api/version, never package.json or a typed string; an older backend's version wins | Unit | `renders the version returned by the backend, not the frontend package version`, `requests /api/version from the default base URL and returns the version` | verifying it needs no navigation or interaction: it is which source the component and client read, provable with a mocked client returning a version unlike the frontend package's |
| 3 | When the version cannot be resolved, the footer renders `Task Notes` alone, never undefined, null, unknown, a gap or a dangling v | Unit | `renders without a version when the version request fails`, `renders without a version when the backend reports it as unknown`, `returns null when the backend reports the unknown sentinel`, `throws with the status and reason when the response is not OK`, `throws when the response has no usable version string` | verifying it needs no navigation or interaction: it is the component's rendering of a rejected or sentinel result (the E2E edge-case spec exercises the aborted request additionally) |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version returned by the backend, not the frontend package version`, `renders without a version when the version request fails` | the criterion itself asks for component tests, which are the unit tier here |
| 5 | Before the version request resolves, the footer reads `Task Notes` alone, with no placeholder | Unit | `shows only the app name while the version request is pending` | verifying it needs no navigation or interaction: a never-resolving mocked promise holds the component in its loading state deterministically, which a browser test cannot do without timing |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")`, read the expected version from `backend/pyproject.toml`, assert `getByTestId("app-footer")` contains `Task Notes v{version}` | Given the app stack is running, When I open the landing page, Then the footer shows "Task Notes v" followed by the backend's version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports 0.1.0 and frontend/package.json says 0.0.0, When I open the landing page, Then the footer shows v0.1.0 |
| 3 | Unresolvable version renders name-only | covered at Unit, see Criterion coverage; edge spec aborts `/api/version` and asserts the footer text is exactly `Task Notes` | Given requests to /api/version are blocked, When I open the landing page, Then the footer reads "Task Notes" with no version, "unknown", "undefined" or "null" |
| 4 | Component tests assert both paths | covered at Unit, see Criterion coverage | Given the frontend unit tests, When I run AppFooter.test.tsx, Then the present and absent tests pass |
| 5 | Loading state is name-only | covered at Unit, see Criterion coverage | Given the version request has not resolved, When the footer renders, Then it reads "Task Notes" alone |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repository root with `docker compose up -d` (frontend on http://localhost:5183, backend on http://localhost:8010), and `backend/pyproject.toml` reads `version = "0.1.0"`.
1. Open http://localhost:8010/api/version in a browser tab → the page shows `{"version":"0.1.0"}` (or whatever `backend/pyproject.toml` declares).
2. Open http://localhost:5183/ → the landing page shows the "Task Notes" heading and, at the bottom, a footer.
3. Read the footer text → it reads exactly `Task Notes v0.1.0`, the same version step 1 returned.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: as for Criterion 1; `frontend/package.json` reads `"version": "0.0.0"` and `backend/pyproject.toml` reads `version = "0.1.0"`, so the two differ.
1. Open http://localhost:5183/ and read the footer → it reads `Task Notes v0.1.0`, the backend's version, not `v0.0.0`.
2. Open the browser DevTools Network tab and reload http://localhost:5183/ → a GET request to `http://localhost:8010/api/version` appears with status 200 and response `{"version":"0.1.0"}`.
3. Search `frontend/src/components/AppFooter.tsx` for `package.json` and for `0.1.0` → neither appears; the version comes only from the request in step 2.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as for Criterion 1, in Chrome or Edge.
1. Open DevTools, then the Network request blocking panel (Command menu, "Show Network request blocking"), enable blocking and add the pattern `*/api/version`.
2. Reload http://localhost:5183/ → the request to `/api/version` shows as blocked in the Network tab.
3. Read the footer → it reads exactly `Task Notes`, with no `v`, no trailing space, and no `undefined`, `null` or `unknown`.
4. Remove the blocking pattern and reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run passes: its summary reports no failed test and the command exits 0.
2. In the output, find `renders the version returned by the backend, not the frontend package version` and `renders without a version when the version request fails` → both are listed as passed.

### Criterion 5: Before the version request resolves, the footer reads the app name alone
Prerequisites: as for Criterion 1, in Chrome or Edge.
1. Open DevTools, Network tab, and set throttling to a custom profile with 5000 ms latency (or "Slow 3G").
2. Reload http://localhost:5183/ and read the footer while the `/api/version` request is still pending → it reads exactly `Task Notes`, with no placeholder, spinner, `v` or `unknown`.
3. Wait for the request to finish → the footer changes to `Task Notes v0.1.0` without the page layout jumping.
4. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run passes, including `shows only the app name while the version request is pending`.
