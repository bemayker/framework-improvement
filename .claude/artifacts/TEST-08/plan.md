# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written on the ticket).**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (Tracker task: [TEST-08: Footer shows the app version](https://app.clickup.com/t/123k99ctgch). The newest tracker comment amends criterion 2 and adds the loading and failure states; see `## Re-Plan Feedback`. The criteria below are the amended set.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from the backend at runtime: the footer fetches `GET /api/version` and shows the `version` it returns, whose single declared source is `backend/pyproject.toml` `[project].version`. It is never a string typed into the component, and never the frontend's own `frontend/package.json` version, so a frontend running against an older backend shows the backend's version. (Amended by the tracker comment.)
- [ ] 3. When the version cannot be resolved (network error or unreachable backend, non-OK status, unexpected response shape, an empty `version`, or the backend's own `unknown` sentinel), the footer renders `Task Notes` alone, never `undefined`, `null`, `unknown`, a dangling `v` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. Before the `GET /api/version` request settles, the footer renders `Task Notes` alone, with no version, no placeholder text and no spinner. (Loading state required by the tracker comment.)

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 rewritten to the runtime backend source; the ticket's original wording (frontend package metadata or build-time variable) is superseded, because a comment overrides the description where the two disagree. The footer stops importing `frontend/package.json` and fetches the version through a new client `frontend/src/api/version.ts`.
- Comment (tracker), same comment, "Add a GET /api/version endpoint": not acted on as new work, because **`GET /api/version` already exists on main** at plan base 64dae872 (delivered by TEST-05, a declared dependency of this item): `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py`, registered in `backend/app/main.py`, returning `{"version": "0.1.0"}` from installed package metadata, already covered by `backend/tests/integration/test_version_integration.py` and `backend/tests/unit/test_version_service_unit.py`. CORS already allows `GET` from `http://localhost:5183`. So this plan makes **no backend change**: `## Backend Plan` says so and the File Manifest carries no `[B]` entry.
- Comment (tracker), same comment, "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Plan Overview`. The item now **depends on a backend endpoint at runtime** (no longer frontend-only in behaviour), but because the endpoint already shipped with TEST-05, the diff stays frontend and E2E only. The ticket's note that this item is "genuinely parallel with TEST-07" because it touches no backend file still holds for files; it no longer holds for runtime behaviour.
- Comment (tracker), same comment, "Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: **decision recorded**. Loading: the footer renders the text `Task Notes` (the footer element, its landmark and test id are present from first paint; only the version part is absent). Failure or unreachable: the footer renders `Task Notes`, the same as loading. Neither state shows `unknown`, a placeholder or a blank footer. Reason: criterion 3 of the ticket already forbids an empty gap and the literal-sentinel answers, and the app name is still true information when the version is not known; `unknown` would read as a version value. The backend's own `unknown` sentinel (returned when package metadata is missing) is treated as unresolved for the same reason. Recorded as criteria 3 and 5.
- Assumption (recorded, not blocking): the resolved text keeps TEST-04's format, `Task Notes v{version}` (for example `Task Notes v0.1.0`), and the version is fetched once per page load with no retry or polling; the comment asks for neither, and `docs/DEVELOPMENT.md` already describes exactly this runtime behaviour.
- Assumption (recorded): `README.md` and `docs/DEVELOPMENT.md` are left unchanged. `docs/DEVELOPMENT.md` already documents the runtime-fetched footer (its "The page footer shows the backend's version and build commit" paragraph, which also describes a commit suffix belonging to a later item); this item does not edit that paragraph, because the commit suffix is out of scope and the rest already matches what this plan builds.
- Merged since the last plan: n/a (fresh plan, branched from current main 64dae872).

## Plan Overview
Frontend change, with a runtime dependency on the existing backend endpoint `GET /api/version` (TEST-05); no backend file changes. `AppFooter` stops importing `frontend/package.json` and instead calls a new typed client function `fetchBackendVersion()` in `frontend/src/api/version.ts` from a mount-time `useEffect`, holding the result in local state. It renders `Task Notes` while the request is pending or after it fails, and `Task Notes v{version}` once a usable version arrives. The API base URL moves from `frontend/src/api/notes.ts` into a one-line shared module `frontend/src/api/baseUrl.ts` so both clients read the same `VITE_API_BASE_URL` value from one place. `LandingPage.tsx` is **not** modified: `AppFooter` owns its own fetch, so the page's render and the note-form wiring are untouched. Tests: unit tests for the client and the footer's three states, the existing `LandingPage` and TEST-04 tests updated to stop asserting the frontend package version, and an E2E spec proving the real stack shows the backend's version and falls back on a failed request.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import; `useState<string | null>(null)` for the version; `useEffect` calls `fetchBackendVersion()` once on mount with an `isMounted` guard (the same pattern `LandingPage.tsx` uses for `listNotes`); a rejected promise leaves the state `null`. A resolved value is shown only when it is a non-empty string other than `unknown` (a small module-level `isDisplayableVersion` helper). Render: `{APP_NAME}` alone when not displayable, `{APP_NAME} v{version}` when it is. The text must not carry a trailing space in the fallback (render the ` v{version}` part conditionally as one string). `data-testid="app-footer"`, the `<footer>` element and `footerStyle` are unchanged.
  - `frontend/src/api/version.ts` (new): `export type VersionResponse = { version: string }` and `export async function fetchBackendVersion(): Promise<string>` calling `fetch(`${API_BASE_URL}/api/version`)`; throws `Loading the version failed: {status} {statusText}` on a non-OK response, and throws `Unexpected version response` when the body is not an object with a string `version` (coding_standards.md Section 4: typed response, unexpected shapes handled). Network errors propagate as the rejected fetch. No retry: the footer is informational and a reload re-fetches.
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL` (`import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`), moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of defining it; behaviour unchanged.
  - `frontend/src/components/LandingPage.tsx`: **not modified.**
- Routes: none.
- State management: local component state in `AppFooter` (`useState` and `useEffect`); no global store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer style is kept exactly: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; no loading or error styling is added.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05) and returns `{"version": "<backend/pyproject.toml version>"}` with status 200, CORS already permits `GET` from the frontend origin, and its integration tests already cover it. See `## Re-Plan Feedback` for why the comment's "add an endpoint" request needs no new code.

## API Integration Plan
No external API integration. The only API consumed is this project's own backend, through the client module `frontend/src/api/version.ts`.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0"}` (the value is whatever `backend/pyproject.toml` `[project].version` holds; `"unknown"` when the backend's package metadata is missing). Any non-200 status, a network error, or a body without a string `version` is treated by the frontend as "version not resolved".

