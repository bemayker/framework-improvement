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
> **Amended by the newest tracker comment** (see `## Re-Plan Feedback`): the version must come from the backend at runtime through `GET /api/version`, not from `package.json` at build time.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. (amended by tracker comment) The version comes from a single declared source, the backend's `GET /api/version` fetched at runtime, never from `frontend/package.json` and never a string typed into the component. A frontend served against a backend of a different version shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved (request fails, backend unreachable, non-OK status, or a response with no usable `version` string), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (added by tracker comment) Before the `/api/version` request resolves, the footer shows the app name with no version and no placeholder text.

## Re-Plan Feedback
- Comment (tracker): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 is rewritten to the backend source; `AppFooter.tsx` drops its `package.json` import and fetches through a new client `frontend/src/api/version.ts`. The endpoint itself is NOT added by this item: `GET /api/version` already exists on main at plan base 7ec0ce6e (`backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`, delivered by TEST-05), returning `{"version": "<[project].version of backend/pyproject.toml>"}`, currently `0.1.0`. Adding it again would duplicate TEST-05's work and collide with TEST-09, which is changing that slice in parallel.
- Comment (tracker), decision on the loading state: before the fetch resolves the footer reads `Task Notes` (app name only, no version, no "loading" text). → Addressed by: criterion 5, unit test `renders the app name without a version while the request is pending`. Reason: a placeholder that is then replaced is a visible flicker on every page load for a value nobody waits on, and the app-name-only rendering is already the answer for the failure state, so loading and failure look the same and a request that hangs is indistinguishable from one that failed, which is the honest answer.
- Comment (tracker), decision on the failure state: if `/api/version` is unreachable, returns non-OK, or returns no usable `version` string, the footer still renders and reads `Task Notes` with no version. It is neither blank (the footer and the app name stay) nor `unknown`. → Addressed by: criterion 3, unit tests `renders the app name without a version when the backend is unreachable`, `renders the app name without a version when the backend reports an empty version` and `throws when the response carries the backend's unknown sentinel`, E2E edge spec. Decided behaviour (revised, see the orchestrator bullet below): a `version` that equals `"unknown"` after trim is the backend saying it could not resolve its own version (`version_service.UNKNOWN_VERSION`, returned when its package metadata is not installed), which is exactly criterion 3's trigger, so `getBackendVersion()` throws on it as it does on an empty version and the footer reads `Task Notes`, never `Task Notes vunknown`.
- Comment (tracker), the backend-change call-out: this item was framed as frontend only; the comment turns it into a full-stack dependency on the backend. → Addressed by: stated here and in `## Plan Overview` and `## Backend Plan`. The backend dependency is real (the footer is now only as correct as `GET /api/version`), but the backend CODE change is zero because the endpoint is already on main, so the File Manifest carries no `[B]` entry. The item now depends at runtime on TEST-05's endpoint (already a listed dependency in `feature_map.md`) and on TEST-09 keeping the `version` field (see `shared_risks.md`).
- Description note "It modifies `LandingPage.tsx`" → not acted on: `AppFooter` owns its own fetch, so `LandingPage.tsx` is unchanged and only its test file changes. This removes the predicted overlap with BUG-04 on `LandingPage.tsx`, though not on `LandingPage.test.tsx`.
- Feedback (orchestrator, /deliver Section 6.2 plan verdict, re-plan 1): the previous plan's recorded assumption showed `Task Notes vunknown` for the backend's `"unknown"` sentinel, contradicting criterion 3, with no test on that path. → Addressed by: `frontend/src/api/version.ts` now also throws when the trimmed `version` equals `"unknown"`; the third bullet above, the `## API Contract` "version absent" line and the `version.ts` and `version.test.ts` manifest descriptions say so; the criterion 3 row gains the unit test id `throws when the response carries the backend's unknown sentinel`. Not acted on: the `AppFooter.test.tsx` description gains no sentinel case, because that file mocks `../api/version`, so a sentinel there is indistinguishable from the already-listed unreachable case (a rejected client call) and would add a duplicate test, not coverage. The literal `"unknown"` is a frontend-side check against a value the backend's public response can carry, not an import of a backend constant; if TEST-09 changes the sentinel, the client test is what fails. Nothing else changed.

