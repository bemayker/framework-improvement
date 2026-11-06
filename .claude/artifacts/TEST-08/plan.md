# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria.**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (ClickUp task 123k99ctgch, read via `clickup_get_task`, workspace 30307190. Amended by the tracker comment recorded under Re-Plan Feedback, which overrides the description where they disagree.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. **Amended by the tracker comment:** that source is the backend's own version (`backend/pyproject.toml` `[project].version`, served at runtime by `GET /api/version`), not `frontend/package.json` and not a build-time variable.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (From the tracker comment) The footer fetches the version at runtime, so a frontend built against an older backend shows the backend's version, not its own.
- [ ] 6. (From the tracker comment) The loading state (before `/api/version` resolves) and the failure state (`/api/version` unreachable or unusable) are decided and recorded: both render the app name with no version, as specified under Frontend Plan.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: the footer no longer imports `frontend/package.json`; a new client `frontend/src/api/version.ts` calls `GET /api/version` on mount and the footer renders what the backend answered. Criterion 2 is amended accordingly and criterion 5 added. **Assumption recorded:** `GET /api/version` already exists on main @ 64dae87 (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`). It returns `{"version": "<installed task-notes-backend version>"}`, read from package metadata, i.e. `backend/pyproject.toml` `[project].version` (currently `0.1.0`). It already does exactly what the comment asks, so this plan reuses it unchanged and does not add a second endpoint. CORS already admits it: `allow_methods` includes GET and the default origin is `http://localhost:5183`.
- Comment (tracker): "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: decision recorded as criterion 6 and under Frontend Plan → State management. **Loading:** the footer renders `Task Notes` with no version and no placeholder (no "loading", no ellipsis). **Failure:** the footer renders `Task Notes` with no version: not blank, not `unknown`, not `vundefined`, and no trailing ` v`. The footer itself is never blank because the app name is always present; only the version segment is omitted. Failure covers: network error (backend down or CORS-refused), a non-2xx response, a body without a non-empty string `version`, and the backend's own sentinel `"unknown"` (`UNKNOWN_VERSION` in `version_service.py`, returned when the distribution is not installed). Reason for treating `"unknown"` as absent: criterion 3 says an unresolvable version is omitted, and the sentinel is the backend saying it could not resolve one; printing `Task Notes vunknown` is exactly the "footer reading unknown" the comment distinguishes. No retry and no timeout are added: neither is asked for, and the feature map's CHORE-02 (TEST-08 follow-up) already carries the fetch timeout.
- Comment (tracker): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in the Plan Overview. The comment changes the item from frontend-only to **frontend plus a runtime dependency on a backend endpoint**. On the plan base the endpoint already exists (TEST-05, a declared dependency of TEST-08 in `feature_map.md`, complete), so the backend change the comment anticipates is **zero files**: the Backend Plan says so and the File Manifest carries no `[B]` entry. The description's "touches no backend file" therefore still holds for files, but no longer holds for behaviour: the footer is now only as correct as `GET /api/version`, and a backend outage changes what the footer shows (criterion 6). If a later change moves or renames that endpoint, this footer breaks with it.
- Scheduler note (dispatch, not a tracker comment): "list exactly which frontend files TEST-08 touches" → Addressed by: `frontend/src/components/LandingPage.tsx` is **not** modified. The footer fetches its own version, so the landing page keeps rendering `<AppFooter />` exactly as today. Frontend files touched: `frontend/src/api/apiBaseUrl.ts` (new), `frontend/src/api/version.ts` (new), `frontend/src/api/version.test.ts` (new), `frontend/src/api/notes.ts`, `frontend/src/components/AppFooter.tsx`, `frontend/src/components/AppFooter.test.tsx`, `frontend/src/components/LandingPage.test.tsx`. The last one is a test file BUG-04 or TEST-10 may also edit: it must change because it asserts the footer shows the `package.json` version and does not mock the new client.

## Plan Overview
Switch the landing page footer (`AppFooter`, from TEST-04) from a build-time import of `frontend/package.json` to a runtime fetch of the backend's `GET /api/version` (from TEST-05). One new client module calls the endpoint and validates the response. The API base URL moves into one shared module so the notes client and the version client read it from one place. The footer holds the version in local state and renders `Task Notes v{version}` once it resolves, and `Task Notes` alone while loading or on failure. Layers: frontend only in files. **Backend: no file changes, but the item now depends on an existing backend endpoint at runtime (see Re-Plan Feedback).** The TEST-04 E2E spec and its UAT artifacts assert the `package.json` version, so they are updated to the backend-sourced version; otherwise they would fail or describe behaviour that no longer exists.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/apiBaseUrl.ts` (new): exports `API_BASE_URL`, resolved as `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`. This moves the existing default and env read out of `notes.ts` unchanged, so the value has one source (`coding_standards.md` Section 5, "One value, one source").
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./apiBaseUrl` and remove its local `DEFAULT_API_BASE_URL` and `API_BASE_URL` constants. No behaviour change. `notes.test.ts` still passes unchanged: its `vi.resetModules()` plus dynamic import re-evaluates `apiBaseUrl.ts` too.
  - `frontend/src/api/version.ts` (new): `export async function getBackendVersion(): Promise<string>`. It calls `fetch(`${API_BASE_URL}/api/version`)`. It throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response, in the same shape as `notes.ts`'s `requestFailed`. It throws when the body is not an object with a non-empty string `version`, and when `version === "unknown"` (the backend sentinel; name it `BACKEND_UNKNOWN_VERSION` with a comment pointing at `version_service.py`). Otherwise it returns the string. It defines a `VersionResponse` type (`{ version: string }`), with no `any`. A network error propagates as the rejected `fetch` promise.
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. Add `useState<string | null>(null)` and a mount-only `useEffect` that calls `getBackendVersion()`, sets the state on success, and leaves it `null` on rejection. Use an `isMounted` guard, the same pattern as `LandingPage.tsx`'s notes load. Render `<footer data-testid="app-footer">Task Notes{version !== null && <span data-testid="app-footer-version"> v{version}</span>}</footer>`, so the absent state's text content is exactly `Task Notes`, with no trailing space and no `v`. `APP_NAME`, `footerStyle` and the `contentinfo` landmark stay as they are.
  - `frontend/src/components/LandingPage.tsx`: **not modified** (it already renders `<AppFooter />`).
- Routes: none (landing page `/` only).
- State management: local component state in `AppFooter`, `string | null`, starting at `null`. **Loading state = `null` = renders `Task Notes` only. Failure state = `null` = renders `Task Notes` only.** Both are recorded decisions (criterion 6), not defaults. Choosing "name only" over a placeholder: criterion 3 forbids `undefined`, `null` or an empty gap, and the comment asks for the blank-versus-`unknown` choice to be explicit. Name only is neither a blank footer nor a footer reading `unknown`. The version appears in place once the fetch resolves. No retry, no timeout, no polling (not asked for; CHORE-02 owns the timeout).
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing TEST-04 footer styling is kept unchanged: `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`. The version span inherits it.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main @ 64dae87 (TEST-05) and returns `{"version": "<backend version>"}`. The tracker comment asks for it, and it is reused unchanged. This item depends on it at runtime: see Re-Plan Feedback, third line.

## API Integration Plan
No external API integration. The footer consumes this project's own backend, through the client layer in `frontend/src/api/`.

## API Contract
- Method: GET
- URL: `{API_BASE_URL}/api/version` (`API_BASE_URL` = `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0"}` (the installed `task-notes-backend` version; `"unknown"` when the distribution metadata is absent, which the client treats as unresolved). Existing contract from TEST-05, unchanged.

## Technology Selection
- Version source: chose the existing backend endpoint `GET /api/version` (TEST-05, `importlib.metadata`) over `frontend/package.json` and over a Vite `define` build-time variable, because the tracker comment requires the backend's runtime version, and both frontend options report the bundle's own version.
- HTTP client for `frontend/src/api/version.ts`: chose the platform's native `fetch` (already used by `notes.ts`) over any HTTP library. No new dependency.
- Loading and failure state in `AppFooter`: chose React's built-in `useState` and `useEffect` over a data-fetching library (none installed; one call on mount needs none).
- `frontend/src/api/apiBaseUrl.ts`: chose to move the existing `import.meta.env` read out of `notes.ts` (Vite's native env mechanism) over duplicating the default literal in the new client. No alternative library applies.
- Response validation: chose a few lines of `typeof` checks over a schema library (none installed; one string field).
- No new dependency is introduced, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/apiBaseUrl.ts: single source of the backend base URL (`VITE_API_BASE_URL` or the `http://localhost:8010` default), shared by the notes and version clients
- [A] frontend/src/api/version.ts: `getBackendVersion()` client for `GET /api/version` with response-shape validation and the `"unknown"` sentinel treated as unresolved
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client with `fetch` stubbed (happy path and request URL, non-OK, malformed body, empty string, `"unknown"` sentinel, network rejection, `VITE_API_BASE_URL` override)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec; footer shows the version the browser received from `/api/version`, and the edge case of footer without a version when `/api/version` is aborted via `page.route`
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (backend unreachable)
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./apiBaseUrl`; drop the local base-URL constants (no behaviour change)
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the version on mount; render `Task Notes v{version}` when resolved and `Task Notes` alone while loading or on failure
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert the present path (`Task Notes v9.9.9`, and not the `package.json` version), the absent path (rejection gives text exactly `Task Notes` and no `app-footer-version`), the `"unknown"`-as-absent path through the client mock's rejection, the loading path (pending promise gives `Task Notes` only), and the existing name and landmark tests
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` (resolve `9.9.9`); replace the `package.json` version assertion in "renders the footer with the app name and version" with the mocked backend version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: replace the `frontend/package.json` read with the body of the `/api/version` response the page received (`page.waitForResponse`), so the TEST-04 assertions follow the new source
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: line 15's "matches the version field of frontend/package.json" now reads "matches the version reported by GET /api/version"
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite (line 9) and step 4 now compare the footer to `GET /api/version` instead of `frontend/package.json`

No dependency is added or changed, so there is no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and neither file documents the footer's version source.

## Testing Strategy
- Unit tests: the frontend version client (`version.test.ts`, `fetch` stubbed as in `notes.test.ts`) and the `AppFooter` component (`AppFooter.test.tsx`, client module mocked), covering present, absent, loading and the `"unknown"` sentinel. `LandingPage.test.tsx` is updated so it mocks the client. No backend unit tests: there is no backend change, and `backend/tests/unit/test_version_service_unit.py` already covers the service.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (the existing Vitest layout; CLAUDE.md's `backend/tests/unit/` is the backend's)
  - Naming: `{Module}.test.ts(x)`, matching the existing frontend tests
- Integration tests: no new ones. The tier is not warranted for this item, because no router, repository or model changes. The endpoint the footer reads is already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, answers without a database, 405 on POST).
  - Directory: backend/tests/integration/
- E2E tests: the footer on `/` shows the version the browser actually received from `/api/version` (real cross-origin fetch from :5183 to :8010). The edge case is `/api/version` aborted with `page.route`, after which the footer reads `Task Notes` with no `v`, `undefined`, `null` or `unknown`. The TEST-04 spec is updated to the new source.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the backend-unreachable edge case; TEST-04's scenario line updated to the new source.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source (backend `GET /api/version`, per the comment), never typed into the component | Unit | Where the value comes from is a wiring property: a mocked client returning `9.9.9` while `package.json` says `0.0.0` proves the footer renders the client's value, and `version.test.ts` proves the client calls `/api/version`. The backend side (pyproject version) is already covered at Integration by `test_version_integration.py`. |
| 3 | When the version cannot be resolved, the footer renders without it (no `undefined`, `null` or gap) | Unit | Failure is a rejected client promise, and needs no navigation or interaction to verify. The component test asserts the exact text `Task Notes`. The E2E aborted-route spec adds browser-level evidence as the feature's required edge case. |
| 4 | A component test asserts both paths: version present, and version absent | Unit | The criterion is itself a component test (`AppFooter.test.tsx`). |
| 5 | A frontend built against an older backend shows the backend's version, not its own | Unit | A mocked client value that differs from `frontend/package.json`'s version proves the bundle's own version is never rendered. Rebuilding mismatched deployments in a browser test adds nothing a value mismatch does not already show. |
| 6 | Loading and failure states render the app name with no version | Unit | A never-resolving and a rejecting client mock assert the two recorded states directly. Neither needs navigation or interaction. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")` while awaiting `page.waitForResponse` for `/api/version`; assert `getByTestId("app-footer")` contains `Task Notes v` plus the response body's `version` | Given the app is running, When I open the landing page, Then the footer shows "Task Notes v" followed by the backend version |
| 2 | Single declared source (backend) | covered at Unit, see Criterion coverage | Given GET /api/version reports a version, When I open the landing page, Then the footer's version equals that value |
| 3 | Unresolvable version omitted | covered at Unit, see Criterion coverage; E2E edge spec: `page.route("**/api/version", r => r.abort())`, footer text is exactly `Task Notes` | Given the backend is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version, "undefined", "null" or "unknown" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they pass with 0 failed |
| 5 | Backend version wins over the bundle's | covered at Unit, see Criterion coverage | Given the backend's version differs from frontend/package.json, When I open the landing page, Then the footer shows the backend's version |
| 6 | Loading and failure states recorded | covered at Unit, see Criterion coverage | Given /api/version has not answered yet, When the landing page renders, Then the footer reads "Task Notes" only |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repo root with `docker compose up -d --build` (services `db`, `backend` on :8010, `frontend` on :5183).
1. Open `http://localhost:8010/api/version` in a browser tab → the page shows `{"version":"0.1.0"}` (the value of `version` in `backend/pyproject.toml`).
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading and the note form.
3. Scroll to the bottom of the page and read the footer → it reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from a single declared source (backend GET /api/version)
Prerequisites: as Criterion 1.
1. Open `frontend/package.json` and read `version` → `0.0.0`.
2. Open `http://localhost:5183/` with the browser DevTools Network tab open, filtered on `version` → one request to `http://localhost:8010/api/version` with status 200 and response `{"version":"0.1.0"}`.
3. Read the footer → `Task Notes v0.1.0`, the backend's value, and not `0.0.0`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as Criterion 1.
1. Run `docker compose stop backend` from the repo root → `curl -s http://localhost:8010/api/version` now fails to connect.
2. Reload `http://localhost:5183/` → the landing page still renders, with heading and note form.
3. Read the footer → it reads exactly `Task Notes`, with no `v`, `undefined`, `null`, `unknown` and no trailing blank.
4. Run `docker compose start backend` and reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → expected result: `0 failed`. The output lists the present-path test (`Task Notes v9.9.9`) and the absent-path test (`Task Notes` only) by name.

### Criterion 5: A frontend built against an older backend shows the backend's version
Prerequisites: as Criterion 1.
1. Edit `backend/pyproject.toml` and set `version = "0.2.0"` (do not commit).
2. Run `docker compose up -d --build backend` (rebuilds the backend only; the frontend bundle is unchanged) → `http://localhost:8010/api/version` shows `{"version":"0.2.0"}`.
3. Reload `http://localhost:5183/` → the footer reads `Task Notes v0.2.0`, while `frontend/package.json` still says `0.0.0`.
4. Revert `backend/pyproject.toml` to `0.1.0` and run `docker compose up -d --build backend` → the footer returns to `Task Notes v0.1.0`.

### Criterion 6: Loading and failure states are decided and recorded
Prerequisites: as Criterion 1, in Chrome.
1. Open DevTools, then Network, and set throttling to `Slow 3G`. Reload `http://localhost:5183/` and watch the footer before the `/api/version` request completes → the footer reads `Task Notes` only (no "loading" text, no `unknown`).
2. When the request completes → ` v0.1.0` appears after `Task Notes` in place.
3. In the Network tab, right-click the `version` request and choose `Block request URL`, then reload → the footer stays `Task Notes` only (the failure state matches the loading state, as recorded).
4. Remove the block and set throttling back to `No throttling`.
