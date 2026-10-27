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
> (ClickUp task 123k99ctgch, https://app.clickup.com/t/123k99ctgch. The tracker comment recorded under Re-Plan Feedback overrides criterion 2 and the "frontend only" note.)

## Acceptance Criteria
<!-- Criterion 2 is stated as amended by the tracker comment (newest-first, comment overrides description). -->
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, which is the backend at runtime: the footer fetches `GET /api/version` and shows the backend's version, never the frontend's `package.json` version and never a string typed into the component. A frontend built against an older backend shows the backend's version.
- [ ] 3. When the version cannot be resolved (request pending, request failed, or the backend reports no usable version), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...]" → Addressed by: criterion 2 is rewritten to the backend-at-runtime source and overrides the description's "frontend package metadata or a build-time variable". `AppFooter.tsx` drops its `package.json` import and fetches `GET /api/version` through a new client module `frontend/src/api/version.ts`. **The endpoint the comment asks to add already exists on main**: `backend/app/routers/version.py` (TEST-05, a declared dependency of this item, merged) serves `GET /api/version` returning `{"version": "<backend/pyproject.toml [project].version>"}` via `importlib.metadata`, registered in `backend/app/main.py`, with integration tests in `backend/tests/integration/test_version_integration.py`. The plan therefore reuses it and adds no second endpoint; adding one would be the invented-endpoint defect `review_standards.md` Section 3 names.
- Comment (tracker), consequence 1: "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: **decision, recorded here and in the Frontend Plan: neither blank nor `unknown`.** In every unresolved state the footer renders the application name alone, exactly `Task Notes`, with no `v`, no placeholder and no trailing space; the version segment ` v{version}` is appended only once a usable version arrives. Unresolved covers: (a) loading, before the fetch settles; (b) failure, a network error or a non-2xx response; (c) a 2xx body whose `version` is missing, not a string, empty or whitespace, or equal to the backend's sentinel `unknown` (`backend/app/services/version_service.py` returns `"unknown"` when package metadata is absent). Reasoning: a blank footer removes the landmark and the app name, which TEST-04 established and its E2E spec asserts; `unknown` is the "showing a non-answer" case criterion 3 forbids in spirit. No loading text is shown, so there is no layout change when the version arrives except the appended segment. A request that never settles (no timeout is added, see Plan Overview) leaves the footer in the same name-only state as a failure.
- Comment (tracker), consequence 2: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated explicitly. **This item is no longer frontend-only in behaviour: it now depends at runtime on the backend's `GET /api/version`.** It is still frontend-only in its diff, because that backend change already merged with TEST-05; the File Manifest therefore carries no `[B]` entry and the Backend Plan says "No backend changes required" with this reason. The runtime dependency is real: a footer version now needs the backend up and the browser origin in the backend's CORS list (`backend/app/core/config.py` already defaults `CORS_ORIGINS` to `http://localhost:5183` and allows `GET`). The description's claim of being "genuinely parallel with TEST-07" holds only for the diff, not for runtime.
- Comment (tracker), assumption made: the comment does not say how to treat the backend's `unknown` sentinel. → Assumed it counts as "cannot be resolved" under criterion 3 and is hidden, rather than changing the backend to return `null`, which would break TEST-05's merged contract and tests for a frontend concern.
- Description note "It modifies `LandingPage.tsx`" → not acted on as written: the fetch lives inside `AppFooter.tsx`, so `LandingPage.tsx` is not modified. Only its test file changes (its footer assertion imports the frontend `package.json` version, which becomes false). This also narrows the overlap with BUG-04 flagged by ingestion (see `shared_risks.md`).

