# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (Source: ClickUp task 123k99ctgch, workspace 30307190. Criterion 2's source and the frontend-only note are superseded by the tracker comment recorded under `## Re-Plan Feedback`.)

## Acceptance Criteria
<!-- Criterion 2 as amended by the tracker comment (comment overrides description). -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, which (per the tracker correction) is the backend at runtime via `GET /api/version`, never `package.json` at build time and never a string typed into the component. A frontend running against a backend with a different version shows the backend's version.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 is amended (see `## Acceptance Criteria`). `AppFooter.tsx` stops importing `frontend/package.json` and fetches `GET /api/version` through a new client module `frontend/src/api/version.ts`. The endpoint itself **already exists on main**: TEST-05 delivered `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py`, registered in `backend/app/main.py`, returning `{"version": "<backend/pyproject.toml [project].version>"}` from installed package metadata, with unit and integration tests. Adding it again would duplicate delivered work, so this plan adds no backend file.
- Comment (tracker), consequence 1, loading and failure states: → Addressed by this recorded decision: **before the fetch resolves, and whenever the version cannot be resolved, the footer reads exactly `Task Notes`** (the app name alone, with no `v`, no placeholder, no spinner, and no trailing space). "Cannot be resolved" means: a network error, a non-OK HTTP status, a response body whose `version` is missing, not a string, or empty after trimming, or the backend's own sentinel value `unknown` (which `version_service.py` returns when its distribution metadata is absent). Chosen over a blank footer (a blank footer drops the app-name identification that TEST-04 delivered and reads as a rendering fault) and over `Task Notes vunknown` (criterion 3 forbids a placeholder in the version's place, and `unknown` would read as though a version had been reported). On success the footer reads `Task Notes v{version}`, e.g. `Task Notes v0.1.0`. The footer element itself (`data-testid="app-footer"`, `contentinfo` role) is always rendered, so the page layout never shifts on load. This matches the footer behaviour already described in `docs/DEVELOPMENT.md` (the pending and failure cases render `Task Notes` only).
- Comment (tracker), consequence 2, backend change on a frontend-only item: → Addressed by stating it here and in `## Plan Overview` and `## Backend Plan`: the description frames TEST-08 as frontend-only, the correction makes it depend on a backend endpoint, and that endpoint is already on main (TEST-05), so **the build has a runtime dependency on the backend but no backend file in the File Manifest**. The tracker note "Touches no backend file" stays true of the diff and no longer true of the runtime: the E2E specs need the backend running.
- Assumption (ambiguity, recorded rather than asked): the comment says a frontend "rebuilt against an older backend must show the backend's version". This plan reads it as: the footer shows whatever string the backend's `/api/version` returns, with no comparison against the frontend's own `package.json` version and no warning on mismatch (a mismatch indicator is not asked for; `user_story_alignment.md` Section 3).
- Assumption: no fetch timeout or retry is added. The map's CHORE-02 ("TEST-08 follow-up: known-improvements", depends on TEST-08) names a fetch timeout in `frontend/src/api/version.ts` as its own scope, and the existing `frontend/src/api/notes.ts` client sets none either.

## Plan Overview
Frontend change plus the test updates it forces. A new typed API client `frontend/src/api/version.ts` calls the backend's existing `GET /api/version`; `AppFooter.tsx` fetches it on mount and renders `Task Notes v{version}` on success and `Task Notes` while pending or on any failure. The API base URL, today defined privately in `frontend/src/api/notes.ts`, moves to a shared `frontend/src/api/baseUrl.ts` so both clients resolve it from one place (`coding_standards.md` Section 5, one value one source). `LandingPage.tsx` is not modified (it already renders `<AppFooter />`). **Backend: no changes.** The endpoint this item now depends on was delivered by TEST-05; this item is no longer frontend-only at runtime, only in its diff.

