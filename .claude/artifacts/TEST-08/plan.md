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
> **Amended by the newest tracker comment (overrides the description where they disagree):** the version must come from the backend at runtime via `GET /api/version`, not from `package.json` at build time; a frontend rebuilt against an older backend must show the backend's version. The loading and failure states must be decided and recorded, and the backend involvement must be stated in the plan.

## Acceptance Criteria
<!-- Criteria 1 to 3 carry the tracker comment's correction; the ticket's original wording is quoted under ## Feature. -->
- [ ] 1. The footer on the landing page renders the backend's version string, as returned at runtime by `GET /api/version`.
- [ ] 2. The version comes from a single declared source, the backend's `GET /api/version` response, fetched at runtime; never a string typed into the component and never the frontend's `package.json` (a frontend served against a backend of a different version shows the backend's version).
- [ ] 3. When the version cannot be resolved (request still pending, backend unreachable, non-OK response, or the backend's own `"unknown"` sentinel), the footer renders without it, reading exactly `Task Notes`, rather than showing `undefined`, `null`, `unknown`, a dangling `v` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker, newest): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criteria 1 and 2 rewritten to name the backend's runtime response as the single source; `AppFooter.tsx` drops its `package.json` import and fetches through a new `frontend/src/api/version.ts` client. The endpoint itself **already exists on main**: TEST-05 shipped `GET /api/version` (`backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`), returning `{"version": "<backend/pyproject.toml version>"}` from package metadata. So no endpoint is added; re-creating it would duplicate TEST-05.
- Comment (tracker, newest), loading and failure states: "Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers." → Addressed by: **decision recorded**. Before the fetch resolves, and whenever it fails (network error, CORS failure, non-OK status, a body with no string `version`, or the backend's sentinel `"unknown"` / an empty string), the footer reads `Task Notes` alone: never blank, never `unknown`, never `v` with nothing after it, and no placeholder such as an ellipsis. Reason: the ticket's criterion 3 asks the footer to render without an unresolved version, and the app name keeps the footer landmark present and non-empty; showing `unknown` would put the backend's own fallback sentinel on screen as if it were a version. On success it reads `Task Notes v{version}`, the existing TEST-04 format. No retry: one fetch on mount, matching how `LandingPage` loads notes.
- Comment (tracker, newest), backend scope: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Backend Plan`. The item's dependency on the backend is real (the footer now needs the backend's `GET /api/version`), but the backend **code** change is zero, because TEST-05 already delivered the endpoint with exactly the shape the comment asks for. The manifest therefore carries no `[B]` entry, deliberately. Concurrency note: TEST-09 (planned in this run) extends the same endpoint's response with a build commit; that is an additive field, and this footer reads only `version`, so the two items are compatible in either merge order.
- Comment (tracker, operator note, older): "TEST-08 changed LandingPage.tsx, which TEST-04 also touched; reverting restores TEST-04's footer assertion as it was." → Addressed by: taken as context. This plan keeps the fetch inside `AppFooter.tsx` so `LandingPage.tsx` is **not** modified (which also avoids BUG-04's likely edit to it). TEST-04's artifacts that assert the footer shows `frontend/package.json`'s version become false under the correction and are re-pointed to the backend's version: `frontend/src/components/LandingPage.test.tsx`, `e2e/tests/TEST-04_page_footer.spec.ts`, `e2e/uat/scenarios/TEST-04_page_footer.feature`, `e2e/uat/scripts/TEST-04_page_footer_uat_script.md`.
- Description note "It modifies `LandingPage.tsx`": not acted on as written, because placing the fetch in `AppFooter.tsx` keeps the footer self-contained and leaves `LandingPage.tsx` untouched; its test file still changes (it asserts the footer version).
- Merged since the last plan: n/a (fresh plan, branched from current main 81e1e8f; prior builds of this item are not on main).

## Plan Overview
Frontend change, backed by an existing backend endpoint. `AppFooter` stops importing `frontend/package.json` and instead calls a new typed client function `getBackendVersion()` in `frontend/src/api/version.ts`, which fetches `GET {API_BASE_URL}/api/version`. The API base URL resolution, today private to `frontend/src/api/notes.ts`, moves to one shared module `frontend/src/api/baseUrl.ts` so both clients read the same value from the same source (`coding_standards.md` Section 5: one value, one source). The footer holds the resolved version in component state: absent while loading or on failure (renders `Task Notes`), present on success (renders `Task Notes v0.1.0` with the current backend). No backend, database or dependency changes. Tests: client unit tests, component tests for both paths, re-pointed TEST-04 assertions, one new E2E spec covering the live cross-stack value and the unreachable-endpoint edge case.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx` (modify): remove `import { version } from "../../package.json"`; add `useState<string | null>(null)` and a mount `useEffect` that calls `getBackendVersion()`, sets the version on success, leaves it `null` on rejection (with the same `isMounted` guard `LandingPage` uses). Render `Task Notes` plus, only when the version is a non-null string, ` v{version}` inside `<span data-testid="app-footer-version">`. Keep `<footer data-testid="app-footer">`, the contentinfo landmark and `footerStyle` unchanged.
  - `frontend/src/api/version.ts` (new): `getBackendVersion(): Promise<string | null>`. Fetch `${API_BASE_URL}/api/version`; on network error or non-OK status, reject with `Loading the version failed: {status} {statusText}` (mirroring `notes.ts`'s `requestFailed`); on OK, return `body.version` when it is a non-empty string other than `"unknown"` (the backend's `UNKNOWN_VERSION` sentinel in `backend/app/services/version_service.py`), else `null`. Exported type `VersionResponse = { version: string }`.
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of defining it; behaviour unchanged.
  - `frontend/src/components/LandingPage.tsx`: **not modified**.
- Routes: none.
- State management: local `useState` in `AppFooter`; no shared store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's existing styles (font-size 0.875rem, color #5f5f5f, margin-top 1.5rem); no new visual values.

## Backend Plan
No backend changes required. The footer depends on `GET /api/version`, which TEST-05 already delivered on main (router `backend/app/routers/version.py`, service `backend/app/services/version_service.py`, schema `backend/app/schemas/version.py`, registered in `backend/app/main.py`) and which already returns the backend's version from package metadata with HTTP 200 and no database. CORS already allows `GET` from the configured frontend origins (`backend/app/main.py`, `settings.cors_origins`), the same path the notes list uses from the browser. This is the backend involvement the tracker comment asked to be named: a runtime dependency, no code change. TEST-09, planned concurrently, adds a commit field to this response; the footer ignores fields other than `version`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05; called at `${VITE_API_BASE_URL or http://localhost:8010}/api/version`)
- Request: none
- Response: 200, `{"version": "0.1.0"}` (the value of `backend/pyproject.toml` `[project].version`; `"unknown"` when the backend's package metadata is missing). TEST-09 may add further fields; the client reads `version` only.
- Client mapping: string other than empty or `"unknown"` → shown; anything else, or any failure → not shown.

## Technology Selection
- `frontend/src/api/version.ts` (version client): chose the browser's native `fetch`, the same as `notes.ts`, over adding a dependency such as axios or a data-fetching library; one GET needs nothing more.
- Footer loading/failure state: chose React's built-in `useState` and `useEffect` (already installed) over a data-fetching or state library.
- `frontend/src/api/baseUrl.ts`: no stdlib call, native feature or installed dependency covers a shared constant, so it is a few lines moved out of `notes.ts`; chosen over duplicating the env lookup in a second client, which would give one deployment value two sources.
- Version source: chose the backend's existing `GET /api/version` over Vite's build-time `define` or the `package.json` import, per the tracker comment (the build-time value is the frontend's, not the backend's).
- No new dependency is added.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: the single source of the API base URL, shared by every client module
- [A] frontend/src/api/version.ts: typed client for `GET /api/version`, returning the backend version or null when unresolved
- [A] frontend/src/api/version.test.ts: unit tests for the version client (success, non-OK, network error, `"unknown"` sentinel, empty string, configured base URL)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: footer shows the live backend version; footer reads `Task Notes` alone when `/api/version` is unreachable
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version on mount; render it only when resolved; drop the `package.json` import
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present (`Task Notes v0.1.0`), absent while pending, absent on rejection, absent on null; keep the name and landmark tests
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and re-point the footer assertion from the `package.json` version to the mocked backend version
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it
- [D] e2e/tests/TEST-04_page_footer.spec.ts: re-point the version assertions from `frontend/package.json` to `backend/pyproject.toml`'s version (the value the live backend reports)
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step now names the backend's reported version instead of `frontend/package.json`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare against `backend/pyproject.toml` (or `GET /api/version`) instead of `frontend/package.json`

No dependency manifest changes, so no lockfile is regenerated. No `README.md` or `docs/DEVELOPMENT.md` edit is expected: the feature changes no project structure, run configuration, dependency or test infrastructure (`VITE_API_BASE_URL` is already documented and already used by the notes client).

## Testing Strategy
- Unit tests: `frontend/src/api/version.test.ts` (stub `fetch`, as `notes.test.ts` does: OK body returns the version; non-OK rejects with status text; fetch rejection propagates; `"unknown"` and `""` resolve to null; `VITE_API_BASE_URL` override changes the URL). `frontend/src/components/AppFooter.test.tsx` with `../api/version` mocked: present path renders `Task Notes v0.1.0` and the `app-footer-version` span; absent paths (pending promise, rejected promise, resolved null) render exactly `Task Notes`, no `app-footer-version`, and no text `undefined`, `null`, `unknown` or a trailing `v`. `notes.test.ts` must still pass unchanged after the base URL move.
  - Directory: frontend tests are co-located under `frontend/src/` (Vitest, the existing precedent); backend `backend/tests/unit/` is untouched
  - Naming: `{module}.test.ts(x)` beside the module, the existing frontend precedent
- Integration tests: no new backend code, so none are added; the endpoint the footer consumes stays covered by the existing `backend/tests/integration/test_version_integration.py` (TEST-05), which must still pass.
  - Directory: backend/tests/integration/
- E2E tests: one spec with the live stack. (a) Navigate to `/`; the footer contains `Task Notes` and the version read from `backend/pyproject.toml` (`0.1.0`), and does not contain `frontend/package.json`'s `0.0.0`, which proves the source is the backend. (b) Edge case: `page.route("**/api/version", route => route.abort())` before navigation; the footer's text is exactly `Task Notes` and `app-footer-version` is absent. TEST-04's spec is re-pointed to the backend version.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer on the landing page renders the backend's version string from `GET /api/version` | E2E | — |
| 2 | Single declared source: the backend's runtime response, never typed and never `package.json` | Unit | verifying it needs no navigation or interaction: the client test asserts the URL and the returned body value, and the component test asserts the footer shows what the client returned; E2E criterion 1's spec additionally shows `0.1.0` and not the frontend's `0.0.0` |
| 3 | Unresolved version (pending, unreachable, non-OK, `"unknown"`) renders `Task Notes` alone | Unit | verifying it needs no navigation or interaction: it is a render branch of `AppFooter` on a pending, rejected or null client result; the E2E edge-case spec exercises the unreachable case once more against the real page |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component-test requirement, satisfied by `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the backend's version | Go to `/`, expect `app-footer` to contain `Task Notes` and `backend/pyproject.toml`'s version | Given the app and backend are running When I open the landing page Then the footer shows "Task Notes v" followed by the backend's version |
| 2 | Single runtime source, the backend | covered at Unit, see Criterion coverage (plus the `0.0.0` negative assertion in criterion 1's spec) | Given the backend reports a version that differs from frontend/package.json When I open the landing page Then the footer shows the backend's version |
| 3 | Unresolved version renders the name alone | covered at Unit, see Criterion coverage; E2E edge case aborts `/api/version` and expects text exactly `Task Notes` | Given the backend's version endpoint is unreachable When I open the landing page Then the footer reads "Task Notes" with no version, "unknown" or "undefined" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter tests Then both the present and absent paths pass |

## Manual verification plan
### Criterion 1: The footer on the landing page renders the backend's version string from GET /api/version
Prerequisites: the stack is running (`docker compose up -d` from the repository root), backend on http://localhost:8010, frontend on http://localhost:5183.
1. Open http://localhost:8010/api/version in a browser tab → the page shows `{"version":"0.1.0"}` (TEST-09 may add more fields; note the `version` value).
2. Open http://localhost:5183/ → the landing page shows the `Task Notes` heading, the note form, and a footer at the bottom.
3. Read the footer → it reads `Task Notes v0.1.0`, the same version as step 1.

### Criterion 2: The version comes from the backend at runtime, never typed and never package.json
Prerequisites: as for criterion 1.
1. Open `frontend/package.json` and read its `version` field → it is `0.0.0`.
2. Open `backend/pyproject.toml` and read `[project].version` → it is `0.1.0`.
3. Open http://localhost:5183/ and read the footer → it shows `v0.1.0`, the backend's value, not `0.0.0`.
4. Open browser DevTools, Network tab, reload the page → one request to `http://localhost:8010/api/version` returns 200, and its `version` matches the footer.
5. Open `frontend/src/components/AppFooter.tsx` → no version literal and no `package.json` import appear in it.

### Criterion 3: An unresolved version renders the footer as Task Notes alone
Prerequisites: the stack is running as for criterion 1.
1. Stop the backend only: `docker compose stop backend` → http://localhost:8010/api/version no longer answers.
2. Open http://localhost:5183/ and reload → the footer reads exactly `Task Notes`, with no `v`, no `unknown`, no `undefined`, no `null` and no trailing gap.
3. In DevTools, Network tab → the `/api/version` request shows as failed.
4. Start the backend again: `docker compose start backend`, then reload the page → the footer reads `Task Notes v0.1.0`.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`, and the AppFooter test list includes a version-present test and version-absent tests (pending, rejected, null).
