# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written on the ticket)**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (ClickUp task 123k99ctgch, https://app.clickup.com/t/123k99ctgch. The tracker comment recorded under Re-Plan Feedback overrides the description where they disagree; the criteria below are the corrected set.)

## Acceptance Criteria
<!-- Corrected per the tracker comment: criterion 2's source is now the backend's GET /api/version at runtime, and criterion 3 now names the loading and failure states the comment asks to be decided. -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, the backend's version served at runtime by `GET /api/version` (itself read from `backend/pyproject.toml` `[project].version`), never a string typed into the component and never the frontend's own `package.json`. A frontend running against a backend of a different version shows the backend's version.
- [ ] 3. When the version cannot be resolved (request still in flight, backend unreachable, non-2xx response, or a body without a non-empty string `version`), the footer renders the app name alone, with no `undefined`, `null`, frontend-invented `unknown` placeholder, stray `v` or empty gap. (A backend that answers 200 with its own `"unknown"` sentinel has resolved a value and is shown verbatim; see Re-Plan Feedback (e).)
- [ ] 4. A component test asserts both paths: version present, and version absent (covering both the loading state and the failure state).

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: (a) the version source moves from `frontend/package.json` (imported at build time by TEST-04's `AppFooter.tsx`) to a runtime fetch of `GET /api/version`; criterion 2 rewritten accordingly, and the existing `package.json` import is removed from the component and from its tests. (b) **Backend change, stated explicitly:** the comment asks to add `GET /api/version`, but it already exists on main at efaa67d, delivered by TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`). It already returns the backend's own version from package metadata, which is exactly what the comment asks for, and its CORS setup already allows a GET from the frontend origin. So this item has a new **runtime** dependency on the backend but **no backend file change**; the Backend Plan says so and the File Manifest carries no `[B]` entry. Adding a second endpoint would duplicate TEST-05. (c) **Loading state, decided:** before the fetch resolves the footer reads `Task Notes` alone, no version, no spinner, no "loading" text. (d) **Failure state, decided:** if `/api/version` is unreachable, times out, answers non-2xx or answers with a malformed body, the footer reads `Task Notes` alone, the same render as loading. It is never blank (the app name always shows, so the landmark never collapses) and it never reads `unknown`. Chosen over `unknown` because criterion 3 of the description already asks that an unresolved version be omitted rather than replaced by a placeholder, and a frontend-invented `unknown` would be indistinguishable from the backend's own sentinel (next point). (e) **Assumption, recorded:** when the backend is reachable but cannot read its own package metadata, TEST-05's service answers 200 with `{"version": "unknown"}`. The footer shows that value verbatim (`Task Notes vunknown`) and does not special-case it: it is the backend's own answer about itself and tells the reader the API is reachable but unversioned, which is a different fact from "unreachable". The frontend does not hardcode the backend's sentinel string. (f) The ticket's Notes say `LandingPage.tsx` is modified; with the fetch living inside `AppFooter`, `LandingPage.tsx` needs no change (only its test does), which also removes the BUG-04 overlap on that file.

## Plan Overview
Replace the build-time `package.json` version in `AppFooter` with a runtime fetch of the existing backend endpoint `GET /api/version`. A new typed client module `frontend/src/api/version.ts` owns the call (timeout, non-2xx and shape checks) and throws on anything it cannot turn into a non-empty version string. `AppFooter` fetches once on mount, holds `string | null`, and renders the version segment only when it has one. The API base URL currently defined inside `frontend/src/api/notes.ts` is extracted to `frontend/src/api/baseUrl.ts` so both clients read the one deployment-dependent value from one place. Tests: Vitest for the client and the component (present, loading, failure), the existing LandingPage test switched off `package.json`, a new Playwright spec that checks the footer shows the backend's version end to end plus an aborted-request edge case, and TEST-04's spec retargeted from the frontend version to the backend version. No backend file changes, no new dependency.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, resolved exactly as today (`import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`), moved out of `notes.ts` unchanged.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of defining it; behaviour unchanged.
  - `frontend/src/api/version.ts` (new): `export type VersionResponse = { version: string }` and `export async function getBackendVersion(): Promise<string>`. Calls `fetch(\`${API_BASE_URL}/api/version\`, { signal: AbortSignal.timeout(VERSION_TIMEOUT_MS) })` with `VERSION_TIMEOUT_MS = 5000`. Throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response, and `Error("Loading the version failed: unexpected response")` when the parsed body is not an object whose `version` is a non-empty string (after trim). Returns `version` verbatim otherwise. Network errors and the timeout's `AbortError` propagate as rejections. No retry: the footer is informational and a reload retries.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import. `useState<string | null>(null)`; `useEffect` calls `getBackendVersion()` once on mount with the same `isMounted` guard LandingPage uses; on resolve set the version, on reject leave it `null` (a `catch` that sets `null`, with a one-line "why" comment). Render: `<footer data-testid="app-footer" style={footerStyle}>Task Notes{version !== null && <> <span data-testid="app-version">v{version}</span></>}</footer>`, so with no version the text content is exactly `Task Notes` with no trailing space. `footerStyle` unchanged.
- Routes: none.
- State management: local component state in `AppFooter`; no context, no store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Keep TEST-04's existing footer values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version span inherits them.

## Backend Plan
No backend changes required.

The tracker comment frames this as a backend change; it is a backend **dependency**, not a backend edit. `GET /api/version` already exists from TEST-05 and returns `{"version": "<backend pyproject version>"}` (0.1.0 at efaa67d), its CORS middleware already allows GET from `http://localhost:5183`, and `backend/tests/integration/test_version_integration.py` already covers its 200 and 405 paths. TEST-09 (concurrent) may add a field to that response; the client reads only `version`, so an additive change does not affect it.

## API Integration Plan
No external API integration. (The project's own backend is consumed through the dedicated client module above, following the precedent `frontend/src/api/notes.ts` set for coding_standards.md Section 4.)

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL or http://localhost:8010}/api/version`
- Request: no body, no parameters.
- Response: 200 `{"version": "0.1.0"}` (string, the backend's `[project].version`; `"unknown"` when the backend's metadata is missing, shown verbatim). Any additional field (TEST-09) is ignored. Non-2xx, network error, a 5000 ms timeout, or a body without a non-empty string `version` all make `getBackendVersion()` reject, and the footer renders `Task Notes` alone.

## Technology Selection
- Request timeout in `frontend/src/api/version.ts`: chose the native platform `AbortSignal.timeout(5000)` passed to `fetch` over a hand-built `setTimeout` plus `AbortController`, or a dependency such as axios, because the platform call covers it in one expression.
- HTTP client `frontend/src/api/version.ts`: chose the native `fetch` (already used by `notes.ts`) over adding an HTTP library; nothing to install.
- Response validation: chose a few lines of `typeof` checks over adding a schema library (zod is not installed), because the shape is one string field.
- `frontend/src/api/baseUrl.ts`: no stdlib call, native platform feature or installed dependency covers sharing one constant between two modules, so it is a plain module export built here.
- E2E helper `e2e/helpers/backendVersion.ts`: chose Node's built-in `node:fs` plus one regular expression over the `[project]` table's `version` line, over adding a TOML parser dependency, because only one key is read.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: the single source of `API_BASE_URL`, moved out of notes.ts
- [A] frontend/src/api/version.ts: typed client for GET /api/version with timeout, non-2xx and shape handling
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client
- [D] e2e/helpers/backendVersion.ts: reads the expected version from backend/pyproject.toml for the E2E specs
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E spec, footer shows the backend version, plus the aborted-request edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: the artifact copy of the manual UAT script build-feature writes

### Modified files
- [A] frontend/src/api/notes.ts: import API_BASE_URL from ./baseUrl instead of defining it
- [A] frontend/src/components/AppFooter.tsx: fetch the version at runtime, render it only when resolved, drop the package.json import
- [A] frontend/src/components/AppFooter.test.tsx: mock ../api/version; assert present, loading and failure paths; drop the package.json import
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version and assert the footer shows the mocked version instead of package.json's
- [D] e2e/tests/TEST-04_page_footer.spec.ts: assert the backend version from the shared helper instead of frontend/package.json's

No dependency changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure (the footer already needed the backend running for the notes form, and VITE_API_BASE_URL is already documented wiring).

## Testing Strategy
- Unit tests: frontend only (no backend logic changes).
  - `frontend/src/api/version.test.ts`, stubbing global `fetch` as `notes.test.ts` does: returns the version from a 200 body and calls `http://localhost:8010/api/version`; ignores an extra `commit` field; rejects on 500 with the status in the message; rejects on a body with a missing, non-string or empty `version`; rejects when fetch rejects (network error); passes an `AbortSignal` to fetch; uses `VITE_API_BASE_URL` when set (via `vi.stubEnv` plus `vi.resetModules`, asserting the resolved URL rather than the default literal).
  - `frontend/src/components/AppFooter.test.tsx`, mocking `../api/version`: version present (`getBackendVersion` resolves `9.9.9`, footer text becomes `Task Notes v9.9.9`, the `app-version` span exists); loading (a never-resolving promise, footer text is exactly `Task Notes`, no `app-version`); failure (rejects, after settling the footer text is exactly `Task Notes`, and contains none of `undefined`, `null`, `unknown`, `v `); contentinfo landmark and test id kept; `getBackendVersion` called once.
  - `frontend/src/components/LandingPage.test.tsx`: add `vi.mock("../api/version")` resolving a fixed version, and assert the footer shows it.
  - `notes.test.ts` stays as is and keeps passing (its `resetModules` re-import also re-evaluates `baseUrl.ts`).
  - Directory: co-located `*.test.ts(x)` under `frontend/src/` (the project's existing Vitest convention; CLAUDE.md's unit directory is the backend's)
  - Naming: `{Module}.test.ts(x)`, matching the existing frontend tests
- Integration tests: none added. The backend endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py`; no new router or repository code exists to integrate.
  - Directory: backend/tests/integration/
- E2E tests: `TEST-08_footer_app_version.spec.ts`: on `/`, the `app-footer` contains `Task Notes` and `v{backend version}` read from `backend/pyproject.toml` through the helper (0.1.0 at plan time, distinct from the frontend's 0.0.0, so a regression to package.json would fail it). Edge-case spec: `page.route("**/api/version", (route) => route.abort())` before `goto`, then the footer has text exactly `Task Notes` and no `app-version` element. `TEST-04_page_footer.spec.ts`: replace the `frontend/package.json` read with the same helper so its three version assertions follow the new source.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from the backend's GET /api/version at runtime, never typed in or read from package.json | Unit | verifying it needs no navigation or interaction: the component test proves the rendered value is the client's return value and the client test proves the URL; criterion 1's E2E spec additionally shows the backend's 0.1.0 against a frontend at 0.0.0 |
| 3 | When the version cannot be resolved, the footer renders the app name alone | Unit | verifying it needs no navigation or interaction: loading and failure are injected at the client mock in milliseconds; the aborted-request E2E spec is the feature's edge-case spec on top |
| 4 | A component test asserts both paths, present and absent | Unit | the criterion is itself a component test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | goto `/`, `app-footer` contains `Task Notes` and `v{pyproject version}` | Given the app and backend are running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Version from GET /api/version | covered at Unit, see Criterion coverage | Given the backend reports version 0.1.0 and the frontend package is 0.0.0, When I open the landing page, Then the footer shows 0.1.0 |
| 3 | Unresolved version omitted | covered at Unit; edge-case E2E aborts /api/version | Given the backend is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version |
| 4 | Component test covers both paths | covered at Unit | Given the frontend test suite, When AppFooter.test.tsx runs, Then 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: from the repository root, `docker compose up -d --build` has finished and `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0"}` (or the current `backend/pyproject.toml` version).
1. Open `http://localhost:5183/` in a browser → the landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer.
2. Read the footer text → it reads `Task Notes v0.1.0`, the same value the curl printed.

### Criterion 2: The version comes from the backend at runtime, not from package.json
Prerequisites: as Criterion 1; note `frontend/package.json` declares `"version": "0.0.0"`.
1. Open `http://localhost:5183/` with DevTools open on the Network tab → a GET to `http://localhost:8010/api/version` appears with status 200 and response `{"version":"0.1.0"}`.
2. Read the footer → it reads `Task Notes v0.1.0`, not `Task Notes v0.0.0`.
3. In `backend/pyproject.toml`, change `version = "0.1.0"` to `version = "0.1.1"`, run `docker compose up -d --build backend`, and wait until `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.1"}` → the frontend container is untouched.
4. Reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.1` without the frontend being rebuilt. Revert `pyproject.toml` to `0.1.0` and rebuild the backend again.

### Criterion 3: When the version cannot be resolved, the footer shows the app name alone
Prerequisites: as Criterion 1.
1. In DevTools, Network tab, set throttling to "Slow 3G" and reload `http://localhost:5183/` → while the `/api/version` request is pending the footer reads exactly `Task Notes`, with no "v", no "undefined", no "loading" text; once it completes the footer reads `Task Notes v0.1.0`. Set throttling back to "No throttling".
2. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the `/api/version` request fails in the Network tab, and the footer reads exactly `Task Notes`: not blank, no "v", no "undefined", "null" or "unknown", no trailing gap.
3. Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers, reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → Vitest reports `0 failed`, and the AppFooter output lists a version-present test, a loading test and a failure test.