## Plan Overview
The footer (`AppFooter`, rendered by `LandingPage`) currently shows `Task Notes v{version}` with `version` imported from `frontend/package.json` at build time (TEST-04). This item replaces that source with the backend's existing `GET /api/version`, fetched once on mount through a new typed API client, with a defined loading and failure rendering (app name only). The base URL constant now in `api/notes.ts` moves to a shared `api/baseUrl.ts` so both clients read one source. **This is no longer a frontend-only item in behaviour, it now depends on a backend endpoint at runtime, but it changes no backend code**, because that endpoint already exists on main. TEST-04's E2E spec, Gherkin scenario and manual script assert the `package.json` version and become false, so they are updated to the backend version.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, the single source both clients read (moved verbatim from `notes.ts`).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` and delete its local `DEFAULT_API_BASE_URL` and `API_BASE_URL`; behaviour unchanged.
  - `frontend/src/api/version.ts` (new): `export async function getBackendVersion(): Promise<string>`. `fetch(`${API_BASE_URL}/api/version`)`; on `!response.ok` throw `Error("Loading the version failed: {status} {statusText}")`; parse JSON; if `version` is not a string, is empty after `trim()`, or equals `"unknown"` after `trim()` (the backend's could-not-resolve sentinel), throw `Error("Loading the version failed: response carried no version")`; else return the trimmed string. Type `VersionResponse = { version: string }`. A network error propagates as the rejected `fetch` promise.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import; `useState<string | null>(null)`; `useEffect` calls `getBackendVersion()` once on mount with the same `isMounted` guard `LandingPage` uses, sets the string on success, and leaves `null` on rejection (no rethrow, nothing logged). Render `Task Notes` followed by ` v{version}` only when `version` is a non-null string, so there is never a trailing space, `undefined`, `null` or `v` with nothing after it. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged. Add `data-testid="app-footer-version"` on a `<span>` that wraps ` v{version}` and is only rendered when present, so tests can assert absence without string matching.
- Routes: none.
- State management: local `useState` in `AppFooter`; no context, no global store, no retry (one request per mount; a page reload retries).
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer styles stay exactly as TEST-04 set them: `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`; the version span inherits them.

## Backend Plan
No backend changes required. The endpoint the tracker comment asks for, `GET /api/version`, already exists on main (TEST-05: `backend/app/routers/version.py`, registered in `backend/app/main.py`, CORS already allows `GET` from `http://localhost:5183`). This item consumes it as-is and relies only on its `version` string field. It does not edit the version slice, which TEST-09 is changing in parallel.

## API Integration Plan
No external API integration. The only HTTP call is to this project's own backend, through the client module `frontend/src/api/version.ts`, following the `api/notes.ts` client-layer pattern.