## Technology Selection
- Version fetch: chose the browser's native `fetch` inside the existing client-module pattern (`frontend/src/api/`) over adding a data-fetching library (React Query, SWR), because one GET on mount needs no caching layer and the project already uses plain `fetch` in `notes.ts`.
- Footer loading and failure state: chose React's own `useState` and `useEffect` over a state library or Suspense boundary, because the state is one nullable string local to one component.
- Shared base URL (`frontend/src/api/baseUrl.ts`): chose moving the existing constant into a tiny module over duplicating `VITE_API_BASE_URL ?? "http://localhost:8010"` in a second client, because coding_standards.md asks for one value from one source; no stdlib or dependency is involved.
- E2E expected-version helper (`e2e/helpers/backendVersion.ts`): chose reading `backend/pyproject.toml` with Node's built-in `node:fs` and a one-line regex over adding a TOML parser dependency, because only the single `version = "..."` line under `[project]` is needed; it is shared by the TEST-04 and TEST-08 specs instead of being written twice.
- No new npm or Python dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/version.ts: typed client `fetchBackendVersion()` for `GET /api/version`, throws on non-OK and on an unexpected shape
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client (stubbed `fetch`)
- [A] frontend/src/api/baseUrl.ts: the single `API_BASE_URL` constant both API clients import
- [D] e2e/helpers/backendVersion.ts: reads the expected version from `backend/pyproject.toml` for E2E assertions
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E spec, footer shows the backend version on the real stack, and falls back to `Task Notes` when `/api/version` is aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/components/AppFooter.tsx: fetch the version at runtime via `fetchBackendVersion()`; render `Task Notes` while pending or on failure, `Task Notes v{version}` when resolved; drop the `package.json` import
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert the present path, the absent paths (rejected request, `unknown`, empty string) and the pending path; drop the `package.json` import
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of the `package.json` version (the component itself is unchanged)
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it; no behaviour change
- [D] e2e/tests/TEST-04_page_footer.spec.ts: expect the backend version from `e2e/helpers/backendVersion.ts` instead of `frontend/package.json`, which the footer no longer shows
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the step "that version number matches the "version" field of frontend/package.json" now names `backend/pyproject.toml`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisite and step 4 compare against `backend/pyproject.toml` instead of `frontend/package.json`

`frontend/src/components/LandingPage.tsx` is deliberately absent from this manifest: TEST-08 does not touch it (the footer owns its own fetch). `frontend/src/components/LandingPage.test.tsx` is touched, which is the one file BUG-04 could also plausibly edit.
No dependency is added or changed, so no lockfile entry. `README.md` and `docs/DEVELOPMENT.md` need no edit: project structure, run configuration, dependencies and test infrastructure are unchanged, and `docs/DEVELOPMENT.md` already describes the runtime-fetched footer.

