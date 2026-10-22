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
> Tracker: ClickUp task 123k99ctgch (https://app.clickup.com/t/123k99ctgch). The newest tracker comment corrects criterion 2 and the "frontend only" note; see Re-Plan Feedback. The criteria below are the ticket's, with that correction applied.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source: the backend's `GET /api/version`, fetched at runtime by the footer. It is never a string typed into the component and never the frontend's own `package.json` version, so a frontend rebuilt against an older backend shows the backend's version. (Ticket criterion 2, overridden by the tracker comment.)
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. The footer's loading state (before `/api/version` resolves) and failure state (`/api/version` unreachable or unusable) are decided and recorded, not defaulted: both render `Task Notes` with no version segment, and never the word `unknown`. (Added from the tracker comment.)

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 is rewritten to the backend source (the comment overrides the description). The footer fetches `GET /api/version` through a new client module `frontend/src/api/version.ts`, and the `package.json` import is removed from `AppFooter.tsx`. **The endpoint already exists on main:** TEST-05 (a dependency of this item, done) shipped `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py`, registered in `backend/app/main.py`, returning `{"version": "<backend/pyproject.toml [project].version>"}` from installed package metadata, with integration tests in `backend/tests/integration/test_version_integration.py`. CORS already allows `GET` from `http://localhost:5183`. So no endpoint is added; this plan consumes the existing one.
- Comment (tracker), consequence 1: "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: recorded as criterion 5. **Decision:** loading state renders exactly `Task Notes` (the app name, no version segment); failure state renders exactly `Task Notes` as well. The footer is never blank (the app name is always there) and never reads `unknown`, `undefined` or `null`. Failure covers: network error / backend down, a non-2xx response, a body without a non-empty string `version`, and the backend's own sentinel: `version_service.py` answers `{"version": "unknown"}` when its distribution metadata is missing, and the client treats that value as "not resolved" rather than displaying it. Reason: ticket criterion 3 already says an unresolvable version means rendering without it, and `unknown` is a version string only in form; showing `Task Notes vunknown` would tell a reader nothing they can act on while looking like data. No retry, no timeout: a hanging request simply stays in the loading state, which looks identical to the failure state (the fetch timeout is CHORE-02's scope in `feature_map.md`, not this item's).
- Comment (tracker), consequence 2: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in Plan Overview. The item is **no longer frontend-only in its dependency**: it now relies on the backend at runtime. It is still **frontend-only in its diff**: because TEST-05 already shipped `GET /api/version`, this plan changes no backend file, and the Backend Plan says so. The runtime coupling is new and is what the E2E specs exercise (the CI E2E job already runs the full compose stack, backend included).
- Assumption (no comment asked, recorded instead of blocking): the ticket note says the item "modifies `LandingPage.tsx`". It does not: `AppFooter` owns its own fetch, so `frontend/src/components/LandingPage.tsx` is untouched and only its test file changes (its footer assertion imports `package.json`'s version today). This removes the predicted `LandingPage.tsx` overlap with BUG-04; see `shared_risks.md`.
- Assumption: TEST-04's E2E spec and UAT artifacts assert the footer shows `frontend/package.json`'s version (`0.0.0`). After this change the footer shows the backend's (`0.1.0` at plan base), so those assertions become false and the TEST-04 spec would fail CI. They are updated to the backend source; this is a consequence of the comment, not new scope.

## Plan Overview
Make the existing landing-page footer (`AppFooter`, from TEST-04) show the **backend's** version, fetched at runtime from the already existing `GET /api/version` (TEST-05), instead of the frontend `package.json` version it imports today.

- **Frontend (Phase A):** a new API client module `frontend/src/api/version.ts` (same shape as `frontend/src/api/notes.ts`: `VITE_API_BASE_URL` with the `http://localhost:8010` default, throw on non-OK) exporting `fetchBackendVersion()`. `AppFooter` calls it once on mount, holds `version: string | null` in state, and renders `Task Notes` plus a ` v{version}` segment only when a version resolved. Unit tests for the client and the component; `LandingPage.test.tsx` mocks the new client instead of reading `package.json`.
- **Backend:** no change. The endpoint, schema, service, router registration and CORS all exist from TEST-05 and TEST-03. This item now depends on the backend at runtime, which it did not before (see Re-Plan Feedback).
- **E2E (Phase D):** a new spec for this item, plus updating TEST-04's spec whose `package.json` assertion this change makes false; a tiny shared helper reads the backend version from `backend/pyproject.toml`.
- **UAT (Phase G):** this item's Gherkin and manual script, and TEST-04's two UAT artifacts brought in line with the new source.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (new): `export async function fetchBackendVersion(): Promise<string | null>`. Calls `fetch(`${API_BASE_URL}/api/version`)` with `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"` (identical resolution to `notes.ts`, so one deployment-dependent value has one source of configuration, `coding_standards.md` Section 5). Throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response; throws `Error("Loading the version failed: unexpected response")` when the body has no non-empty string `version`. Returns `null` when `version === "unknown"` (the backend's sentinel, `UNKNOWN_VERSION` in `backend/app/services/version_service.py`), with a comment naming that file as the reason. Otherwise returns the string. Network errors propagate as the fetch rejection.
  - `frontend/src/components/AppFooter.tsx` (modify): remove `import { version } from "../../package.json"`. Add `useState<string | null>(null)` and a mount `useEffect` that calls `fetchBackendVersion()`, sets the state on resolve, leaves it `null` on reject (`.catch` with a comment saying why the failure is silent: criterion 3/5), and guards against setting state after unmount with an `isMounted` flag (the pattern `LandingPage.tsx` already uses). Render: `<footer data-testid="app-footer" style={footerStyle}>{APP_NAME}{version !== null && <span data-testid="app-version"> v{version}</span>}</footer>`, so the resolved text is `Task Notes v0.1.0` and the loading/failure text is exactly `Task Notes` with no trailing space. `footerStyle`, `APP_NAME`, the `<footer>` element (contentinfo landmark) and `data-testid="app-footer"` stay unchanged.
  - `frontend/src/components/LandingPage.tsx`: **not modified.**
- Routes: none.
- State management: local component state in `AppFooter` (`useState` + `useEffect`), no context or store; the version is read once per page load.
- Design reference notes: AI freestyle (Design Reference mode NONE). No visual change: the footer keeps TEST-04's existing `footerStyle` (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`); the version `<span>` inherits it and adds no style.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`), answers 200 with the backend's version without a database, and is covered by `backend/tests/integration/test_version_integration.py` and `backend/tests/unit/test_version_service_unit.py`. `backend/app/core/config.py` already allows the `http://localhost:5183` origin, and `create_app()` already allows `GET`. The item's new dependency on the backend is a runtime one, not a code change.

## API Integration Plan
No external API integration. (The footer consumes this project's own backend, through a dedicated client module per `coding_standards.md` Section 4's client-layer rule.)

## API Contract
- Method: GET
- URL: `/api/version` (on `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no query parameters.
- Response: `200 OK`, `{"version": "0.1.0"}` (the value is `backend/pyproject.toml` → `[project].version` at plan base). The backend answers `{"version": "unknown"}` when its package metadata is not installed; the client maps that to `null` (not resolved).
- Client contract (`fetchBackendVersion`): resolves to the version string; resolves to `null` for `"unknown"`; rejects on network error, non-OK status, or a body without a non-empty string `version`. `AppFooter` treats `null` and rejection identically: no version segment.

## Technology Selection
- Version fetch (`frontend/src/api/version.ts`): chose the browser's native `fetch` in a small client module, mirroring `frontend/src/api/notes.ts`, over adding a data-fetching library (React Query, SWR, axios); one GET on mount needs none of them.
- Footer loading/failure state: chose React's built-in `useState`/`useEffect` over a state library or Suspense data layer; it is one nullable string.
- E2E backend-version reader (`e2e/helpers/backendVersion.ts`): chose Node's standard `node:fs` plus one regular expression over the `[project]` table of `backend/pyproject.toml` over adding a TOML parser dependency to the root `package.json`; one known key in one known file does not justify a dependency.
- No new dependency is added anywhere, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/version.ts: client for `GET /api/version`, returns the backend version, `null` for the backend's `unknown` sentinel, throws on failure.
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the client (fetch stubbed), happy path, sentinel, non-OK, malformed body, `VITE_API_BASE_URL` override.
- [D] e2e/helpers/backendVersion.ts: reads `[project].version` from `backend/pyproject.toml` for the E2E specs' expected value.
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: footer shows the backend version; footer shows exactly `Task Notes` when `/api/version` fails.
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case.
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from this plan's Manual verification plan.
- [G] .claude/artifacts/TEST-08/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3).

### Modified files
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the backend version on mount; render the version segment only when resolved.
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert present, absent (rejected and `null`) and loading paths; drop the `package.json` import.
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of `package.json`'s.
- [D] e2e/tests/TEST-04_page_footer.spec.ts: expected footer version now comes from `e2e/helpers/backendVersion.ts` instead of `frontend/package.json`.
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the step naming `frontend/package.json` as the version source names `backend/pyproject.toml` / `GET /api/version` instead.
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare the footer to the backend version instead of `frontend/package.json`.

No dependency is added or changed, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure (the E2E helper directory already exists).

## Testing Strategy
- Unit tests: Vitest, frontend only. `frontend/src/api/version.test.ts` (client, `fetch` stubbed with `vi.stubGlobal` as in `notes.test.ts`): resolves the version from `http://localhost:8010/api/version`; resolves `null` for `{"version": "unknown"}`; rejects on a 503; rejects on `{}` and on `{"version": ""}`; uses `VITE_API_BASE_URL` when set. `frontend/src/components/AppFooter.test.tsx` (client mocked with `vi.mock("../api/version")`): present path (mock resolves `9.9.9`, footer text becomes `Task Notes v9.9.9`; a value that is neither package's proves the footer displays what the client returned); absent path on rejection (footer text exactly `Task Notes`, no `app-version` element, text contains neither `undefined`, `null` nor `unknown`); absent path on `null`; loading path (never-settling promise, footer text exactly `Task Notes`); `fetchBackendVersion` called once; landmark and test id unchanged. `LandingPage.test.tsx`: footer shows the mocked version.
  - Directory: co-located `*.test.ts(x)` under `frontend/src/` (the frontend's existing convention; `CLAUDE.md`'s unit directory `backend/tests/unit/` is the backend's).
  - Naming: `{module}.test.ts(x)`, matching the existing frontend tests.
- Integration tests: no new integration tests. The only endpoint involved already exists and is covered by `backend/tests/integration/test_version_integration.py`; this item adds no router, repository or migration (`testing_standards.md` Section 6).
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: `e2e/tests/TEST-08_footer_app_version.spec.ts` against the running stack. (1) Load `/`, footer `app-footer` contains `Task Notes v{backend version}` where the expected value comes from `e2e/helpers/backendVersion.ts`. (2) Edge: `page.route` aborts the `/api/version` request, load `/`, footer text is exactly `Task Notes` and `app-version` is absent. The route matcher must compare `new URL(url).pathname === "/api/version"` exactly: Vite serves the module `src/api/version.ts` from a URL that contains the substring `/api/version`, the same trap `TEST-03_simple_note_form.spec.ts` documents for notes, and a substring or glob matcher would abort the module and break the page instead. Wait for the footer with Playwright's auto-waiting `expect(...).toHaveText(...)`, never a fixed timeout. `e2e/tests/TEST-04_page_footer.spec.ts` updated to the backend version.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the backend-down edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from the backend's `GET /api/version` at runtime, never typed into the component or read from `package.json` | Unit | Verifying the source needs no navigation or interaction: the client test asserts the URL fetched, and the component test asserts the footer shows what the client returned (`9.9.9`, a value no package carries). E2E spec 1 also exercises the live wiring incidentally. |
| 3 | When the version cannot be resolved, the footer renders without it (no `undefined`, `null` or empty gap) | Unit | It is a render rule of one component given a failed client call, checkable by mocking the client; no navigation needed. The E2E edge spec (2) also covers it, as the feature's required edge case. |
| 4 | A component test asserts both paths: version present, and version absent | Unit | The criterion is itself a component test; it is satisfied by `AppFooter.test.tsx` existing and passing. |
| 5 | Loading and failure states are decided and recorded: both render `Task Notes` only, never `unknown` | Unit | Both states are component render rules given a pending or failed/`null` client result; a mocked client reaches them deterministically, while the browser cannot hold the loading state without timing. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version string | Load `/`, expect `app-footer` to contain `Task Notes v{backendVersion()}` | Given the stack is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the backend's version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports version 0.1.0 and frontend/package.json says 0.0.0, When I open the landing page, Then the footer shows 0.1.0 |
| 3 | Unresolvable version renders without it | Edge spec: abort exact-path `/api/version`, expect footer text exactly `Task Notes` | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend unit suite, When I run the AppFooter tests, Then they pass with 0 failed |
| 5 | Loading and failure states recorded | covered at Unit, see Criterion coverage | Given the version request has not answered yet, When the footer renders, Then it reads "Task Notes" and never "unknown" |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repository root with `docker compose up -d --build` (frontend on http://localhost:5183, backend on http://localhost:8010); `backend/pyproject.toml` → `[project].version` is `0.1.0` (its value at plan base; use whatever it reads now).
1. Open http://localhost:8010/api/version in the browser → the page shows `{"version":"0.1.0"}`.
2. Open http://localhost:5183/ → the landing page shows the `Task Notes` heading, the note form and the note list.
3. Scroll to the bottom of the page and read the footer → it reads `Task Notes v0.1.0`, the same version as step 1.

### Criterion 2: The version comes from the backend's GET /api/version at runtime
Prerequisites: as Criterion 1; open `frontend/package.json` and note its `version` field (`0.0.0` at plan base, deliberately different from the backend's `0.1.0`).
1. Open http://localhost:5183/ with the browser DevTools Network tab open, filter on `version` → a request to `http://localhost:8010/api/version` is listed with status `200` and response `{"version":"0.1.0"}`.
2. Read the footer → it reads `Task Notes v0.1.0`, the backend's value, and does **not** read `Task Notes v0.0.0` (the frontend's own `package.json` value).
3. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no import of `package.json`; the version comes from `fetchBackendVersion` in `frontend/src/api/version.ts`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as Criterion 1.
1. From the repository root run `docker compose stop backend` → the command reports the backend container stopped.
2. Open http://localhost:8010/api/version → the browser cannot connect.
3. Reload http://localhost:5183/ and read the footer → it reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, and no trailing gap after the name.
4. Run `docker compose start backend`, wait until http://localhost:8010/api/version answers `{"version":"0.1.0"}`, then reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run reports `0 failed`, and the test list includes a test for the present path and a test for the absent path.
2. Open `frontend/src/components/AppFooter.test.tsx` → one test mocks the client to resolve a version and asserts it is shown; another mocks it to reject (and one to resolve `null`) and asserts the footer text is exactly `Task Notes`.

### Criterion 5: Loading and failure states are decided and recorded
Prerequisites: as Criterion 1, Chrome or Edge DevTools available.
1. Open http://localhost:5183/ with DevTools open, Network tab → right-click the `version` request and choose "Block request URL", then reload → the footer reads exactly `Task Notes` (failure state), never `Task Notes unknown` or a blank footer.
2. Remove the block, set the Network throttling to "Slow 3G" and reload while watching the footer → before the version request completes the footer reads `Task Notes` (loading state); once it completes it reads `Task Notes v0.1.0`.
3. The loading state is also asserted deterministically: run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → `0 failed`, including the test with a never-settling client call that expects exactly `Task Notes`.
