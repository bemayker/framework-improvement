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
<!-- Criterion 2 is restated as the tracker comment corrected it (the comment overrides the description where they disagree). Criterion 3 carries the loading and failure states the same comment asks to have decided. -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. As corrected by the tracker comment, that source is the backend at runtime: the footer fetches `GET /api/version` and shows the backend's version, so a frontend rebuilt against an older backend shows the backend's version, not the frontend bundle's `package.json` version.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap. Decided states: before the fetch resolves, the footer reads `Task Notes` (no version, no placeholder); when `/api/version` is unreachable, answers non-OK, or answers with no usable version (missing, empty, or the backend's `unknown` sentinel), the footer reads `Task Notes` (not blank, not `unknown`).
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: (a) criterion 2 is restated so the single declared source is the backend's `GET /api/version`, fetched at runtime by a new client `frontend/src/api/version.ts`; the footer no longer imports `package.json`. (b) **No new endpoint is needed and none is planned:** `GET /api/version` already exists on main since TEST-05 (`backend/app/routers/version.py`, `backend/app/schemas/version.py`, `backend/app/services/version_service.py`, registered in `backend/app/main.py`), returning `{"version": "<backend/pyproject.toml [project].version>"}`, and the backend's CORS middleware already allows `GET` from the frontend origin `http://localhost:5183`. (c) **Backend change, stated explicitly:** the comment expected this item to grow a backend change. It does not: because TEST-05 already delivered the endpoint, this plan makes **no** backend change and the Backend Plan says so; the item stays frontend-only in its diff, but it now has a **runtime dependency on the backend** (TEST-05's endpoint), which it did not have as described. (d) **Loading state, decided:** until the fetch resolves the footer shows `Task Notes` with no version and no placeholder text (no `loading...`, no `v`, no trailing space). Chosen over a `loading` placeholder because the page is otherwise static, the fetch is a single local GET, and criterion 3 already forbids an empty gap: the footer is never blank, it is the name alone. (e) **Failure state, decided:** when `/api/version` is unreachable, returns non-OK, or returns a body without a usable `version`, the footer shows `Task Notes` with no version, the same as the loading state. Chosen over showing `unknown` because criterion 3 asks that the footer "renders without it", and a literal `unknown` would look like a version string to anyone reading it; the backend's own `unknown` sentinel (`version_service.UNKNOWN_VERSION`, returned when package metadata is missing) is treated as unresolved for the same reason. Assumption recorded: the comment's "the footer fetches it" is read as a fetch on mount, once; no retry and no timeout are added (a fetch timeout is CHORE-02's scope per feature_map.md).
- Comment (dispatch context, not a stakeholder comment): TEST-09, planned concurrently, adds a `commit` field to the `/api/version` response → Addressed by: this plan touches no backend file TEST-09 owns, and the frontend client reads only `version` from the body and tolerates extra fields, so TEST-09's additive change cannot break it. Showing the commit is TEST-10's scope, not this item's.
- Comment (dispatch context): BUG-04 is serialized after this item on `frontend/src/components/LandingPage.tsx` → Addressed by: this plan does **not** modify `LandingPage.tsx`; the fetch lives inside `AppFooter`, which `LandingPage` already renders. Only `LandingPage.test.tsx` changes (its footer assertion reads `package.json` today and must mock the version client instead). The description's note that it "modifies `LandingPage.tsx`" is therefore not acted on, because the footer is a separate component since TEST-04.
- Merged since the last plan: n/a (fresh plan, base 775ade54b713c5663b70f1d2ba3017075807676b, no `[merged-since]` lines in the dispatch).