## Plan Overview
Frontend-only diff, backend-dependent behaviour. Add a typed client `frontend/src/api/version.ts` that calls the existing `GET /api/version` and resolves to a usable version string or `null`. `AppFooter.tsx` stops importing `frontend/package.json`, holds `version: string | null` in `useState(null)`, fetches once on mount in `useEffect` (with the same unmount guard `LandingPage.tsx` uses), and renders `Task Notes` plus ` v{version}` only when the version is resolved. The API base URL resolution currently private to `frontend/src/api/notes.ts` is moved into `frontend/src/api/baseUrl.ts` and imported by both clients, so the `VITE_API_BASE_URL` default (`http://localhost:8010`) has one source (`coding_standards.md` Section 5, "One value, one source"). Tests that asserted the frontend `package.json` version (two component tests and the TEST-04 E2E spec) are updated, because that assertion becomes false by design. No fetch timeout and no retry are added: neither is in the criteria, and a hanging request already degrades to the name-only footer.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of defining it; no behaviour change. `notes.test.ts` keeps passing unchanged, including its `vi.resetModules()` env-override test, because `baseUrl.ts` is re-evaluated on re-import.
  - `frontend/src/api/version.ts` (new): `export async function fetchBackendVersion(): Promise<string | null>`. Calls `fetch(`${API_BASE_URL}/api/version`)`. Non-OK response throws `Error("Loading the version failed: {status} {statusText}")` (same shape as `notes.ts`); a network error propagates. On 2xx, parses JSON and returns `body.version.trim()` when it is a non-empty string other than the backend sentinel `"unknown"` (constant `BACKEND_UNKNOWN_VERSION`, commented as mirroring `UNKNOWN_VERSION` in `backend/app/services/version_service.py`), otherwise `null`. Response type `type VersionResponse = { version?: unknown }` so the shape is checked, not trusted.
  - `frontend/src/components/AppFooter.tsx` (modify): remove `import { version } from "../../package.json"`. Add `useState<string | null>(null)` and a mount `useEffect` calling `fetchBackendVersion()`, setting state on resolve, leaving it `null` on reject, guarded by an `isMounted` flag. Render `<footer data-testid="app-footer" style={footerStyle}>{APP_NAME}{version !== null && <span data-testid="app-footer-version"> v{version}</span>}</footer>`, so the unresolved text content is exactly `Task Notes` and the resolved one `Task Notes v0.1.0`.
  - `frontend/src/components/LandingPage.tsx`: not modified (see Re-Plan Feedback).
- Routes: none new (`/` only).
- State management: local `useState` in `AppFooter`; no context, no library.
- States (recorded per the tracker comment): loading = `Task Notes`; failure (network error, non-2xx) = `Task Notes`; unusable body (missing, non-string, empty, `unknown`) = `Task Notes`; resolved = `Task Notes v{backend version}`. The `app-footer-version` element exists only in the resolved state.
- Design reference notes: AI freestyle (Design Reference mode NONE). No style value changes: the footer keeps its existing `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`, and the version span inherits them with no style of its own.

## Backend Plan
No backend changes required. The backend half of this item, `GET /api/version` returning the backend's own version, already exists on main from TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`). This item depends on it at runtime, which is the behavioural change the tracker comment asked to have stated.

## API Integration Plan
No external API integration.