Tests whose expectations change because the source changed: `AppFooter.test.tsx`, `LandingPage.test.tsx` (both currently assert the `package.json` version) and the TEST-04 E2E spec (also asserts the `package.json` version; the backend reports `0.1.0` while `frontend/package.json` is `0.0.0`, so it would fail). TEST-04's UAT scenario and manual script name `frontend/package.json` as the expected source and are corrected to the backend.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts` (same default, same env var).
  - `frontend/src/api/notes.ts` (modify): drop its local `DEFAULT_API_BASE_URL` and `API_BASE_URL`, import `API_BASE_URL` from `./baseUrl`. No behaviour change; `notes.test.ts` keeps passing unchanged (its `vi.resetModules()` re-evaluates `baseUrl.ts` too).
  - `frontend/src/api/version.ts` (new): `export type VersionResponse = { version: string }` and `export async function getVersion(): Promise<VersionResponse>`. Calls `fetch(`${API_BASE_URL}/api/version`)`; on a non-OK response throws `Loading the version failed: {status} {statusText}` (the `notes.ts` message shape); parses JSON and throws `Loading the version failed: unexpected response shape` unless `version` is a string that is non-empty after trimming. Returns `{ version }` only, ignoring extra fields (TEST-09, planned concurrently, adds a `commit` field to the same response).
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. Add `const UNKNOWN_BACKEND_VERSION = "unknown"` (the backend sentinel, explained in a "why" comment). State `version: string | null`, initially `null`. A `useEffect` with an `isMounted` guard (the `LandingPage.tsx` pattern) calls `getVersion()`; on success sets `version` unless it equals `UNKNOWN_BACKEND_VERSION`; on rejection leaves it `null`. Render `{APP_NAME}` followed by ` v{version}` only when `version` is non-null, so the text is exactly `Task Notes` or `Task Notes v0.1.0`. Keep `data-testid="app-footer"`, the `<footer>` element and `footerStyle` unchanged.
- Routes: none (landing page `/` only).
- State management: local `useState` in `AppFooter`; no shared state.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.
<!-- The GET /api/version endpoint the tracker correction asks for is already on main (TEST-05): backend/app/routers/version.py, backend/app/services/version_service.py, backend/app/schemas/version.py, registered in backend/app/main.py, covered by backend/tests/unit/test_version_service_unit.py and backend/tests/integration/test_version_integration.py. CORS already allows GET from http://localhost:5183. -->

## API Integration Plan
No external API integration.