## Testing Strategy
- Unit tests: (Vitest, frontend) `fetchBackendVersion` returns the `version` on 200 and calls `{API_BASE_URL}/api/version`; throws on a non-OK status; throws on a body without a string `version`; rejects on a network error. `AppFooter`: shows `Task Notes v0.1.0` when the mocked client resolves `0.1.0`; shows exactly `Task Notes` (no `v`, no `undefined`, `null` or `unknown`) when it rejects, resolves `unknown`, or resolves an empty string; shows exactly `Task Notes` while the client's promise is still pending; keeps the `contentinfo` landmark and `app-footer` test id. `LandingPage`: footer shows the mocked backend version. `notes.test.ts` stays green unchanged (base-URL move is behaviour-preserving).
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (the frontend's existing Vitest convention; `CLAUDE.md`'s unit test directory and `test_{module}_unit.py` naming are the backend's)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`
- Integration tests: no new integration tests. The endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, answers without a database, 405 on POST); this item adds no router or repository code.
  - Directory: backend/tests/integration/
- E2E tests: footer on the real stack shows `Task Notes v{backend version}` read from `backend/pyproject.toml` and does not show the frontend's `v0.0.0`; edge case: with `**/api/version` aborted through `page.route`, the footer text is exactly `Task Notes`. TEST-04's spec updated to the backend version.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from the backend at runtime via `GET /api/version`, not from `frontend/package.json` | E2E | — |
| 3 | When the version cannot be resolved, the footer renders `Task Notes` alone | Unit | verifying it needs no navigation or interaction: it is a render branch of `AppFooter` over the client's rejected or `unknown` result, exercised by mocking the client (the E2E edge spec also covers the aborted-request case) |
| 4 | A component test asserts both paths, version present and version absent | Unit | the criterion is itself a component-test requirement, satisfied by `AppFooter.test.tsx` |
| 5 | Before the request settles, the footer renders `Task Notes` alone | Unit | verifying it needs no navigation or interaction: it is the initial render state, only deterministic with a never-resolving mocked promise; a browser cannot hold the request pending without a timing-dependent test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")`, `getByTestId("app-footer")` visible and contains `v{backend version}` | Given the app is running, When I open the landing page, Then the footer shows "Task Notes v" and a version |
| 2 | Version comes from the backend at runtime | assert footer text equals `Task Notes v{version from backend/pyproject.toml}` and does not contain `v0.0.0` | Given the backend reports version X, When I open the landing page, Then the footer shows X, not the frontend's package version |
| 3 | Unresolved version renders `Task Notes` alone | covered at Unit, see Criterion coverage; E2E edge spec aborts `**/api/version` and asserts footer text is exactly `Task Notes` | Given the backend is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version, "undefined", "null" or "unknown" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then the present and absent cases pass |
| 5 | Pending request renders `Task Notes` alone | covered at Unit, see Criterion coverage | Given the version request has not answered, When the page first renders, Then the footer reads "Task Notes" only |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: from the repository root, `docker compose up --build` has started `db`, `backend` and `frontend`; `backend/pyproject.toml` `[project].version` reads `0.1.0`.
1. Open `http://localhost:5183` in a browser → the landing page shows the title "Task Notes" and the note form.
2. Scroll to the bottom of the page → the footer (`data-testid="app-footer"`) reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not from frontend/package.json
Prerequisites: same stack as Criterion 1; `frontend/package.json` `version` reads `0.0.0` and `backend/pyproject.toml` `version` reads `0.1.0`.
1. Open `http://localhost:8010/api/version` in a browser tab → the page shows `{"version":"0.1.0"}`.
2. Open `http://localhost:5183`, then open browser dev tools → Network tab and reload → a `GET` request to `http://localhost:8010/api/version` appears with status 200.
3. Read the footer → it reads `Task Notes v0.1.0`, the backend's version, and not `Task Notes v0.0.0`, the frontend package's version.
4. Edit `backend/pyproject.toml` to `version = "0.1.1"`, run `docker compose up --build backend` so the backend reinstalls, leave the frontend untouched, and reload `http://localhost:5183` → the footer reads `Task Notes v0.1.1` with no frontend rebuild. Revert the edit and rebuild the backend afterwards.

### Criterion 3: When the version cannot be resolved, the footer renders "Task Notes" alone
Prerequisites: the stack from Criterion 1 is running.
1. Run `docker compose stop backend` → the backend container stops.
2. Reload `http://localhost:5183` → the page still renders the title and note form; the footer reads exactly `Task Notes`, with no `v`, no `undefined`, `null` or `unknown`, and no empty gap after the name.
3. In dev tools → Network, find the `api/version` request → it shows a failed request (connection refused), and the footer is unchanged.
4. Run `docker compose start backend`, wait for it to start, and reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run reports `0 failed`, and its output lists a case for the version-present path (`Task Notes v0.1.0`) and cases for the version-absent paths (rejected request, `unknown`, empty string).

### Criterion 5: Before the request settles, the footer renders "Task Notes" alone
Prerequisites: the stack from Criterion 1 is running, in Chrome or Edge.
1. Open dev tools → Network, set throttling to "Slow 3G" (or add a request-blocking-free slow profile), and reload `http://localhost:5183` → while the `api/version` request is still pending, the footer reads exactly `Task Notes`, with no placeholder text, spinner or blank footer.
2. Wait for the request to complete → the footer changes to `Task Notes v0.1.0` without a page reload.
3. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → `0 failed`, including the pending-state case.
