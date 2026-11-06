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
>
> (ClickUp task 123k99ctgch. Amended by the newest tracker comment, recorded under Re-Plan Feedback: the version comes from the backend at runtime through GET /api/version, not from `package.json`.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. Per the tracker correction, that source is the backend's version, read at runtime from `GET /api/version`; `frontend/package.json` is no longer the source and the footer no longer imports it.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (tracker comment) A frontend running against a backend whose version differs from the frontend's own package version shows the backend's version.
- [ ] 6. (tracker comment) The footer's loading state (before `GET /api/version` resolves) and its failure state (`/api/version` unreachable or unusable) are decided and recorded: both render the app name `Task Notes` alone, with no version text, no placeholder, no `unknown`, and no trailing space.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by, point by point:
  (a) Version source: criterion 2 is rewritten to the backend's runtime version, and criterion 5 added. `AppFooter.tsx` drops its `package.json` import and reads the version through a new client `frontend/src/api/version.ts`.
  (b) "Add a GET /api/version endpoint": not added, because it already exists on the plan base bb5fc2a. TEST-05 shipped `backend/app/routers/version.py` (registered in `backend/app/main.py`), which returns `{"version": ...}` from the installed `task-notes-backend` distribution metadata (backend/pyproject.toml `[project].version`, currently `0.1.0`) and falls back to the sentinel `unknown`. It is covered by `backend/tests/integration/test_version_integration.py` and `backend/tests/unit/test_version_service_unit.py`. Adding it again would duplicate a live route.
  (c) The backend change: stated explicitly, as asked. The comment expected this item to grow a backend change; on the code as it stands it does not need one, so the Backend Plan below reads "No backend changes required" and no backend file appears in the File Manifest. The item's real cross-layer effect is a runtime dependency: the footer now needs the backend running, which the E2E stack (docker compose) and the dev stack already provide, since the notes list depends on it too.
  (d) Loading and failure states, decided: before the fetch resolves, the footer reads `Task Notes` alone. If the fetch fails (network error, non-2xx status, a body without a non-empty string `version`), or the backend reports its own sentinel `unknown`, the footer also reads `Task Notes` alone. It never shows `unknown`, a spinner, an ellipsis, `undefined`, `null`, or a trailing `v`/space. Chosen over a footer reading `unknown` because the original criterion 3 asks for "renders without it", and because the backend's `unknown` means the same thing as unreachable: the reader cannot tell the version. Assumption recorded: the footer does not retry and has no timeout of its own. A hanging request leaves the loading rendering in place, which is the same text as failure.
- Concurrency note (from the dispatch, not a comment): TEST-09 is being planned in parallel and, on its earlier reverted attempt (dfc21f7), added a `commit` field to the same `GET /api/version` response. That change is additive. This plan's client reads only `version` and ignores any other field, so TEST-09 can merge before or after this item. Showing the commit is not in this item's scope (`docs/DEVELOPMENT.md` line 671's commit sentence belongs to a later item, TEST-10, which depends on TEST-08).

## Plan Overview
A frontend-only change on top of an existing backend endpoint. A new API client module `frontend/src/api/version.ts` calls `GET {API_BASE_URL}/api/version` and returns the backend's version, or `null` when the backend answers but has no usable version. `AppFooter` fetches it once on mount and renders `Task Notes` followed by ` v{version}` only once a usable version has arrived. The API base URL that `notes.ts` declares today moves into one shared module `frontend/src/api/config.ts` so the two clients share one source (`coding_standards.md` Section 5: one value, one source). `LandingPage.tsx` is not modified: the fetch lives inside `AppFooter`, which keeps this item off the file BUG-04 edits. The existing TEST-04 E2E spec and UAT artifacts, which assert the frontend `package.json` version (`0.0.0`), are updated to the backend's version (`0.1.0`), because they would otherwise fail or state something false.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/config.ts` (new): exports `API_BASE_URL`, resolved from `import.meta.env.VITE_API_BASE_URL` with the existing default `http://localhost:8010`. The declaration moves here unchanged from `notes.ts`.
  - `frontend/src/api/notes.ts` (modify): imports `API_BASE_URL` from `./config` instead of declaring it. Behaviour unchanged.
  - `frontend/src/api/version.ts` (new): `export async function fetchBackendVersion(): Promise<string | null>`. Calls `fetch(`${API_BASE_URL}/api/version`)`. A non-OK response throws `Error("Loading the version failed: {status} {statusText}")`, matching notes.ts's error shape. A network rejection propagates. On 200, the response is read as `unknown`. It returns the `version` value only when that value is a string that is non-empty after trimming and not equal to `unknown` (the backend's sentinel, named as a constant `BACKEND_UNKNOWN_VERSION` with a comment pointing at `backend/app/services/version_service.py`). Otherwise it returns `null`. Any other field in the body, such as TEST-09's `commit`, is ignored. Typed response: `type VersionResponse = { version: string }`, and the client narrows the parsed body rather than casting.
  - `frontend/src/components/AppFooter.tsx` (modify): remove `import { version } from "../../package.json"`. Add `useState<string | null>(null)` and a mount-only `useEffect` that calls `fetchBackendVersion()`, sets the result on resolve, and leaves `null` on rejection, with the same `isMounted` guard `LandingPage.tsx` uses. Render `<footer data-testid="app-footer" style={footerStyle}>{APP_NAME}{version !== null && <span data-testid="app-version"> v{version}</span>}</footer>`. With no version, the footer's text content is exactly `Task Notes`: no space, no `v`. `footerStyle`, `APP_NAME`, the `contentinfo` landmark and the `app-footer` test id stay as they are.
- Routes: none.
- State management: local component state in `AppFooter` (one `string | null`). Loading and failure share the `null` state and render identically, per Re-Plan Feedback (d).
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required. `GET /api/version` already exists on the plan base (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`) and returns the backend's own version at runtime. CORS already allows the frontend origin `http://localhost:5183` for GET. Stated explicitly because the tracker comment expected this item to add a backend change (Re-Plan Feedback (b) and (c)).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on the backend at `API_BASE_URL`, default `http://localhost:8010`)
- Request: none
- Response: 200, `{"version": "0.1.0"}`. The backend returns `{"version": "unknown"}` when its distribution metadata is missing. TEST-09 may add `"commit": "<12 chars>"`, which this client ignores.
- Client result: the version string; `null` for `unknown`, an empty or whitespace-only string, or a missing or non-string `version`; a thrown error for a non-2xx status or a network failure.

## Technology Selection
- Version client (`frontend/src/api/version.ts`): chose the platform `fetch` already used by `notes.ts` over a new HTTP library (axios, ky), because `fetch` covers one GET with no new dependency.
- Footer data loading: chose React's built-in `useState` and `useEffect`, already used by `LandingPage.tsx`, over a data-fetching library (React Query, SWR), because one request on mount needs no cache or retry layer.
- Shared base URL (`frontend/src/api/config.ts`): no stdlib call, native platform feature or installed dependency covers it. It is the existing `notes.ts` declaration moved, not new logic.
- E2E backend-version helper (`e2e/helpers/backendVersion.ts`): chose Node's standard `node:fs` plus a regular expression over the first `version = "..."` line of `backend/pyproject.toml`, the pattern TEST-04's spec already uses for `package.json`, over adding a TOML parser dependency.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/config.ts: the single declaration of `API_BASE_URL` (env `VITE_API_BASE_URL`, default `http://localhost:8010`), shared by the notes and version clients
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`, with the null and throw rules from the API Contract
- [A] frontend/src/api/version.test.ts: unit tests for the version client with `fetch` stubbed
- [D] e2e/helpers/backendVersion.ts: reads the backend's declared version from `backend/pyproject.toml` for the E2E specs
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs for criterion 1 and the unreachable-backend edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./config` instead of declaring it. No behaviour change.
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import, fetch the backend version on mount, and render ` v{version}` in an `app-version` span only when it resolved
- [A] frontend/src/components/AppFooter.test.tsx: replace the `package.json` assertion with the present, loading, failed and null paths, with `../api/version` mocked
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version`. The footer test asserts the mocked backend version instead of the `package.json` import.
- [D] e2e/tests/TEST-04_page_footer.spec.ts: expect the backend's version from the helper instead of `frontend/package.json`'s
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the step "that version number matches the version field of frontend/package.json" now names the backend's version (`GET /api/version`)
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare against `backend/pyproject.toml` / `GET /api/version` instead of `frontend/package.json`

No lockfile changes: the plan adds no dependency.
README.md and docs/DEVELOPMENT.md need no edit. This item changes no project structure, run configuration, dependency or test infrastructure, and `docs/DEVELOPMENT.md` line 671 already describes the footer reading `GET /api/version` with the loading and failure behaviour decided here. Its commit sentence belongs to TEST-10 and is left alone.

## Testing Strategy
- Unit tests: the version client (`version.test.ts`): returns the version from the default URL `http://localhost:8010/api/version`; ignores an extra `commit` field; returns `null` for `unknown`, for `""` and whitespace, and for a missing or non-string `version`; throws `Loading the version failed: 503 Service Unavailable` on a non-OK response; rejects when `fetch` rejects; uses `VITE_API_BASE_URL` when configured (`vi.stubEnv` plus `vi.resetModules`, as `notes.test.ts` does). The component (`AppFooter.test.tsx`, with `fetchBackendVersion` mocked): resolved `9.9.9` renders `Task Notes v9.9.9` (a value deliberately unlike `package.json`'s `0.0.0`); while the promise is pending, the footer's `textContent` is exactly `Task Notes` and `app-version` is absent; on rejection and on a resolved `null`, `textContent` is exactly `Task Notes` and contains none of `undefined`, `null` or `unknown`; the client is called once; the `contentinfo` landmark and `app-footer` test id are kept. `notes.test.ts` must still pass unchanged after the base-URL move.
  - Directory: frontend component and client tests live beside their source under `frontend/src/` (existing convention: `*.test.ts(x)`, run by `npm --prefix frontend test`). The backend unit directory `backend/tests/unit/` is not touched.
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, matching the existing frontend tests
- Integration tests: none new. This item changes no router, service or repository. `GET /api/version`'s existing coverage in `backend/tests/integration/test_version_integration.py` already asserts the 200 `{"version": <pyproject version>}` cycle the footer consumes.
  - Directory: backend/tests/integration/
- E2E tests: footer on the real stack shows the backend's version (`Task Notes v0.1.0`, read from `backend/pyproject.toml` by the helper, deliberately different from the frontend's `0.0.0`); edge case: with `page.route("**/api/version", (route) => route.abort())` registered before `page.goto("/")`, the `app-footer` element has exact text `Task Notes` and `app-version` has count 0. Locators: `getByTestId`. No fixed waits. TEST-04's spec is updated to the same version source.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion (1 to 6) plus the unreachable-backend edge scenario, without repeating the E2E interaction assertions
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source, the backend's `GET /api/version` at runtime, never typed into the component | Unit | Verifying it needs no navigation or interaction. It is wiring: the client unit test asserts the request URL and the component test asserts the footer renders exactly what the client returns. The removed `package.json` import is checked in review against the diff. |
| 3 | When the version cannot be resolved, the footer renders without it (no `undefined`, `null` or empty gap) | Unit | Verifying it needs no navigation or interaction. It is a render rule over a mocked client rejection or `null`, asserted on exact `textContent`. The E2E edge-case spec repeats it once in the browser as the feature's required edge spec. |
| 4 | A component test asserts both paths: version present, and version absent | Unit | The criterion is itself a component-test requirement, satisfied by `AppFooter.test.tsx` |
| 5 | A frontend against a backend of a different version shows the backend's version | Unit | Verifying it needs no navigation or interaction. The component test resolves `9.9.9` against a `package.json` of `0.0.0`. Criterion 1's E2E incidentally shows it on the real stack (backend `0.1.0`, frontend `0.0.0`). |
| 6 | Loading and failure states render `Task Notes` alone | Unit | Verifying it needs no navigation or interaction. Pending and rejected promises are only controllable deterministically with the client mocked. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `goto("/")`; `getByTestId("app-footer")` contains `Task Notes v{backendVersion}`, with `backendVersion` from `e2e/helpers/backendVersion.ts` | Given the stack is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the backend's version |
| 2 | Version comes from the backend's `GET /api/version` | covered at Unit, see Criterion coverage | Given the backend reports version X, When I open the landing page, Then the footer shows X and not the frontend package version |
| 3 | Footer renders without an unresolvable version | covered at Unit, see Criterion coverage; the browser edge spec aborts `/api/version` and expects exact text `Task Notes` | Given the backend is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test covers present and absent | covered at Unit, see Criterion coverage | Given the frontend test suite, When it runs, Then the AppFooter tests for present and absent versions pass |
| 5 | Backend version wins over the frontend's own | covered at Unit, see Criterion coverage | Given frontend 0.0.0 and backend 0.1.0, When I open the landing page, Then the footer shows 0.1.0 |
| 6 | Loading and failure render `Task Notes` alone | covered at Unit, see Criterion coverage | Given the version request has not answered, When I look at the footer, Then it reads "Task Notes" with nothing after it |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is up from the repository root with `docker compose up -d --build` (frontend http://localhost:5183, backend http://localhost:8010). `backend/pyproject.toml` declares `version = "0.1.0"`.
1. Open http://localhost:5183/ in a browser → the landing page shows the "Task Notes" heading, the note form and a footer at the bottom.
2. Read the footer → it reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend's GET /api/version, never typed into the component
Prerequisites: the stack is up as for Criterion 1.
1. Open http://localhost:8010/api/version in a browser tab → the JSON shows `"version":"0.1.0"` (a `commit` field may also be present if TEST-09 has merged).
2. Open http://localhost:5183/ with DevTools → Network open, then reload → one request to `http://localhost:8010/api/version` with status 200, and the footer shows the same `0.1.0`.
3. Open `frontend/src/components/AppFooter.tsx` → it contains no `package.json` import and no version literal such as `0.1.0`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack is up as for Criterion 1.
1. Run `docker compose stop backend` from the repository root → the command reports the backend container stopped.
2. Reload http://localhost:5183/ → the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no gap after it.
3. Run `docker compose start backend`, wait until http://localhost:8010/api/version answers, then reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test` from the repository root → the run includes `src/components/AppFooter.test.tsx` and `src/api/version.test.ts`, with tests for a present version and for an absent version (pending, rejected, `null`), and reports 0 failed.

### Criterion 5: A frontend against a backend of a different version shows the backend's version
Prerequisites: the stack is up as for Criterion 1. `frontend/package.json` declares `"version": "0.0.0"` and `backend/pyproject.toml` declares `0.1.0`.
1. Open http://localhost:5183/ → the footer reads `Task Notes v0.1.0`, the backend's version, and not `v0.0.0`.

### Criterion 6: Loading and failure states render "Task Notes" alone
Prerequisites: the stack is up as for Criterion 1, in Chrome.
1. Open http://localhost:5183/ with DevTools → Network, right-click any request → "Block request URL", and enter `http://localhost:8010/api/version` as the blocked URL; reload → the footer reads exactly `Task Notes` (failure state).
2. Remove the block, set Network throttling to "Slow 3G", and reload while watching the footer → before the version request completes, the footer reads `Task Notes` with nothing after it. Once the request completes, it changes to `Task Notes v0.1.0` (loading state, then resolved).
3. Set throttling back to "No throttling".
