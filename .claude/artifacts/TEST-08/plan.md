# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (ClickUp task 123k99ctgch, https://app.clickup.com/t/123k99ctgch. The tracker comment recorded under `## Re-Plan Feedback` corrects this description: the version now comes from the backend at runtime.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component. **Amended by the tracker comment:** the single declared source is the backend's own version, read at runtime from `GET /api/version` (which reports `[project].version` of `backend/pyproject.toml`), not `frontend/package.json`.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: the footer drops its `frontend/package.json` import and fetches `GET /api/version` on mount through a new client module `frontend/src/api/version.ts`. The comment overrides criterion 2's "frontend package metadata or a build-time variable" wording; criterion 2 is amended above rather than dropped. The divergence case (frontend bundle and backend on different versions) is covered explicitly: a component test and an E2E spec both serve a backend version that differs from `frontend/package.json` and assert the footer shows the backend's.
- Comment (tracker), same comment, "Add a GET /api/version endpoint" → Addressed by: no new endpoint. `GET /api/version` already exists on `main`, delivered by TEST-05 (a declared dependency of this item in `feature_map.md`): `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`. It already returns `{"version": "<backend/pyproject.toml [project].version>"}`, which is exactly what the comment asks for, so adding a second one would be duplicate work. CORS already admits `http://localhost:5183` for `GET` (`backend/app/core/config.py`, `backend/app/main.py`).
- Comment (tracker), same comment, "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by, decided and recorded here and in `## Frontend Plan`: **before the fetch resolves, the footer shows `Task Notes` (the app name alone)**; **when `/api/version` is unreachable, answers non-2xx, returns a body without a non-empty string `version`, or returns the backend's own `unknown` sentinel, the footer shows `Task Notes` (the app name alone)**. It is never blank, never reads `unknown`, `undefined` or `null`, and leaves no trailing ` v` or gap, because the ` v{version}` part is one element rendered only when a version resolved. Reason for the choice: criterion 3 already forbids a sentinel or an empty gap, a footer reading `unknown` would look like a version string to exactly the reader the comment describes, and a blank footer would drop the app name the footer carried before this item (TEST-04). Loading and failure look identical on purpose, so no client-side timeout is added: a request that never answers leaves the footer in the same state a failed one does.
- Comment (tracker), same comment, "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Plan Overview` and `## Backend Plan`. The item is **no longer frontend-only in behaviour**: the footer now depends at runtime on the backend's `GET /api/version`, and the description's "Touches no backend file, so it is genuinely parallel with TEST-07" no longer describes its runtime dependency. It still **touches no backend file**, because the endpoint is already on `main` (TEST-05). The File Manifest therefore carries no `[B]` entry, by this decision and not by omission.
- Assumption (recorded instead of a blocking question): the backend's `UNKNOWN_VERSION = "unknown"` sentinel in `backend/app/services/version_service.py` is treated by the frontend as "version not resolved", per criterion 3. The constant is named once in `frontend/src/api/version.ts` with a comment pointing at the backend constant.
- Merged since the last plan: n/a (fresh plan, no `[merged-since]` lines in the dispatch; plan base 607461d).

## Plan Overview
Frontend change plus one existing backend endpoint consumed at runtime. The footer (`frontend/src/components/AppFooter.tsx`) stops importing `version` from `frontend/package.json` and instead fetches the backend's version from the existing `GET /api/version` endpoint (TEST-05) on mount, through a new client module `frontend/src/api/version.ts`. The API base URL, today defined inside `frontend/src/api/notes.ts`, moves to `frontend/src/api/config.ts` so both clients read one source. `LandingPage.tsx` is **not** modified: it already renders `<AppFooter />`, and the footer owns its own fetch. No backend file changes (the endpoint exists); the backend becomes a runtime dependency of the footer, which is the change the tracker comment asked to be stated. Tests: client unit tests, rewritten footer component tests (present, loading, failure, sentinel, divergence), the landing-page test's footer assertion switched to a mocked backend version, a new E2E spec, and the TEST-04 E2E spec's expected version switched from `frontend/package.json` to `backend/pyproject.toml`, because the footer it asserts on now shows the backend's version.