## API Contract
Consumed, not created (existing TEST-05 endpoint):
- Method: GET
- URL: `/api/version` on `API_BASE_URL` (default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0"}` today. The client reads `version` only and tolerates additional fields (TEST-09 adds `commit`). The value `"unknown"` is the backend's not-resolvable sentinel and is displayed as no version.
- Client-side failure handling: network error, non-OK status, or a body without a non-empty string `version` all reject `getVersion()`; `AppFooter` then renders `Task Notes`.

## Technology Selection
- `frontend/src/api/version.ts` HTTP call: chose the browser's native `fetch` over adding a client library (axios or similar), because `fetch` covers one GET and is what `notes.ts` already uses.
- Footer loading and failure state: chose React's own `useState` and `useEffect` (installed) over a data-fetching library (react-query, SWR), because one request on mount needs no cache or retry.
- Response shape check: chose a hand-written `typeof` check of one field over a schema library (zod), because one string field takes two lines and no such dependency is installed.
- `frontend/src/api/baseUrl.ts`: chose a shared module over duplicating the `VITE_API_BASE_URL` default in `version.ts`, because two copies of a deployment-dependent default is what `coding_standards.md` Section 5 forbids; no stdlib or platform feature applies.
- E2E version expectation: chose Playwright's installed `page.waitForResponse` (read the value the browser actually received) and `page.route` (simulate an unreachable endpoint) over hardcoding a backend URL or port in the spec, because the browser's own response is the runtime source the criterion names.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: the single source of `API_BASE_URL` (env `VITE_API_BASE_URL`, default `http://localhost:8010`), moved from `notes.ts`
- [A] frontend/src/api/version.ts: typed client `getVersion()` for `GET /api/version`, with non-OK and response-shape failures
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the client with `fetch` stubbed (default URL, configured `VITE_API_BASE_URL`, extra fields ignored, non-OK throws, missing, non-string and empty `version` throw)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E, footer shows the version the browser received from `/api/version`; edge spec: `/api/version` aborted, footer reads exactly `Task Notes`
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the version via `getVersion()`; render `Task Notes v{version}` on success, `Task Notes` while pending, on failure, or on the `unknown` sentinel
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present (`Task Notes v9.9.9` from the mock, and not the `package.json` value), version absent while pending, on rejection, and on `unknown` (exact text `Task Notes`, no `undefined`, `null`, `v` or trailing space); keep the name and landmark assertions
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` alongside `../api/notes`; the footer assertion expects the mocked backend version instead of the `package.json` import
- [D] e2e/tests/TEST-04_page_footer.spec.ts: replace the `frontend/package.json` version expectation with the version from the `/api/version` response the page received (`page.waitForResponse`), in the three tests that assert it; drop the `package.json` read
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the step naming `frontend/package.json` as the version's source names the backend's `/api/version` instead
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisite and step 4 compare the footer to `http://localhost:8010/api/version` instead of `frontend/package.json`

No dependency is added or changed, so no lockfile is produced. Neither README.md nor docs/DEVELOPMENT.md needs an edit: no structure, run configuration, dependency or test-infrastructure change, and docs/DEVELOPMENT.md already describes the footer reading `GET /api/version` at runtime with `Task Notes` alone on pending or failure. backend/ is untouched (the endpoint exists since TEST-05), and frontend/src/components/LandingPage.tsx is untouched (it already renders `<AppFooter />`).

## Testing Strategy
- Unit tests: (Vitest, frontend) the `getVersion()` client in `frontend/src/api/version.test.ts` with `fetch` stubbed via `vi.stubGlobal` (the `notes.test.ts` pattern): happy path, `VITE_API_BASE_URL` override, extra `commit` field ignored, non-OK error, three shape errors. `AppFooter.test.tsx` with `../api/version` mocked: present path, pending path, rejected path, `unknown` path, landmark. `LandingPage.test.tsx` updated mock. No backend unit tests: no backend change.
  - Directory: colocated `frontend/src/**` `*.test.ts(x)` (the project's existing Vitest layout; `backend/tests/unit/` is unchanged)
  - Naming: `{Module}.test.tsx` / `{module}.test.ts`, matching the existing frontend tests
- Integration tests: no new ones. The consumed endpoint's router behaviour is covered by the existing `backend/tests/integration/test_version_integration.py` (TEST-05), and this item changes no router, repository or model.
  - Directory: backend/tests/integration/
- E2E tests: the footer showing the runtime backend version on `/`, and the unreachable-endpoint edge case; TEST-04's spec realigned to the backend source.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from the backend at runtime via `GET /api/version`, never `package.json` or a typed string | Unit | verifying it needs no navigation or interaction: the client test asserts the request URL and the component test asserts the footer shows the mocked API value, not the `package.json` value; the criterion 1 E2E spec additionally compares the footer to the response the browser received |
| 3 | When the version cannot be resolved, the footer renders without it (no `undefined`, `null` or gap) | Unit | verifying it needs no navigation or interaction: pending, rejected and `unknown` are mocked-client states of one component, asserted on exact text; the E2E edge spec (aborted `/api/version`) is the feature's required edge-case spec on top |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component test, which is the unit tier |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Start waiting for the `**/api/version` response, `page.goto("/")`, read `version` from that response's JSON, expect `getByTestId("app-footer")` to have text `Task Notes v{version}` | Given the app and backend are running, When I open the landing page, Then the footer reads "Task Notes v" followed by the backend's version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage (the criterion 1 spec compares against the runtime response) | Given the backend reports a version different from frontend/package.json, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolvable version renders without it | covered at Unit, see Criterion coverage; edge spec: `page.route("**/api/version", (r) => r.abort())`, then expect the footer to have exact text `Task Notes` | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter component tests, Then both the version-present and version-absent tests pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: on branch `feature/TEST-08-footer-app-version`; from the repository root `docker compose up --build` has started `db`, `backend` and `frontend` (frontend on `http://localhost:5183`, backend on `http://localhost:8010`).
1. Open `http://localhost:8010/api/version` in a browser tab → the JSON shows `"version": "0.1.0"` (the value of `[project].version` in `backend/pyproject.toml`; a `commit` field may also be present once TEST-09 has merged).
2. Open `http://localhost:5183/` → the landing page loads with the "Task Notes" heading.
3. Scroll to the bottom of the page → the footer reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not package.json
Prerequisites: as Criterion 1; `frontend/package.json` still has `"version": "0.0.0"` and `backend/pyproject.toml` has `version = "0.1.0"`.
1. Open `frontend/package.json` and `backend/pyproject.toml` → the two versions differ (`0.0.0` and `0.1.0`).
2. Open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, the backend's version, and not `Task Notes v0.0.0`.
3. Open the browser DevTools Network tab and reload `http://localhost:5183/` → a GET request to `http://localhost:8010/api/version` appears with status 200, and its response `version` equals the version shown in the footer.
4. Open `frontend/src/components/AppFooter.tsx` → it imports nothing from `package.json` and contains no version string literal such as `0.1.0`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as Criterion 1.
1. On `http://localhost:5183/`, open DevTools Network, right-click the `version` request, choose "Block request URL", and reload → the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap.
2. Unblock the URL in DevTools, then in a terminal run `docker compose stop backend` and reload `http://localhost:5183/` → the footer again reads exactly `Task Notes`, and the heading and note form still render.
3. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, and reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → there is a test where the mocked `getVersion` resolves and the footer text includes the mocked version, and tests where it is pending, rejects, or resolves to `unknown` and the footer text is exactly `Task Notes`.