## Plan Overview
Frontend-only change. A new typed API client function `fetchBackendVersion()` in `frontend/src/api/version.ts` calls the existing `GET /api/version` and returns the version string, or `null` when the body carries no usable version. `AppFooter` calls it once on mount and renders `Task Notes v{version}` when it resolves, and `Task Notes` alone while loading and on any failure. The API base URL constant, today private to `frontend/src/api/notes.ts`, moves to a shared `frontend/src/api/config.ts` so both clients read one source (coding standards Section 5). Existing tests that assert the `package.json` version in the footer (`AppFooter.test.tsx`, `LandingPage.test.tsx`, `e2e/tests/TEST-04_page_footer.spec.ts`) are rewritten to the backend-sourced behaviour. No backend change, no new dependency.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/components/AppFooter.tsx`: drop the `package.json` import; hold `version: string | null` in state (initially `null`); in a `useEffect` with an `isMounted` guard (the pattern `LandingPage.tsx` already uses), call `fetchBackendVersion()` and set the result; on rejection keep `null`. Render `<footer data-testid="app-footer" role landmark unchanged>` with text `Task Notes`, followed, only when `version` is a non-empty string, by ` ` plus `<span data-testid="app-version">v{version}</span>`. When `version` is `null` there is no span and no trailing space or `v`.
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. `fetch(VERSION_URL)`; non-OK throws `Loading the version failed: {status} {statusText}` (same shape as `notes.ts`); a body whose `version` is not a non-empty string, or equals the backend sentinel `unknown`, resolves to `null`; network errors propagate as rejections. Reads only `version`, so extra fields (TEST-09's `commit`) are ignored. Exports the response type `VersionResponse = { version: string }`.
  - `frontend/src/api/config.ts` (new): exports `API_BASE_URL` (`import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`), moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts`: import `API_BASE_URL` from `./config` instead of declaring it. No behaviour change.
- Routes: none (landing page `/` only).
- State management: local `useState` in `AppFooter`; no global state.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer style is kept unchanged: `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`; the version span inherits it, no new style.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05) and returns `{"version": "..."}` from `backend/pyproject.toml`; CORS already allows `GET` from `http://localhost:5183`. TEST-09 owns the concurrent change to that endpoint's response, and this plan touches none of its files.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05), called as `{API_BASE_URL}/api/version`, default `http://localhost:8010/api/version`
- Request: no body, no parameters
- Response: `200`, JSON `{"version": "0.1.0"}` (TEST-09 may add `"commit": "..."`; ignored by this client). The client maps: `200` with non-empty `version` other than `unknown` → that string; `200` with missing, empty, non-string or `unknown` version → `null`; non-OK → throws; network failure → rejects.

## Technology Selection
- Version fetch: chose the browser's native `fetch` inside the existing client-module pattern (`frontend/src/api/`) over adding a data-fetching library (react-query, swr, axios), because one GET on mount needs no cache, retry or library, and `notes.ts` already uses `fetch`.
- Loading/failure state in the footer: chose React's own `useState` and `useEffect` (already installed) over a suspense/data library, because the state is a single nullable string.
- Shared base URL (`frontend/src/api/config.ts`): no stdlib call, native feature or installed dependency covers sharing one constant between two modules, so it is a three-line module built here; chosen over duplicating the default URL in `version.ts`, which would give one deployment-dependent value two sources.

## File Manifest
### New files
- [A] frontend/src/api/config.ts: single source of `API_BASE_URL` for every frontend API client
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for the existing `GET /api/version`
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the client (fetch stubbed): resolved version, default URL, `VITE_API_BASE_URL` override, missing/empty/`unknown` version → null, extra `commit` field ignored, non-OK throws
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec: footer shows the version the browser received from `/api/version`; edge case with `/api/version` aborted shows `Task Notes` and no `app-version`
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./config`; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version on mount; render version only when resolved; drop the `package.json` import
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present (`Task Notes v1.2.3`, `app-version` span), loading (name only, no `v`), rejected fetch and `null` result (name only; no `undefined`, `null`, `unknown`); landmark test kept
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version`; footer assertion uses the mocked backend version instead of `package.json`
- [D] e2e/tests/TEST-04_page_footer.spec.ts: replace the `frontend/package.json` version expectation with the version the browser received from `/api/version`, since TEST-08 changes the footer's source; the heading, landmark and mobile-viewport checks are kept

No dependency is added or changed, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file documents the footer's version source. `frontend/src/components/LandingPage.tsx` is deliberately not modified (see Re-Plan Feedback). TEST-04's own UAT script and Gherkin file (`e2e/uat/scripts/TEST-04_page_footer_uat_script.md`, `e2e/uat/scenarios/TEST-04_page_footer.feature`) are TEST-04's record and are not edited; TEST-08's scenarios supersede their version step.