## Frontend Plan
- Components to create/modify:
  `frontend/src/api/config.ts` (new): exports `API_BASE_URL`, read from `import.meta.env.VITE_API_BASE_URL` with the existing default `http://localhost:8010`, moved verbatim from `notes.ts` (one value, one source, per `coding_standards.md` Section 5).
  `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./config` instead of defining it; no behaviour change.
  `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. Calls `fetch(`${API_BASE_URL}/api/version`)`. Throws an `Error("Loading the version failed: {status} {statusText}")` on a non-2xx response (same shape as `notes.ts`'s `requestFailed`); a network error rejects as `fetch` does. On 2xx, parses the JSON and returns the trimmed `version` when it is a non-empty string other than the backend sentinel `unknown`, otherwise `null`. Exports the response type `VersionResponse = { version: string }`.
  `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. Hold `backendVersion: string | null` in `useState`, initial `null`. In a mount-only `useEffect` call `fetchBackendVersion()` with the same `isMounted` guard `LandingPage.tsx` uses; on resolve set the value, on reject set `null` (the comment in code explains why a failure is swallowed: the footer's answer to an unreachable backend is the app name alone). Render `<footer data-testid="app-footer" style={footerStyle}>Task Notes{backendVersion !== null && <span data-testid="app-footer-version"> v{backendVersion}</span>}</footer>`. The leading space lives inside the span, so the absent path leaves no trailing space or gap. `footerStyle` and the `contentinfo` landmark are unchanged.
  `frontend/src/components/LandingPage.tsx`: **not modified** (it already renders `<AppFooter />`).
- Routes: none (landing page `/` only).
- State management: local component state in `AppFooter`; no shared store, no context.
- Loading state: `Task Notes` alone (no version element). Failure state (unreachable, non-2xx, malformed body, empty or `unknown` version): `Task Notes` alone. Success: `Task Notes v{backend version}`, e.g. `Task Notes v0.1.0`.
- Design reference notes: AI freestyle (Design Reference mode NONE). Footer styling unchanged from TEST-04: `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`; the version span inherits it and adds no style.

## Backend Plan
No backend changes required. The backend endpoint this feature consumes, `GET /api/version`, already exists on `main` (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`) and already answers `{"version": "0.1.0"}` from `backend/pyproject.toml` via package metadata, with `unknown` as its sentinel when metadata is missing. Its integration tests (`backend/tests/integration/test_version_integration.py`) stay as they are. Stated explicitly per the tracker comment: this item is no longer frontend-only in behaviour, since the footer now depends on the backend at runtime, but it modifies no backend file.

## API Integration Plan
No external API integration. (The footer consumes this project's own backend through `frontend/src/api/version.ts`, the same client-layer pattern as `frontend/src/api/notes.ts`.)

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`, overridable through `VITE_API_BASE_URL`)
- Request: no body, no parameters
- Response: `200` with `{"version": "0.1.0"}` (backend `VersionResponse`, `version: str`). `{"version": "unknown"}` is the backend's sentinel for unresolved metadata and is treated as "no version" by the frontend. Any non-2xx, network error, or body without a non-empty string `version` is "no version" too.

## Technology Selection
- Version fetch: chose the browser's native `fetch` (the platform feature `notes.ts` already uses) over adding a data-fetching dependency such as a query library, because one mount-time GET needs none.
- `frontend/src/api/version.ts` client module: no stdlib call, native platform feature or installed dependency is a client for this project's own endpoint, so it is built here, in the existing client-layer shape of `notes.ts`.
- `frontend/src/api/config.ts`: chose extracting the existing `API_BASE_URL` expression over importing it from `notes.ts` or duplicating it in `version.ts`, because a duplicated default is a second source for a deployment-dependent value and a cross-import makes the version client depend on the notes module.
- Loading and failure handling: chose React's own `useState` and `useEffect` (installed) over a suspense or error-boundary library; no new dependency.
- Timeout: none added. Loading and failure render identically, so an `AbortController` timeout would change nothing a reader can see.
- No new dependency at all, so no lockfile changes.

## File Manifest
<!--
  Phase tags: [0S]=Infrastructure Scaffolding, [A]=Frontend Plan, [B]=Backend Plan, [C]=API Integration Plan, [D]=Testing Strategy, [G]=Acceptance Test Outline, [Docs]=-
-->
### New files
- [A] frontend/src/api/config.ts: single source of `API_BASE_URL` (moved from `notes.ts`)
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`, returns the version or `null`
- [A] frontend/src/api/version.test.ts: unit tests for the client (stubbed `fetch`): URL, present version, `unknown` sentinel, empty and missing `version`, non-2xx rejects, `VITE_API_BASE_URL` override
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs for the footer showing the real backend version, a diverging backend version, and the unreachable-backend edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the failure edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: the artifact copy of the manual UAT script

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./config` instead of defining it; behaviour unchanged
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the backend version on mount; render `Task Notes` alone while loading and on failure, `Task Notes v{version}` once resolved
- [A] frontend/src/components/AppFooter.test.tsx: rewrite around a mocked `../api/version`: version present, loading, rejected, `null`, diverging from `package.json`, landmark and test id
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of the `package.json` version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from `backend/pyproject.toml` instead of `frontend/package.json`, since the footer it asserts on now shows the backend's version
- [Docs] docs/DEVELOPMENT.md: make the "The page footer shows the backend's version" paragraph match what this item builds (version only, `Task Notes` alone while loading or on failure, no timeout); its commit sentence and 5-second timeout clause describe code not on `main`

No dependency is added or changed, so no lockfile is regenerated. `README.md` does not mention the footer or the version and needs no edit. `frontend/src/components/LandingPage.tsx` and every backend file are deliberately absent: see `## Frontend Plan` and `## Backend Plan`. TEST-04's historical UAT artifacts (`e2e/uat/scripts/TEST-04_page_footer_uat_script.md`, `e2e/uat/scenarios/TEST-04_page_footer.feature`) are left as TEST-04's record and not rewritten.

## Testing Strategy
- Unit tests: `frontend/src/api/version.test.ts` (client, `fetch` stubbed with `vi.stubGlobal` as in `notes.test.ts`); `frontend/src/components/AppFooter.test.tsx` (component, `../api/version` mocked with `vi.mock`, assertions via `findByTestId` / `waitFor` rather than fixed waits); `frontend/src/components/LandingPage.test.tsx` footer case updated. Existing `frontend/src/api/notes.test.ts` must stay green after the `config.ts` extraction (its env-override test resets modules and re-imports, which re-evaluates `config.ts`). No backend unit tests: no backend code changes.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (Vitest, the frontend's existing convention; the `backend/tests/unit/` directory in CLAUDE.md is the backend's)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, as the existing frontend tests
- Integration tests: no new ones. The endpoint consumed is unchanged and already covered by `backend/tests/integration/test_version_integration.py`, which must stay green.
  - Directory: `backend/tests/integration/`
- E2E tests: `e2e/tests/TEST-08_footer_app_version.spec.ts` with three specs: (1) against the real backend, the footer's `app-footer-version` element reads ` v{version}` where `{version}` is read from `backend/pyproject.toml`'s `[project]` `version` line; (2) divergence: `page.route` fulfils the backend `/api/version` call with `{"version": "9.9.9"}` and the footer reads `Task Notes v9.9.9`, not the `frontend/package.json` version; (3) edge case: `page.route` aborts the call and the footer's text is exactly `Task Notes` with `app-footer-version` count 0. Match the route on `new URL(url).pathname === "/api/version"`, never a substring: Vite serves the module `src/api/version.ts` from a URL containing `/api/version` (the same trap `TEST-03_simple_note_form.spec.ts` documents). `e2e/tests/TEST-04_page_footer.spec.ts` keeps its four specs with its expected version read from `backend/pyproject.toml`.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one Gherkin scenario per criterion plus the unreachable-backend edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source (the backend's `GET /api/version`, amended), never a string typed into the component | Unit | verifying it needs no navigation or interaction: it is where the component's value comes from, proven by mocking the client with a version that differs from `package.json` and by the client test asserting the URL it calls (the E2E divergence spec repeats it in the browser) |
| 3 | When the version cannot be resolved, the footer renders without it, never `undefined`, `null` or an empty gap | Unit | verifying it needs no navigation or interaction: it is a render rule over the client's result, covered for loading, rejection, `null` and the `unknown` sentinel (the E2E edge-case spec repeats the unreachable case) |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component test in `AppFooter.test.tsx`; a browser cannot cover it |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Open `/`, expect `app-footer-version` to contain ` v{backend/pyproject.toml version}` | Given the app and backend are running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Version from one declared source (backend at runtime) | covered at Unit, see Criterion coverage; the E2E divergence spec fulfils `/api/version` with `9.9.9` and expects `Task Notes v9.9.9` | Given the backend reports a version different from the frontend package, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage; the E2E edge-case spec aborts `/api/version` and expects text exactly `Task Notes` | Given the backend is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version, "unknown", "undefined" or "null" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend tests, When I run `npm --prefix frontend test`, Then the AppFooter present and absent tests report 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repo root with `docker compose up -d --build` (services `db`, `backend` on port 8010, `frontend` on port 5183); `backend/pyproject.toml` reads `version = "0.1.0"`.
1. Open `http://localhost:5183/` in a browser → the landing page shows the heading "Task Notes", the note form and the note list.
2. Scroll to the bottom of the page → the footer reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, never a string typed into the component
Prerequisites: the stack from Criterion 1 is running.
1. In a terminal run `curl -s http://localhost:8010/api/version` → it prints `{"version":"0.1.0"}`.
2. Open `frontend/package.json` → its `"version"` reads `0.0.0`, which differs from the backend's `0.1.0`.
3. Open `http://localhost:5183/`, open the browser's developer tools on the Network tab and reload → one `GET http://localhost:8010/api/version` request answers 200, and the footer reads `Task Notes v0.1.0`, the backend's version and not `0.0.0`.
4. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no `package.json` import; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack from Criterion 1 is running.
1. In a terminal run `docker compose stop backend` → the backend container stops; `curl -s http://localhost:8010/api/version` now fails to connect.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no ` v`, no trailing gap, and none of the words `unknown`, `undefined` or `null`.
3. Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0"}` again, then reload the page → the footer reads `Task Notes v0.1.0`.

### Criterion 4: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repo root run `npm --prefix frontend test` → Vitest runs `src/components/AppFooter.test.tsx`, `src/api/version.test.ts` and `src/components/LandingPage.test.tsx` among the suite, and the summary reports `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it holds a test where the mocked client resolves a version and the footer shows `Task Notes v{that version}`, and tests where the client rejects or resolves `null` and the footer shows `Task Notes` with no `app-footer-version` element.
