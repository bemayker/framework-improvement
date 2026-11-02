# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> ## What
>
> The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> ## Acceptance criteria
>
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> ## Notes
>
> Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

## Acceptance Criteria
<!-- Criteria 2 and 3 are amended by the newest tracker comment (see Re-Plan Feedback); the comment overrides the description where they disagree. -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. Amended by the tracker comment: that source is the backend, read at runtime from `GET /api/version` (the backend's own `[project].version` in `backend/pyproject.toml`), not the frontend `package.json` at build time. A frontend built against an older backend shows the backend's version.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap. Amended by the tracker comment: the loading state and the failure state are decided and recorded (Frontend Plan, "Loading and failure states").
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. ..." → Addressed by: the footer now fetches `GET /api/version` at runtime through a new client module `frontend/src/api/version.ts`; the `package.json` import is removed from `AppFooter.tsx`. Criterion 2 is amended accordingly, overriding the description's "frontend package metadata or a build-time variable".
- Comment (tracker), "Add a GET /api/version endpoint" → Not acted on as new work, because the endpoint already exists: `backend/app/routers/version.py` serves `GET /api/version` returning `{"version": ...}` from `importlib.metadata.version("task-notes-backend")` (TEST-05, a declared dependency of this item, Done), registered in `backend/app/main.py`, and covered by `backend/tests/integration/test_version_integration.py`. It already returns exactly "the backend's version". Adding a second endpoint would duplicate it.
- Comment (tracker), "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan" → Stated explicitly: the item is no longer frontend-only in its dependency, because it now depends at runtime on the backend endpoint and on CORS (already allowing `GET` from `http://localhost:5183`, `backend/app/core/config.py`). It is still frontend-only in its diff: zero backend files change, because the endpoint the comment asks for shipped with TEST-05. The Backend Plan says "No backend changes required" for that reason, and the File Manifest carries no `[B]` entry. The description's claim that the item is "genuinely parallel with TEST-07" now rests on TEST-07 not touching the version endpoint, which this plan does not verify.
- Comment (tracker), "Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers" → Addressed by an explicit decision, neither blank nor `unknown`: in both the loading state and the failure state the footer renders the app name alone, `Task Notes`, with no version element, no placeholder text and no trailing space or `v`. Reason: criterion 3 forbids a placeholder or an empty gap, a footer that says `unknown` asserts a value the frontend does not have, and an empty footer loses the app name the footer already showed before this item. The backend's own sentinel `unknown` (returned when the distribution metadata is missing, `backend/app/services/version_service.py`) is treated as "cannot be resolved" too, so it also renders `Task Notes` alone. Recorded in the Frontend Plan.
- Comment (tracker), the operator note about a code revert precondition → Not acted on: it is an operator precondition already satisfied (reset commit ba107df), not a requirement.
- Assumption: no fetch timeout is added. The description and comment ask for none, and CHORE-02 (a follow-up of this item) is where the feature map places a fetch timeout. A hanging request therefore leaves the footer in its loading state, which renders the same `Task Notes` as the failure state, so the user-visible answer is identical.

## Plan Overview
Replace the build-time `package.json` version in the landing-page footer with the backend's version fetched at runtime from the existing `GET /api/version`. Frontend only in the diff: a new API client module for the version endpoint, a shared base-URL module so the API base URL has one source across both clients, and `AppFooter` gains local state with a loading/failure rendering that shows the app name alone. `LandingPage.tsx` is not modified, because `AppFooter` owns its own fetch; the component tests and the TEST-04 E2E spec that asserted the `package.json` version are updated, and a TEST-08 E2E spec is added.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. Hold `version: string | null` in `useState`, initial `null`. On mount, `useEffect` calls `getBackendVersion()` with the same `isMounted` guard `LandingPage.tsx` uses; on resolve, store the value only when it is a non-empty string other than `unknown`; on reject, leave `null`. Render `{APP_NAME}` always, and only when `version` is non-null render ` v{version}` inside `<span data-testid="app-footer-version">`. The footer element keeps `data-testid="app-footer"` and its `contentinfo` role.
  - `frontend/src/api/version.ts` (new): `getBackendVersion(): Promise<string>`, `fetch` of `${API_BASE_URL}/api/version`; throws `Loading the version failed: {status} {statusText}` on a non-OK response, and throws when the body has no string `version` field. Exported type `VersionResponse = { version: string }`.
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, moved verbatim from `notes.ts` (`import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`), so both clients read the deployment-dependent value from one place (`coding_standards.md` Section 5: one value, one source).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of defining it. No behaviour change.
  - `frontend/src/components/LandingPage.tsx`: not modified. It already renders `<AppFooter />`, and the fetch lives in `AppFooter`, which keeps this item off the file BUG-04 and TEST-10 also edit.
- Routes: none.
- State management: local `useState` plus `useEffect` in `AppFooter`, no context and no library.
- Loading and failure states (the decision the tracker comment asked to be recorded): before the fetch resolves, the footer text is exactly `Task Notes`. If the request fails (network error, non-OK status, unexpected body shape) or the backend reports `unknown` or an empty string, the footer text is exactly `Task Notes`. With a version, it is `Task Notes v{version}`, e.g. `Task Notes v0.1.0`. Never blank, never `unknown`, never `undefined` or `null`, never a dangling `v`.
- Design reference notes: AI freestyle. The existing footer style is kept unchanged (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`); the version span inherits it.

## Backend Plan
No backend changes required. The endpoint the tracker comment asks for, `GET /api/version` returning the backend's version, already exists (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, from TEST-05) and is covered by `backend/tests/integration/test_version_integration.py`. CORS already allows `GET` from `http://localhost:5183` (`backend/app/core/config.py`). This item depends on that backend behaviour at runtime but changes none of it.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version` (existing, TEST-05)
- Request: none
- Response: 200, `{"version": "0.1.0"}`. The value is the backend's `[project].version`, or the sentinel `"unknown"` when the distribution metadata is not installed, which the footer treats as unresolved.

## Technology Selection
- Runtime fetch of the version: chose the browser's native `fetch` (already used by `notes.ts`) over adding an HTTP client library, because one GET with a status check needs nothing more.
- Footer loading/failure state: chose React's built-in `useState` and `useEffect` (installed) over a data-fetching library such as React Query, because one request on mount with two outcomes is a few lines.
- `frontend/src/api/version.ts`: no stdlib call, native platform feature or installed dependency is a client for this project's own endpoint, so it is built here, mirroring `notes.ts`.
- `frontend/src/api/baseUrl.ts`: chose moving the existing constant into a shared module over duplicating it in `version.ts`, because a second copy of a deployment-dependent value is the drift `coding_standards.md` Section 5 rules out.
- `e2e/helpers/backendVersion.ts`: chose Node's built-in `node:fs` with a regular expression over adding a TOML parser dependency, because reading one `version = "..."` line under `[project]` needs no parser; it is shared by the TEST-04 and TEST-08 specs rather than written twice.
- No new dependency is added.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of `API_BASE_URL` for every frontend API client
- [A] frontend/src/api/version.ts: client for `GET /api/version`, `getBackendVersion()` with non-OK and bad-shape errors
- [A] frontend/src/api/version.test.ts: unit tests for the version client with `fetch` stubbed (happy path, non-OK throw, bad body shape throw, `VITE_API_BASE_URL` honoured)
- [D] e2e/helpers/backendVersion.ts: reads the backend's `[project].version` from `backend/pyproject.toml` for E2E expectations
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: footer shows the backend version; footer shows `Task Notes` alone when `/api/version` is aborted; footer shows a stubbed backend version unequal to the frontend package version
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the failure edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script build-feature writes

### Modified files
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the backend version on mount; render `Task Notes` alone while loading and on failure, `Task Notes v{version}` once resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present, absent while pending, absent on rejection, absent for `unknown`; keep the landmark test
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of the `package.json` version
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl`
- [D] e2e/tests/TEST-04_page_footer.spec.ts: take the expected version from `e2e/helpers/backendVersion.ts` instead of `frontend/package.json`, since TEST-08 supersedes that source
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: replace the `frontend/package.json` version expectation with the backend version from `GET /api/version`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: same correction for the manual script

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test-infrastructure change, and `docs/DEVELOPMENT.md` already states that the footer reads `GET /api/version` at runtime and shows `Task Notes` alone on failure or `unknown`.

## Testing Strategy
- Unit tests: `version.ts` client with `fetch` stubbed (as `notes.test.ts` does); `AppFooter` with `../api/version` mocked for the present, pending, rejected and `unknown` paths; `LandingPage` footer assertion with the client mocked.
  - Directory: colocated `frontend/src/**/*.test.ts(x)` (Vitest), the frontend's existing convention
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`
- Integration tests: no new ones. The backend endpoint is unchanged and `backend/tests/integration/test_version_integration.py` already asserts it returns the `pyproject.toml` version.
  - Directory: backend/tests/integration/
- E2E tests: footer on `/` shows `Task Notes v{backend version}`; edge case: with `**/api/version` aborted via `page.route`, the footer text is exactly `Task Notes`; with `**/api/version` fulfilled as `{"version":"9.9.9"}`, the footer shows `v9.9.9` (the partial-deploy case). TEST-04's spec is updated to the backend source.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus the backend-unreachable edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from one declared source, the backend at runtime via `GET /api/version`, never a string typed into the component | Unit | verifying it needs no navigation or interaction: `AppFooter.test.tsx` renders whatever the mocked client returns (`9.9.9`, unequal to `package.json`) and `version.test.ts` asserts the client calls `/api/version`; the backend's own source is already covered by `test_version_integration.py` |
| 3 | When the version cannot be resolved (loading, failure, `unknown`), the footer renders `Task Notes` alone | Unit | verifying it needs no navigation or interaction: it is component rendering under a pending, rejected or `unknown` client result |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component test in `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Go to `/`, expect `app-footer` to contain `Task Notes` and `v` plus the version from `backend/pyproject.toml` | Given the app and backend are running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage (a supporting E2E stubs `/api/version` as `9.9.9`) | Given the backend reports version "0.1.0" and the frontend package says "0.0.0", When I open the landing page, Then the footer shows "v0.1.0" |
| 3 | Unresolvable version renders without it | covered at Unit, see Criterion coverage (the edge-case E2E aborts `/api/version`) | Given the backend is stopped, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: from the repository root, `docker compose up -d --build` has been run and all three services (db, backend, frontend) are up.
1. Open `http://localhost:5183/` in a browser → the landing page shows the heading "Task Notes".
2. Scroll to the bottom of the page and read the footer → it reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, never typed into the component
Prerequisites: the stack from Criterion 1 is running.
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0"}`.
2. Open `frontend/package.json` in the repository → its `"version"` reads `0.0.0`.
3. Open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, the backend's value, not `v0.0.0`.
4. Open DevTools, Network tab, reload the page → one request to `http://localhost:8010/api/version` with status 200.
5. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal such as `0.1.0` and no import of `package.json`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack from Criterion 1 is running.
1. Run `docker compose stop backend` → the backend container is stopped.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap.
3. Run `docker compose start backend` and reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run lists the version-present test and the version-absent tests (pending, rejected, `unknown`) and reports `0 failed`.