## Testing Strategy
- Unit tests: Vitest, frontend. `version.test.ts` covers the client (happy path, edge cases null/empty/`unknown`/extra field, error case non-OK). `AppFooter.test.tsx` covers the component states (present, loading, failure, unusable value). `LandingPage.test.tsx` keeps its footer smoke assertion with the client mocked. No backend unit test is warranted: no backend code changes.
  - Directory: `frontend/src/` beside the module (the project's existing Vitest convention; the backend `backend/tests/unit/` directory does not apply to frontend code)
  - Naming: `{Module}.test.ts(x)` as the existing frontend tests
- Integration tests: not warranted for this item: no router, repository or model changes; `backend/tests/integration/test_version_integration.py` (TEST-05) already covers `GET /api/version` and stays unchanged.
  - Directory: backend/tests/integration/
- E2E tests: the footer showing the backend's version on the landing page in a real browser against the real backend, plus one edge-case spec with `/api/version` aborted via `page.route`. The TEST-04 spec is updated to the new source.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source: the backend's `GET /api/version` at runtime, never a typed string and never `package.json` | Unit | verifying it needs no navigation or interaction: the client test asserts the URL called and that the returned value is what the body carried, and the footer test asserts the rendered value is exactly what the mocked client returned (a value no file declares); the E2E spec for criterion 1 also compares against the browser's own `/api/version` response |
| 3 | When the version cannot be resolved (loading, unreachable, non-OK, unusable value) the footer renders `Task Notes` without it, never `undefined`, `null`, `unknown` or a gap | Unit | verifying it needs no navigation or interaction: each state is a rendered-output assertion on `AppFooter` with the client mocked to pend, reject or return null; the E2E edge-case spec additionally exercises the aborted request |
| 4 | A component test asserts both paths: version present and version absent | Unit | the criterion is itself a component test: `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")` while capturing the `/api/version` response; assert `app-footer` contains `Task Notes` and `app-version` has text `v` + the response's `version` | Given the backend is running When I open the landing page Then the footer shows `Task Notes v` followed by the backend's version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage (criterion 1's spec compares against the live response) | Given the backend reports version 0.1.0 and the frontend package declares 0.0.0 When I open the landing page Then the footer shows `v0.1.0` and not `v0.0.0` |
| 3 | Unresolved version renders the name only | covered at Unit; edge-case spec: `page.route("**/api/version", r => r.abort())`, assert footer text is exactly `Task Notes` and `app-version` is absent | Given the backend is stopped When I open the landing page Then the footer reads `Task Notes` with no version, `undefined`, `null` or `unknown` |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter tests Then they pass with 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repo root with `docker compose up -d --build` (db, backend on port 8010, frontend on port 5183).
1. In a browser, open `http://localhost:5183/` → the Task Notes landing page loads with the heading `Task Notes`.
2. Scroll to the bottom of the page → the footer reads `Task Notes v0.1.0` (the backend's `backend/pyproject.toml` version on main today).

### Criterion 2: The version comes from the backend at runtime, not from package.json
Prerequisites: the stack is running as above; `frontend/package.json` declares `"version": "0.0.0"` and `backend/pyproject.toml` declares `version = "0.1.0"`.
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0"}` (possibly with a `commit` field once TEST-09 lands).
2. Open `http://localhost:5183/` and read the footer → it reads `Task Notes v0.1.0`, the backend's value, and not `Task Notes v0.0.0`.
3. Open the browser developer tools Network tab, reload `http://localhost:5183/` → one `GET` request to `http://localhost:8010/api/version` appears with status 200, and the footer version matches its response.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack is running as above.
1. From the repo root, run `docker compose stop backend` → the backend container stops; the frontend keeps running.
2. Open `http://localhost:5183/` (hard reload) → the page loads and the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap after the name.
3. In the developer tools Network tab → the `GET http://localhost:8010/api/version` request is shown as failed.
4. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, and reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths: version present, and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → both files run and the summary reports `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a test for a resolved version (footer shows `Task Notes v` plus the mocked version) and tests for an absent version (pending fetch, rejected fetch, `null` result) each asserting the footer reads `Task Notes` only.