## API Contract
Consumed, not created (TEST-05's existing contract, read from `backend/app/routers/version.py` and `backend/app/schemas/version.py`):
- Method: GET
- URL: `/api/version` on `API_BASE_URL` (`VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0"}` (the value of `[project].version` in `backend/pyproject.toml`; `"unknown"` when package metadata is absent). `POST` answers 405.
- Frontend client: `fetchBackendVersion(): Promise<string | null>` in `frontend/src/api/version.ts`; resolves the version string, resolves `null` for an unusable body, rejects on network error or non-2xx.

## Technology Selection
- Version source: chose the existing backend endpoint `GET /api/version` (TEST-05, already installed and merged) over a build-time `package.json` import or a Vite `define` variable, because the tracker comment requires the backend's runtime version and a build-time value cannot report it.
- `frontend/src/api/version.ts` (HTTP client): chose the browser's native `fetch` over adding axios or a query library (react-query, SWR), because one GET on mount needs no caching, retries or dedupe; no new dependency.
- Fetch-on-mount in `AppFooter.tsx`: chose React's built-in `useState` and `useEffect` (installed `react`) over a custom hook or a data-fetching library, because the logic has one caller and `coding_standards` Section 3.3 reserves custom hooks for reusable logic.
- `frontend/src/api/baseUrl.ts`: chose `import.meta.env` (native Vite feature, already used by `notes.ts`) over a config library; no stdlib or platform alternative is needed beyond that, it is the existing two lines moved.
- Response validation: chose a `typeof` check in a few lines over adding zod or another schema library, because the body has one string field.
- Tests: chose the installed Vitest, Testing Library and Playwright, with Vitest's `vi.mock` and Playwright's `page.route` for the failure path, over any new test dependency.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of the API base URL (`VITE_API_BASE_URL` with its documented default), moved from `notes.ts`
- [A] frontend/src/api/version.ts: typed client for `GET /api/version`, returning the usable backend version or `null`
- [A] frontend/src/api/version.test.ts: unit tests for the client with `fetch` stubbed (usable version, `unknown` sentinel, empty and missing field, non-OK throw, URL built from the base URL)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs for the footer showing the backend version, plus the edge case where `/api/version` is aborted and the footer reads exactly `Task Notes`
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import, fetch the backend version on mount, render the version segment only when resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert the resolved path (`Task Notes v9.9.9`, `app-footer-version` present), the absent paths (rejected fetch and `null` resolution render exactly `Task Notes`, no `app-footer-version`, no `undefined`/`null`/`unknown` text), the loading path (pending promise renders `Task Notes`), and the existing landmark test
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and replace the `package.json` version assertion with the mocked backend version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: remove the assertions that the footer contains the frontend `package.json` version (now false by design); keep the app-name, landmark, heading and mobile-visibility assertions

No dependency changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` edit: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: the version client (`frontend/src/api/version.test.ts`, `fetch` stubbed as in `notes.test.ts`) and the footer component (`AppFooter.test.tsx`, client mocked) in all four states; `LandingPage.test.tsx` updated to the mocked backend version. Backend unit tests unchanged.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (the project's existing Vitest convention; `backend/tests/unit/` is unaffected)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`
- Integration tests: no new integration test: the only backend surface is TEST-05's existing endpoint, already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, answers without a database, 405 on POST).
  - Directory: backend/tests/integration/
- E2E tests: footer on `/` shows `Task Notes v{version}` where `{version}` is read from `backend/pyproject.toml` (0.1.0, deliberately different from the frontend `package.json` 0.0.0, so the spec proves the backend source); edge case: `page.route("**/api/version", (route) => route.abort())` then the footer has exact text `Task Notes` and no `app-footer-version`.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the backend-unreachable edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from the backend at runtime via `GET /api/version`, never `package.json` or a typed string | Unit | verifying it needs no navigation or interaction: the component test mocks the client with a value no file contains (`9.9.9`) and asserts it is rendered, and the client test asserts the request goes to `/api/version`; the E2E spec for criterion 1 additionally reads the expected value from `backend/pyproject.toml` |
| 3 | When the version cannot be resolved the footer renders without it, never `undefined`, `null`, `unknown` or a gap | Unit | verifying it needs no navigation or interaction: it is a render rule over three client outcomes (pending, rejected, `null`), each asserted as exact text `Task Notes` in the component test; the E2E edge-case spec repeats the rejected case in a browser |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component test; its existence and both assertions are verified by running `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")`, `getByTestId("app-footer")` has text `Task Notes v{backend pyproject version}` | Given the app and backend are running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend reports version 0.1.0 and the frontend package is 0.0.0, When I open the landing page, Then the footer shows 0.1.0 and not 0.0.0 |
| 3 | Unresolved version is omitted cleanly | covered at Unit, see Criterion coverage (browser repeat: abort `/api/version`, footer text exactly `Task Notes`) | Given the backend is stopped, When I open the landing page, Then the footer reads exactly "Task Notes" with no version, "undefined", "null" or "unknown" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run AppFooter.test.tsx, Then it reports 0 failed |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repo root with `docker compose up -d --build` (backend on http://localhost:8010, frontend on http://localhost:5183); `backend/pyproject.toml` has `version = "0.1.0"`.
1. Open http://localhost:5183/ in a browser → the landing page shows the heading "Task Notes" and the note form.
2. Scroll to the bottom of the page and read the footer → it reads exactly `Task Notes v0.1.0`.
3. Open DevTools, Elements tab, and inspect the footer → it is a `<footer data-testid="app-footer">` containing a `<span data-testid="app-footer-version">` with ` v0.1.0`.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: same stack as Criterion 1; `frontend/package.json` has `"version": "0.0.0"`.
1. Open http://localhost:5183/ with DevTools open on the Network tab, then reload → a GET request to `http://localhost:8010/api/version` appears with status 200 and response `{"version":"0.1.0"}`.
2. Read the footer → it shows `v0.1.0` (the backend's version), not `v0.0.0` (the frontend package's version).
3. In `backend/pyproject.toml` change `version = "0.1.0"` to `version = "0.1.1"`, run `docker compose up -d --build backend` (the frontend is not rebuilt), then reload http://localhost:5183/ → the footer reads `Task Notes v0.1.1`, proving a frontend built earlier shows the backend's current version.
4. Revert `backend/pyproject.toml` to `0.1.0` and run `docker compose up -d --build backend` → after a reload the footer reads `Task Notes v0.1.0` again.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: same stack as Criterion 1.
1. Run `docker compose stop backend`, then reload http://localhost:5183/ → the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap; in DevTools the footer has no `app-footer-version` span.
2. Run `docker compose start backend`, wait until http://localhost:8010/api/version answers in a browser tab, then reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0` again.
3. Loading state: in DevTools Network tab, right-click the `/api/version` request and choose "Block request URL", then reload → the footer reads exactly `Task Notes`. Unblock the URL and reload → `Task Notes v0.1.0`.

### Criterion 4: A component test asserts both paths
Prerequisites: `npm --prefix frontend install` has been run.
1. From the repo root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` → the output lists `src/components/AppFooter.test.tsx` and `src/api/version.test.ts` with 0 failed.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a test asserting the footer shows a mocked version and a test asserting the footer text is exactly `Task Notes` when the version is unavailable.
3. Run the full frontend suite with `npm --prefix frontend test` → 0 failed, including `src/components/LandingPage.test.tsx` and `src/api/notes.test.ts`.
