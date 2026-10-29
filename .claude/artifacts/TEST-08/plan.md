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
> Source: ClickUp task 123k99ctgch, fetched with clickup_get_task (workspace 30307190) in this dispatch. The tracker comment under `## Re-Plan Feedback` amends criteria 1 and 2 and adds criterion 5; the criteria below are the amended set.

## Acceptance Criteria
- [ ] 1. The landing page footer renders the version string, fetched at runtime from the backend's `GET /api/version`.
- [ ] 2. The version comes from a single declared source, the backend's own version (`backend/pyproject.toml` `[project].version`, read from installed package metadata by the existing `version_service`), never a string typed into the component and no longer the frontend's `package.json` (amended by the tracker comment).
- [ ] 3. When the version cannot be resolved (request still pending, backend unreachable or timed out, non-2xx response, malformed body, or the backend's own `unknown` sentinel) the footer renders `Task Notes` with no version segment, never `undefined`, `null`, `unknown`, a trailing `v` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent (pending and failed).
- [ ] 5. A frontend served against a backend whose version differs from the frontend bundle's own `package.json` version shows the backend's version, not its own (added by the tracker comment).

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: (a) the comment overrides criterion 2's "frontend package metadata or a build-time variable": the source is now the backend at runtime, criteria 1 and 2 are amended and criterion 5 is added for the partial-deploy case; `AppFooter.tsx` drops its `package.json` import. (b) Loading state, decided: before the fetch resolves the footer reads exactly `Task Notes` (app name, no version segment, no "loading" text, no spinner). Failure state, decided: when `/api/version` is unreachable, times out, answers non-2xx, returns a malformed body or returns the backend's `unknown` sentinel, the footer also reads exactly `Task Notes`. It is never blank (the app name always renders, so the footer keeps its height and its contentinfo landmark) and never reads `unknown` (a version string that names nothing tells the reader nothing, and criterion 3 already rules out placeholder text). Pending and failed render identically on purpose: the version is supplementary, and a transient "loading" label would flash on every page load. (c) Backend change, stated explicitly: **no backend file is changed by this plan, because the endpoint the comment asks for already exists on main.** `GET /api/version` was delivered by TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py` line 54, covered by `backend/tests/integration/test_version_integration.py`). It returns `{"version": "<pyproject version>"}`, falls back to the sentinel `"unknown"` when package metadata is missing, and the backend's CORS middleware already allows `GET` from `http://localhost:5183`. The item therefore stays frontend-only in its File Manifest, but it now has a runtime dependency on the backend that the description did not have: the footer shows a version only when the backend answers. That dependency is the point of the correction, and it is recorded here so it is not discovered from the manifest. Assumption made (the comment is silent on it): the backend's `unknown` sentinel is treated as "not resolved" by the frontend client, so the footer omits the segment rather than printing `vunknown`.

## Plan Overview
Frontend-only change against an existing backend endpoint. A new typed API client function, `fetchBackendVersion()` in `frontend/src/api/version.ts`, calls `GET {API_BASE_URL}/api/version` and returns the version string or throws. `AppFooter` fetches it once on mount, holds it in local state (`string | null`), and renders `Task Notes v{version}` when present and `Task Notes` otherwise. The API base URL, today declared privately inside `frontend/src/api/notes.ts`, moves to one shared module `frontend/src/api/baseUrl.ts` so the notes client and the version client read one source (`coding_standards.md` Section 5, one value, one source). `LandingPage.tsx` is not modified: `AppFooter` owns its own fetch, which also keeps this item off the file BUG-04 is expected to edit. Tests that asserted the `package.json` version (the AppFooter and LandingPage component tests, the TEST-04 E2E spec) are updated to the backend-sourced behaviour.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx` (modify): remove `import { version } from "../../package.json"`; add `useState<string | null>(null)` and a mount-time `useEffect` calling `fetchBackendVersion()` with an `isMounted` guard (same pattern as `LandingPage.tsx`'s notes load); on resolve set the version, on reject leave it `null` (the rejection is swallowed deliberately: the footer is supplementary and must never break the page). Render `{APP_NAME}` followed by ` v{version}` only when `version` is a non-empty string, so no trailing space, `v`, `undefined` or `null` can appear. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and the existing `footerStyle` unchanged. Add `data-testid="app-footer-version"` on a `<span>` wrapping the ` v{version}` segment so tests can assert presence and absence precisely.
  - `frontend/src/api/version.ts` (new): `type VersionResponse = { version: string }` and `export async function fetchBackendVersion(): Promise<string>`. Calls `fetch(`${API_BASE_URL}/api/version`, { signal })` where `signal` comes from an `AbortController` aborted by a `setTimeout` of `VERSION_REQUEST_TIMEOUT_MS = 5000` (cleared in `finally`), so a hung backend resolves to the absent state instead of leaving the request open (`coding_standards.md` Section 4 timeout handling). Throws `Loading the backend version failed: {status} {statusText}` on a non-OK response (covers 401/403, 429 and 5xx); parses JSON and throws when the body has no non-empty string `version` field (unexpected response shape) or when `version` equals the backend sentinel `UNRESOLVED_BACKEND_VERSION = "unknown"`; otherwise returns the string. Network errors and the timeout abort propagate as the `fetch` rejection. No retry: Section 4 asks for retry "when appropriate", and for a supplementary footer label a reload is the retry; backoff would only delay the absent state. Extra body fields are ignored, so a later backend that adds fields (TEST-09's `commit`) does not break it.
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts` (same default, same env var).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` and delete its private `DEFAULT_API_BASE_URL` / `API_BASE_URL` declarations. No behaviour change; `notes.test.ts`'s `VITE_API_BASE_URL` test keeps passing because `vi.resetModules()` re-evaluates the import chain.
- Routes: none (the landing page at `/` is unchanged).
- State management: local component state in `AppFooter` (`string | null`), no global store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps its existing TEST-04 values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version segment inherits them and adds no styling of its own.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05) and returns the backend's version from `backend/pyproject.toml` via installed package metadata; CORS already allows `GET` from the frontend origin. See `## Re-Plan Feedback` (c) for why the tracker comment's "add a GET /api/version endpoint" needs no new backend code.

## API Integration Plan
No external API integration. The footer consumes this project's own backend through the client layer in `frontend/src/api/`.

## API Contract
- Method: GET
- URL: `/api/version` (absolute: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version`)
- Request: no body, no query parameters
- Response: `200 OK`, `{"version": "0.1.0"}`. The backend answers `{"version": "unknown"}` when its package metadata is missing; the frontend client treats that value as unresolved. Any other status, a body without a non-empty string `version`, a network failure or no answer within 5 seconds is unresolved too.

## Technology Selection
- Version fetch (`frontend/src/api/version.ts`): chose the platform `fetch` API, the same one `notes.ts` already uses, over adding an HTTP client library (axios, ky) or a data-fetching library (React Query, SWR); one GET with no caching or retry needs nothing more.
- Request timeout: chose the platform `AbortController` plus `setTimeout` over a timeout library, and over `AbortSignal.timeout()`, whose availability in the Vitest jsdom environment is not guaranteed.
- Footer loading/failure state: chose React's built-in `useState` and `useEffect` over a state or suspense library; one nullable string covers both states.
- Shared base URL (`frontend/src/api/baseUrl.ts`): chose a plain module exporting the existing `import.meta.env` read (Vite's native env feature, already used) over duplicating the env read in the new client or adding a config library.
- Response validation: chose a plain `typeof` check over adding a schema library (zod); the body has one field.
- E2E failure path: chose Playwright's built-in `page.route` interception (already installed) over a mock server.
- No new dependency is added, so no lockfile changes.

## File Manifest
<!--
  Phase tags used here: [A] Frontend Plan (code and its Vitest tests),
  [D] Testing Strategy (Playwright specs), [G] Acceptance Test Outline (UAT).
-->
### New files
- [A] frontend/src/api/baseUrl.ts: single declaration of `API_BASE_URL` (moved from notes.ts) shared by every API client
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`, with timeout, non-OK, malformed-body and `unknown`-sentinel handling
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client with `fetch` stubbed
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright specs for the backend-sourced version, the differing-version case and the unreachable-backend edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import; fetch the backend version on mount; render the version segment only when resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert present path and absent paths (pending, rejected) instead of the package.json version
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and replace the package.json version assertion with the mocked backend version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: stop reading frontend/package.json; assert the footer's app name and a backend-sourced version instead, since the footer no longer shows the package.json version

No dependency is added or changed, so no lockfile is listed. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the project structure, run configuration, dependencies and test infrastructure are unchanged, and `docs/DEVELOPMENT.md` already describes the footer as showing the version the backend reports.
`frontend/src/components/LandingPage.tsx` is deliberately not modified (AppFooter owns its fetch). TEST-04's own Gherkin scenario and UAT script under `e2e/uat/` still describe the package.json version; they are TEST-04's historical artifacts, are not executed, and are left unchanged to stay in scope.

## Testing Strategy
- Unit tests (Vitest, frontend; the backend needs none, it is unchanged):
  - `frontend/src/api/version.test.ts`: returns the version from a 200 body; requests `http://localhost:8010/api/version` by default and `{VITE_API_BASE_URL}/api/version` when set (asserting the resolved URL, not the fallback literal alone); passes an abort signal and rejects when the request is aborted by the timeout (fake timers); throws with status and reason on a non-OK response (500 and 503); throws on a body with no `version`, a non-string `version` and an empty string; throws on the `unknown` sentinel; ignores extra body fields; propagates a network rejection.
  - `frontend/src/components/AppFooter.test.tsx`: with `fetchBackendVersion` mocked to resolve `9.9.9-test`, the footer reads `Task Notes v9.9.9-test` and `app-footer-version` is present (present path, and proof the text comes from the client, not a literal or package.json); while the promise is pending the footer reads exactly `Task Notes` and `app-footer-version` is absent; when it rejects the footer reads exactly `Task Notes` and contains none of `undefined`, `null`, `unknown`; the contentinfo landmark and `app-footer` test id remain.
  - `frontend/src/components/LandingPage.test.tsx`: mock `../api/version`; the footer test asserts the mocked backend version.
  - Existing `frontend/src/api/notes.test.ts` must keep passing unchanged after the base-URL move.
  - Directory: co-located with the source under `frontend/src/` (the existing Vitest convention; `CLAUDE.md`'s unit test directory is the backend's)
  - Naming: `{Module}.test.ts(x)`, matching the existing frontend tests
- Integration tests: no new integration test. The backend endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, answers without a database, 405 on POST); that existing test is the integration coverage of criterion 2's backend half.
  - Directory: backend/tests/integration/
- E2E tests: footer shows the live backend's version on the landing page; footer shows a differing backend version (intercepted `/api/version` fulfilled with `{"version": "9.9.9-e2e"}`) rather than the frontend's `0.0.0`; edge case, `/api/version` intercepted to abort, footer reads exactly `Task Notes`. Plus the TEST-04 spec update.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Footer renders the backend version on the landing page | E2E | — |
| 2 | Version comes from a single declared source, the backend, never a typed string or package.json | Unit | verifying it needs no navigation or interaction: the AppFooter test asserts the footer renders whatever the mocked client returns, and the version client test asserts where it fetches from; the backend's source (pyproject metadata) is already covered by the existing version integration test |
| 3 | Unresolved version renders `Task Notes` without a version segment | Unit | verifying it needs no navigation or interaction: pending and rejected client states are rendered in isolation, and the client's timeout, non-OK, malformed and sentinel rules are client unit cases (the E2E edge-case spec exercises the unreachable path once more, as the per-feature edge case) |
| 4 | A component test asserts both paths | Unit | the criterion is itself a component test; it is satisfied by `AppFooter.test.tsx` existing and asserting both paths |
| 5 | A frontend against a differing backend version shows the backend's version | E2E | — |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the backend version | Go to `/`; capture the live `/api/version` response with `page.waitForResponse` and read its `version`; assert `app-footer` contains `Task Notes v{that version}` | Given the backend is running, When I open the landing page, Then the footer shows "Task Notes v" followed by the backend's version |
| 2 | Single declared source, the backend | covered at Unit, see Criterion coverage | Given the backend reports version 0.1.0 and the frontend package is 0.0.0, When I open the landing page, Then the footer shows v0.1.0 |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage; E2E edge case: `page.route` aborts `/api/version`, footer text is exactly `Task Notes` | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version, "unknown", "undefined" or "null" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they pass with 0 failed |
| 5 | Differing backend version wins | `page.route` fulfils `/api/version` with `{"version": "9.9.9-e2e"}`; assert footer reads `Task Notes v9.9.9-e2e` and does not contain `0.0.0` | Given a backend reporting 9.9.9-e2e, When I open the landing page, Then the footer shows v9.9.9-e2e and not the frontend's 0.0.0 |

## Manual verification plan
### Criterion 1: The landing page footer renders the version fetched from GET /api/version
Prerequisites: the stack is running with `docker compose up` (backend on http://localhost:8010, frontend on http://localhost:5183).
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0"}` (or whatever `backend/pyproject.toml` declares).
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer.
3. Read the footer text → it reads `Task Notes v0.1.0`, the same version as step 1.
4. Open the browser DevTools Network tab and reload the page → one `GET` request to `http://localhost:8010/api/version` with status 200.

### Criterion 2: The version comes from the backend, never a typed string or package.json
Prerequisites: same as Criterion 1.
1. Open `frontend/package.json` → its `"version"` is `0.0.0`.
2. Open `backend/pyproject.toml` → its `[project]` `version` is `0.1.0`.
3. Open `http://localhost:5183/` and read the footer → it reads `Task Notes v0.1.0`, the backend's value, not `v0.0.0`.
4. Open `frontend/src/components/AppFooter.tsx` → there is no `package.json` import and no version literal; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts`.

### Criterion 3: An unresolved version renders the footer without it
Prerequisites: the frontend is running on http://localhost:5183 and the backend is stopped (`docker compose stop backend`).
1. Open `http://localhost:5183/` → the page loads with the heading and the note form.
2. Read the footer → it reads exactly `Task Notes`, with no `v`, no `unknown`, no `undefined`, no `null` and no trailing gap.
3. Open DevTools Network → the `GET http://localhost:8010/api/version` request failed, and the page shows no error message.
4. Start the backend again (`docker compose start backend`) and reload the page → the footer reads `Task Notes v0.1.0`.

### Criterion 4: A component test asserts the present and absent paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → expected `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains one test where the mocked client resolves a version and the footer shows it, and tests where the client is pending and rejected and the footer reads exactly `Task Notes`.

### Criterion 5: A frontend against a backend with a different version shows the backend's version
Prerequisites: the stack is running as in Criterion 1; the frontend package version is `0.0.0` and the backend's is `0.1.0`, which is already a divergence.
1. Open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, never `v0.0.0`.
2. Edit `backend/pyproject.toml` to `version = "0.1.1"` and rebuild only the backend (`docker compose up -d --build backend`), leaving the frontend container untouched → nothing visible changes until reload.
3. Reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.1` although the frontend was not rebuilt.
4. Revert `backend/pyproject.toml` to `0.1.0` and rebuild the backend → after reload the footer reads `Task Notes v0.1.0` again.