## API Contract
- Method: GET
- URL: `/api/version` (absolute: `{API_BASE_URL}/api/version`, default `http://localhost:8010/api/version`)
- Request: no body, no query parameters
- Response: `200 application/json`, `{"version": "0.1.0"}`. The frontend reads only `version` (string, non-empty after trim) and ignores any other field, so an additive field such as a build commit from TEST-09 does not affect it. Any non-200, network error, missing or empty `version`, or a `version` equal to `"unknown"` after trim (the backend's could-not-resolve sentinel) is treated as "version absent".

## Technology Selection
- Version source: chose the backend's existing `GET /api/version` over `frontend/package.json` (the current import) and a Vite `define` build-time variable, because the tracker comment requires the running backend's version and both alternatives report the frontend bundle.
- `frontend/src/api/version.ts` HTTP client: chose the platform `fetch` over adding axios or a data-fetching library, because one GET with a status and shape check is a few lines and `api/notes.ts` already uses `fetch`.
- Footer data loading: chose React's built-in `useState` and `useEffect` over a data-fetching library (react-query, SWR), because a single request per mount needs no cache or retry layer.
- `frontend/src/api/baseUrl.ts`: chose extracting the existing constant over duplicating `DEFAULT_API_BASE_URL` in the new client, because a second literal for the same deployment-dependent value breaks the one-value-one-source rule; no stdlib or dependency is involved.
- E2E reading of the expected backend version: chose a regex over `backend/pyproject.toml` with Node's `fs` over adding a TOML parser dependency, because one `version = "..."` line under `[project]` is all that is read.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of the backend base URL (`VITE_API_BASE_URL` with the `http://localhost:8010` default), moved out of `notes.ts`
- [A] frontend/src/api/version.ts: typed client `getBackendVersion()` for `GET /api/version`, throwing on non-OK status and on a missing, empty or `"unknown"` (backend sentinel) `version`
- [A] frontend/src/api/version.test.ts: Vitest unit tests of the version client with `fetch` stubbed (OK, non-OK, bad shape, the `"unknown"` sentinel, `VITE_API_BASE_URL` honoured)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright specs, footer shows the backend version and not the frontend package version, and the edge case with `/api/version` aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script build-feature writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl`, remove the local base URL constants; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import, fetch the version on mount, render `Task Notes` alone while loading and on failure, ` v{version}` in an `app-footer-version` span when present
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; replace the `package.json` version test with the present, backend-not-frontend, loading, unreachable and empty-version cases; keep the name and landmark tests
- [A] frontend/src/components/LandingPage.test.tsx: also mock `../api/version` (resolving `9.9.9`); change the footer test from the `package.json` version to the mocked backend version; drop the `package.json` import
- [D] e2e/tests/TEST-04_page_footer.spec.ts: expected version read from `backend/pyproject.toml` instead of `frontend/package.json`, since the footer now shows the backend's version
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version line now matches the backend's `GET /api/version` value, not `frontend/package.json`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare the footer to `backend/pyproject.toml` `[project].version`, not `frontend/package.json`

No dependency is added or changed, so no lockfile is regenerated. `README.md` and `docs/DEVELOPMENT.md` need no edit: no project structure, run configuration, dependency or test infrastructure changes.

## Testing Strategy
- Unit tests: frontend only (no backend code changes). `version.ts` client against a stubbed `fetch`; `AppFooter` with `../api/version` mocked, covering present, loading, failure and empty-version paths; `LandingPage` updated to mock the version client.
  - Directory: beside the module, `frontend/src/api/` and `frontend/src/components/` (project-standards Layout)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: no new ones. The backend endpoint is unchanged and already covered by TEST-05's `backend/tests/integration/test_version_integration.py`; this item adds no router, service or repository code.
  - Directory: backend/tests/integration/
- E2E tests: the footer shows the real backend version (`0.1.0` from `backend/pyproject.toml`) and does not show the frontend package version (`0.0.0`), which is the partial-deploy property the comment cares about; edge case: with `**/api/version` aborted via `page.route`, the footer reads `Task Notes` with no `app-footer-version` element. Match the API route on exact pathname `/api/version`, as TEST-03's spec does, so Vite's `src/api/version.ts` module request is not intercepted.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version in the footer, not the frontend package version` | - |
| 2 | The version comes from the backend's `GET /api/version` at runtime, never from `package.json` or a typed string; a frontend against a different backend version shows the backend's | E2E | `shows the backend version in the footer, not the frontend package version`, `renders the backend version, not the frontend package.json version`, `returns the version the backend reports, from the default base URL` | - |
| 3 | When the version cannot be resolved, the footer renders without it, never `undefined`, `null`, `unknown` or an empty gap | Unit | `renders the app name without a version when the backend is unreachable`, `renders the app name without a version when the backend reports an empty version`, `throws when the response is not OK`, `throws when the response carries no version string`, `throws when the response carries the backend's unknown sentinel` | verifying it needs no navigation or interaction: it is the component's rendering of a rejected client call, asserted on the DOM (the E2E edge spec `shows the app name without a version when the version endpoint is unreachable` exercises it as well) |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version the backend reports`, `renders the app name without a version when the backend is unreachable` | the criterion is itself about the component test, so its covering tier is the component unit test |
| 5 | Before the request resolves, the footer shows the app name with no version and no placeholder | Unit | `renders the app name without a version while the request is pending` | verifying it needs no navigation or interaction, and a pending state cannot be held deterministically in a browser without stubbing the route; a never-resolving mocked promise holds it exactly |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | Open `/`, `getByTestId("app-footer-version")` contains `v` plus the `[project].version` read from `backend/pyproject.toml` | Given the app is running When I open the landing page Then the footer reads "Task Notes v0.1.0" |
| 2 | Version from the backend at runtime | Same spec also asserts the footer does not contain the `frontend/package.json` version (`0.0.0`), which differs from the backend's | Given frontend/package.json says 0.0.0 and the backend reports 0.1.0 When I open the landing page Then the footer shows 0.1.0 |
| 3 | Unresolvable version | covered at Unit, see Criterion coverage; E2E edge spec aborts `/api/version` and asserts `app-footer` reads exactly `Task Notes` | Given the backend is stopped When I open the landing page Then the footer reads "Task Notes" with nothing after it |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite When I run it Then the AppFooter present and absent tests pass |
| 5 | Loading state | covered at Unit, see Criterion coverage | Given the version request has not answered yet When the page renders Then the footer reads "Task Notes" with no placeholder |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: from the repository root, `docker compose up -d --build` has finished; frontend at `http://localhost:5183`, backend at `http://localhost:8010`.
1. Open `http://localhost:8010/api/version` in a browser tab → the page shows `{"version":"0.1.0"}` (or whatever `[project].version` in `backend/pyproject.toml` currently says; note the value).
2. Open `http://localhost:5183/` → the landing page with the "Task Notes" heading loads.
3. Scroll to the bottom and read the footer → it reads `Task Notes v0.1.0`, the value noted in step 1.

### Criterion 2: The version comes from the backend at runtime, not from package.json
Prerequisites: as Criterion 1.
1. Open `frontend/package.json` and read `"version"` → it is `0.0.0`, which differs from the backend's `0.1.0`.
2. On `http://localhost:5183/`, read the footer → it shows `v0.1.0`, and the text `0.0.0` appears nowhere in it.
3. Open dev tools, Network tab, reload the page → one `GET http://localhost:8010/api/version` request with status 200 is listed, which is where the footer's value came from.
4. Run `grep -n "package.json" frontend/src/components/AppFooter.tsx` from the repository root → no output: the component no longer imports the frontend package metadata.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as Criterion 1.
1. Run `docker compose stop backend` from the repository root → the backend container stops.
2. Reload `http://localhost:5183/` → the page still loads, heading and note form visible.
3. Read the footer → it reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap.
4. Run `docker compose start backend`, wait a few seconds, reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repository root → the run passes: its summary line reports no failed test and the command exits 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains `renders the version the backend reports` (present path) and `renders the app name without a version when the backend is unreachable` (absent path).

### Criterion 5: Before the request resolves, the footer shows the app name only
Prerequisites: as Criterion 1, Chrome or Edge.
1. Open dev tools on `http://localhost:5183/`, Network tab, set throttling to "Slow 3G", then reload → while `GET /api/version` is still pending, the footer reads `Task Notes` with no placeholder such as "loading" or "...".
2. Wait until the request completes → the footer changes to `Task Notes v0.1.0` without the rest of the page moving.
3. Set throttling back to "No throttling".
