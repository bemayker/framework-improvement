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
> **Superseded in part by the newest tracker comment** (see `## Re-Plan Feedback`): the version must come from the backend at runtime through `GET /api/version`, not from `package.json` at build time.

## Acceptance Criteria
Criteria 2 and 3 are restated as amended by the tracker comment, which overrides the description where the two disagree; criterion 5 is the backend requirement the comment adds.

- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, the backend, fetched at runtime from `GET /api/version`; never from `frontend/package.json`, a build-time variable, or a string typed into the component. A frontend built against a different backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap. Recorded decision: while the fetch is pending the footer reads `Task Notes`; if `/api/version` is unreachable, answers non-OK, returns a body without a non-empty string `version`, or reports the backend's own `unknown` sentinel, the footer reads `Task Notes`. Resolved, it reads `Task Notes v{version}`.
- [ ] 4. A component test asserts both paths: version present, and version absent (plus the pending state from criterion 3).
- [ ] 5. `GET /api/version` returns the backend's version (added by the tracker comment).

## Re-Plan Feedback
- Comment (tracker, newest): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: criterion 2 rewritten to a runtime backend source; the footer fetches through a new client `frontend/src/api/version.ts`; the `package.json` import is removed from the footer and its tests.
- Same comment, "Add a GET /api/version endpoint" → Addressed by: **this item is no longer frontend-only in what it depends on, but it needs no backend code change.** `GET /api/version` already exists on main (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`), returning `{"version": "<[project].version of backend/pyproject.toml>"}` from installed package metadata, and its integration tests (`backend/tests/integration/test_version_integration.py`) already assert exactly that. Adding a second endpoint would duplicate TEST-05. So the backend half of the comment is satisfied by consuming the existing endpoint; the Backend Plan says "No backend changes required" and the File Manifest carries no `[B]` entry. Criterion 5 is covered by the existing integration tests, run again by this build's gate. Stated here, as the comment asks, rather than left implicit in the manifest.
- Same comment, loading and failure states → Addressed by: decision recorded in criterion 3. Loading: `Task Notes` (no version, no `v`, no placeholder, no spinner). Failure: `Task Notes`, identical to loading. Chosen over `Task Notes vunknown` / `Task Notes v…` because the ticket's criterion 3 asks that the footer "renders without it" when the version cannot be resolved, and a reader cannot act on `unknown` any more than on a blank; the app name always renders, so the footer is never blank. Assumption: the backend's own sentinel `unknown` (what `version_service.UNKNOWN_VERSION` returns when package metadata is missing) is treated as "cannot be resolved" and rendered the same way, since showing it would be the `unknown` answer the decision rejects.
- Same comment, "a frontend rebuilt against an older backend must show the backend's version" → Addressed by: the E2E spec asserts the footer shows the version in `backend/pyproject.toml` (currently `0.1.0`), which differs from `frontend/package.json` (`0.0.0`), so a regression to the frontend source fails it.
- Ticket note "It modifies LandingPage.tsx" → not acted on: the footer fetches its own version, so `LandingPage.tsx` needs no change; only `LandingPage.test.tsx` changes (it must mock the new client). This also narrows the shared risk with BUG-04 to the test file.
- Assumption: no request timeout or retry is added to the version fetch (not asked for; a hanging backend simply leaves the footer in the loading text, which is the same as the failure text).
- Assumption: TEST-04's E2E spec, Gherkin scenario and UAT script assert the version from `frontend/package.json`; the comment makes that false, so they are updated to the backend source. Not doing so would leave a red E2E spec and two stale verification documents.
- Other tracker comments: 18 earlier comments (earlier runs' PR notes and a reset note, per `decisions.md`) → not acted on: none is a requirement for this item.
- Merged since the last plan: n/a (fresh plan in the primary checkout at base 2ba5477).

## Plan Overview
Frontend only in code. A new API client `fetchBackendVersion()` calls the existing `GET /api/version`; `AppFooter` fetches on mount and renders `Task Notes v{version}` when resolved, `Task Notes` otherwise. The API base URL, today private to `notes.ts`, moves to a shared `api/config.ts` so both clients read it from one source. Tests: Vitest unit tests for the client and the footer's three states; a Playwright spec for the rendered backend version and the failure edge case; TEST-04's spec updated to the new source. No backend code change (see Re-Plan Feedback).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/config.ts` (new): exports `API_BASE_URL`, `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim out of `notes.ts` (one value, one source, `coding_standards.md` Section 5).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./config`; no behaviour change.
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. GETs `${API_BASE_URL}/api/version`; throws `Loading the version failed: {status} {statusText}` on a non-OK response (same shape as `notes.ts`); a network error propagates as thrown; returns `null` when the body's `version` is not a non-empty string or equals `"unknown"`; otherwise returns the trimmed string. Typed response `VersionResponse = { version: string }`.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import; `useState<string | null>(null)`, `useEffect` on mount calling `fetchBackendVersion()`, `isMounted` guard as in `LandingPage.tsx`; `.catch` sets `null`. Render `Task Notes` and, only when the version is a string, ` v{version}` inside a `<span data-testid="app-footer-version">`. Keep `data-testid="app-footer"` and the `<footer>` (contentinfo) element.
- Routes: none.
- State management: local component state in `AppFooter`; no context or store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Keep the existing footer style unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem. No loading indicator.

## Backend Plan
No backend changes required. `GET /api/version` already exists (TEST-05) and returns the backend's version; this item consumes it. Its existing integration tests cover criterion 5.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`; CORS already allows `http://localhost:5183`)
- Request: no body, no parameters
- Response: `200` with `{"version": "0.1.0"}`; the backend returns `{"version": "unknown"}` when its package metadata is missing, which the client maps to `null`

## Technology Selection
- Version fetch: chose the browser's native `fetch` over adding an HTTP library (axios etc.), matching `notes.ts`; no new dependency.
- Loading/failure state: chose plain React `useState`/`useEffect` over a data-fetching library (react-query, SWR), which the project does not install and one GET on mount does not need.
- `api/config.ts`: no stdlib call, native feature or installed dependency covers sharing a constant between two modules; it is a three-line module built here.
- E2E expected version: chose reading `backend/pyproject.toml` with Node's built-in `fs` and a regular expression over adding a TOML parser dependency; the file has one `version = "..."` line under `[project]`.
- Frontend tests: Vitest, Testing Library and `vi.stubGlobal("fetch", ...)` are already installed and used by `notes.test.ts`; no new test dependency.

## File Manifest
### New files
- [A] frontend/src/api/config.ts: shared `API_BASE_URL` (moved out of notes.ts)
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`
- [A] frontend/src/api/version.test.ts: unit tests for the version client with stubbed `fetch`
- [D] e2e/helpers/backendVersion.ts: reads the expected version from backend/pyproject.toml for E2E specs
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E spec, footer shows the backend version; failure edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from ./config instead of declaring it
- [A] frontend/src/components/AppFooter.tsx: fetch the version from the backend; loading and failure render `Task Notes`
- [A] frontend/src/components/AppFooter.test.tsx: mock the version client; assert present, absent (rejected and null) and pending states
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version; assert the footer shows the mocked backend version instead of package.json's
- [D] e2e/tests/TEST-04_page_footer.spec.ts: expect the backend version (via e2e/helpers/backendVersion.ts) instead of frontend/package.json's
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: version source line now names backend/pyproject.toml served by GET /api/version
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare against GET /api/version instead of frontend/package.json

No dependency changes, so no lockfile is touched. Neither README.md nor docs/DEVELOPMENT.md needs an edit: project structure, run configuration, dependencies and test infrastructure are unchanged (one helper file in the existing e2e/helpers/ directory).

## Testing Strategy
- Unit tests (Vitest, frontend): `version.test.ts` covers OK response, non-OK throw, network rejection, missing/empty/non-string `version` returning null, `"unknown"` returning null, default and `VITE_API_BASE_URL` base URL. `AppFooter.test.tsx` covers resolved (`Task Notes v1.2.3`), rejected (`Task Notes`, no `app-footer-version`, no `undefined`/`null`/`unknown` text), resolved-null (same), and pending (`Task Notes` before resolution). `LandingPage.test.tsx` mocks the client.
  - Directory: colocated `frontend/src/**` (existing frontend convention; CLAUDE.md's unit directory is the backend's)
  - Naming: `{module}.test.ts(x)` (existing frontend convention)
- Integration tests: no new ones; criterion 5 is covered by the existing `backend/tests/integration/test_version_integration.py`, which the gate runs.
  - Directory: backend/tests/integration/
- E2E tests: footer on `/` shows `Task Notes v{backend version}`; edge case with `GET /api/version` aborted via `page.route` shows exactly `Task Notes`. TEST-04 spec updated to the backend source.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | Version comes from the backend at runtime via GET /api/version, never package.json or a typed string | Unit | verifying it needs no navigation or interaction: the client test asserts the URL called and the footer test asserts the rendered value is the one the client returned; criterion 1's E2E additionally shows the backend's 0.1.0, not the frontend's 0.0.0 |
| 3 | Unresolvable version renders `Task Notes` only, in loading and failure | Unit | verifying it needs no navigation or interaction: it is component state rendering driven by a mocked client (the E2E edge-case spec repeats the failure path once) |
| 4 | Component test asserts version present and version absent | Unit | the criterion is itself a component test |
| 5 | GET /api/version returns the backend's version | Integration | verifying it needs no navigation or interaction: it is a router behaviour, already covered by test_version_integration.py |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | Open `/`, expect `app-footer` to contain `Task Notes v` + version from backend/pyproject.toml | Given the stack is running When I open the landing page Then the footer reads "Task Notes v0.1.0" |
| 2 | Version from backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports 0.1.0 and the frontend package is 0.0.0 When I open the landing page Then the footer shows 0.1.0 |
| 3 | Loading and failure render without version | covered at Unit, see Criterion coverage (edge-case spec: abort /api/version, expect exactly "Task Notes") | Given the backend is stopped When I open the landing page Then the footer reads "Task Notes" with no version |
| 4 | Component test, both paths | covered at Unit, see Criterion coverage | Given the frontend test suite When I run AppFooter.test.tsx Then 0 failed |
| 5 | GET /api/version returns backend version | covered at Integration, see Criterion coverage | Given the backend is running When I request /api/version Then I get {"version": "0.1.0"} |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: stack running with `docker compose up -d --build` from the repository root (frontend on http://localhost:5183, backend on http://localhost:8010); `backend/pyproject.toml` has `version = "0.1.0"`.
1. Open http://localhost:5183/ in a browser → the "Task Notes" heading, the note form and, at the bottom, the footer are shown.
2. Read the footer → it reads exactly `Task Notes v0.1.0`.
3. Resize the window to 375px wide → the footer is still visible and still reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: as Criterion 1; `frontend/package.json` has `"version": "0.0.0"`.
1. Open http://localhost:8010/api/version in a browser tab → the page shows `{"version":"0.1.0"}`.
2. Open http://localhost:5183/ with the browser DevTools Network tab open, then reload → a `GET http://localhost:8010/api/version` request with status 200 appears.
3. Read the footer → it reads `Task Notes v0.1.0`, the backend's version, and not `v0.0.0`, the frontend package's version.

### Criterion 3: Loading and failure render without the version
Prerequisites: as Criterion 1.
1. In DevTools Network, set throttling to "Slow 3G" and reload http://localhost:5183/ → while the request to `/api/version` is pending the footer reads `Task Notes`, with no `v`, no `undefined`, no `null` and no `unknown`; once it completes it reads `Task Notes v0.1.0`.
2. Set throttling back to "No throttling". Run `docker compose stop backend` from the repository root → the command reports the backend container stopped.
3. Reload http://localhost:5183/ → the footer reads exactly `Task Notes`, with no trailing space-gap, `v`, `undefined`, `null` or `unknown`; the DevTools console may show the failed request.
4. Run `docker compose start backend`, wait for it to be up, reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run ends with `0 failed`, and the AppFooter test names include a version-present case and a version-absent case.

### Criterion 5: GET /api/version returns the backend's version
Not a UI behaviour; the observable check is the HTTP response.
1. Run `curl -s http://localhost:8010/api/version` with the stack up → it prints `{"version":"0.1.0"}`.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `0 failed`.
