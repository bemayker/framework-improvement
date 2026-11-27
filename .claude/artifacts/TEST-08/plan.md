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

## Acceptance Criteria
Criterion 2 is restated per the newest tracker comment, which overrides the description where they disagree (see `## Re-Plan Feedback`). Criterion 5 is derived from the same comment, which asks for the loading state to be decided and recorded.
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source: the backend's own version, served at runtime by `GET /api/version` (whose value is `[project].version` in `backend/pyproject.toml`), never a string typed into the component and never the frontend's `package.json`. A frontend running against a backend of a different version shows the backend's version.
- [ ] 3. When the version cannot be resolved (request fails, backend unreachable, or backend reports its `unknown` sentinel), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (from tracker comment) Before the version request resolves, the footer shows the app name alone, with no placeholder text and no dangling `v`.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 restated; `AppFooter` drops its `package.json` import and fetches the version through a new client `frontend/src/api/version.ts`. **The endpoint already exists**: `GET /api/version` was delivered by TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`) and returns `{"version": "0.1.0"}` read from installed package metadata. TEST-05 is already a declared dependency of this item in `feature_map.md`. So the plan adds no backend file; see the next line.
- Comment (tracker): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Backend Plan`. The item now has a **runtime backend dependency** (the footer is only correct while `GET /api/version` exists with its current shape) but **no backend code change**, because TEST-05 already built the endpoint. The description's claim "touches no backend file" stays true for the diff; its claim "frontend only" is no longer true for behaviour. The File Manifest therefore lists no `[B]` entry, deliberately, and `## Backend Plan` says why.
- Comment (tracker): "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: decision recorded in `## Frontend Plan` → State management. **Loading:** the footer renders `Task Notes` alone (no `v`, no placeholder). **Failure** (network error, non-2xx, malformed body, or the backend's `unknown` sentinel): the footer renders `Task Notes` alone, identical to loading. Neither a blank footer nor `unknown` was chosen: a blank footer drops the app name TEST-04 delivered, and `unknown` is the exact noise criterion 3 forbids (it lists `undefined`, `null` and an empty gap; `unknown` is the same failure in different words). Cost of this choice, stated so it is not a surprise: a reader cannot tell "still loading" from "backend unreachable" by looking at the footer; the browser's network panel or `curl http://localhost:8010/api/version` answers that. Covered by criteria 3 and 5.
- Assumption (from the same comment): the backend's sentinel `"unknown"` (`UNKNOWN_VERSION` in `backend/app/services/version_service.py`, returned when package metadata is missing) is treated by the frontend client as "not resolved" and mapped to `null`. The literal is duplicated across Python and TypeScript because there is no shared contract file in this single-repo project; the client's test pins it. Changing the backend to return `null` instead was rejected: the comment did not ask for it, and it would make this item edit TEST-05's files after all.

## Plan Overview
Replace the build-time version in the landing-page footer with the backend's runtime version. A new API client `frontend/src/api/version.ts` calls the existing `GET /api/version` and returns the version string or `null`. `AppFooter` fetches it on mount, shows `Task Notes` alone until it resolves, then `Task Notes v{version}`; on any failure it stays at `Task Notes`. The API base URL, today a module constant inside `frontend/src/api/notes.ts`, moves to `frontend/src/api/baseUrl.ts` so both clients read one source (`coding_standards.md` Section 5, one value one source). No backend change: the endpoint is TEST-05's. `LandingPage.tsx` is **not** modified: it already renders `<AppFooter />` and the fetch lives inside the footer. The existing tests that assert the frontend `package.json` version (component tests and the TEST-04 E2E spec) are updated to the backend version, because they would otherwise fail and would assert the behaviour the comment removes.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, resolved as `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`.
  - `frontend/src/api/version.ts` (new): `fetchAppVersion(): Promise<string | null>`. `GET ${API_BASE_URL}/api/version`. Non-2xx throws `Error("Loading the version failed: {status} {statusText}")`, matching `notes.ts`'s `requestFailed` shape; a network error propagates as thrown. On 2xx, returns the trimmed `version` field when it is a non-empty string other than `unknown`, else `null`. Type `VersionResponse = { version: string }`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` and delete its local `DEFAULT_API_BASE_URL` and `API_BASE_URL`. No behaviour change; `notes.test.ts` stays as is and must still pass.
  - `frontend/src/components/AppFooter.tsx` (modify): remove `import { version } from "../../package.json"`. Hold `const [version, setVersion] = useState<string | null>(null)`; in `useEffect`, call `fetchAppVersion()` once on mount with the same `isMounted` guard `LandingPage.tsx` uses; on resolve `setVersion(result)`, on reject leave `null`. Render `<footer data-testid="app-footer">Task Notes{version && <span data-testid="app-version"> v{version}</span>}</footer>`, so the version segment, including its leading space and `v`, exists only when a version exists. Keep `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: **not modified.**
- Routes: none.
- State management: local `useState` in `AppFooter`. Loading state and failure state both render the app name alone (decision and reason in `## Re-Plan Feedback`). No retry, no polling: one request per page load (no gold plating; a version does not change while the page is open).
- Design reference notes: AI freestyle. Design Reference mode is NONE; the footer keeps TEST-04's existing inline style (`fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`) with no new values.

## Backend Plan
No backend changes required. The runtime dependency is real and stated in `## Re-Plan Feedback`: the footer reads `GET /api/version`, which TEST-05 already delivered and tests (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, `backend/tests/integration/test_version_integration.py`). CORS already allows `GET` from the frontend origin (`backend/app/main.py`, `allow_methods=["GET", "POST"]`), and the backend image installs the project (`backend/Dockerfile` second `uv sync`, `[build-system]` hatchling in `backend/pyproject.toml`), so the endpoint reports `0.1.0` rather than its `unknown` sentinel in the compose stack and in CI.

## API Integration Plan
No external API integration.

## API Contract
Existing internal endpoint, consumed unchanged:
- Method: GET
- URL: `/api/version` on `API_BASE_URL` (default `http://localhost:8010`, overridable through `VITE_API_BASE_URL`)
- Request: no body, no query parameters.
- Response: `200` with `{"version": "0.1.0"}`. The value is `[project].version` of `backend/pyproject.toml`, or the literal `"unknown"` when the backend runs without installed package metadata.
- Client mapping (`fetchAppVersion`): `200` with a non-empty `version` other than `unknown` returns that string; `200` with `unknown`, an empty string, or no string `version` field returns `null`; non-2xx throws; network failure throws. `AppFooter` treats a throw like `null`.
- Forward compatibility: TEST-09 ("Version endpoint reports the build commit") may add fields to this response; the client reads only `version` and ignores the rest.

## Technology Selection
- Version HTTP call (`frontend/src/api/version.ts`): chose the platform `fetch` over adding axios or a data-fetching library, because `fetch` covers one GET and `notes.ts` already uses it.
- Loading and failure state in `AppFooter`: chose React `useState` and `useEffect` (installed) over a data-fetching library such as React Query, because one request on mount needs no cache, retry or deduplication.
- Shared base URL (`frontend/src/api/baseUrl.ts`): no stdlib call, native platform feature or installed dependency covers it, so it is a three-line module extracted from `notes.ts` rather than a second copy of the constant.
- E2E failure and divergent-version paths: chose Playwright's built-in `page.route` (installed) over a separate mock server or stopping the backend container mid-test.
- E2E expected version: chose Node's `fs.readFileSync` plus a regular expression over `backend/pyproject.toml` (stdlib) over adding a TOML parser dependency, because one `version = "..."` line is all that is read; it mirrors how the TEST-04 spec already reads a version file.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source for `API_BASE_URL`, moved out of `notes.ts`
- [A] frontend/src/api/version.ts: `fetchAppVersion()` client for `GET /api/version`, mapping the `unknown` sentinel and empty values to `null`
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client (stubbed `fetch`)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec for the backend version in the footer, the divergent-version path and the unreachable path
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the version on mount; render the `app-version` segment only when a version resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert present, pending, failed and sentinel paths; drop the `package.json` assertion
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version`; the footer test asserts the mocked backend version instead of the `package.json` version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from `backend/pyproject.toml` instead of `frontend/package.json`, since the footer no longer shows the frontend version
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: line 15 names the backend version (`GET /api/version`, `backend/pyproject.toml`) instead of `frontend/package.json`
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 name `backend/pyproject.toml` instead of `frontend/package.json`

No dependency is added or changed, so no lockfile (`frontend/package-lock.json`, `backend/uv.lock`) is touched.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes (the `VITE_API_BASE_URL` variable already exists and keeps its meaning).
`frontend/src/components/LandingPage.tsx` is deliberately absent: the footer owns its own fetch.

## Testing Strategy
- Unit tests: the version client's mapping (version, sentinel, empty or malformed body, non-2xx, base-URL override) and `AppFooter`'s present, pending, failed and sentinel render paths, with the client mocked.
  - Directory: beside the module, `frontend/src/api/` and `frontend/src/components/` (project standards Layout: tests beside the component)
  - Naming: `version.test.ts`, `AppFooter.test.tsx`, `LandingPage.test.tsx`
- Integration tests: no new integration test. The only server code involved is TEST-05's endpoint, already covered by `backend/tests/integration/test_version_integration.py` (200 with the `pyproject.toml` version, answers without a database, 405 on POST); this item does not change it. Its existing test is cited as coverage for criterion 2's backend half.
  - Directory: backend/tests/integration/
- E2E tests: the footer showing the real backend version on the landing page, the footer following the backend when it reports a different version from the frontend bundle, and the footer falling back to the app name when `/api/version` is unreachable. The TEST-04 spec is updated to expect the backend version.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the version the running backend reports in the landing page footer` | E2E is the tier: it needs the page, the real backend and the browser together |
| 2 | The version comes from the backend at runtime via `GET /api/version`, never typed into the component nor read from the frontend `package.json` | Unit | `returns the version the backend reports from GET /api/version`, `renders the version the backend reports, not the frontend bundle's own`, `test_get_version_returns_200_with_version_from_pyproject` | Verifying the source needs no navigation or interaction: it is the client's URL and mapping plus the component rendering what the client returns; the backend half is TEST-05's existing integration test. The E2E `shows the backend's version when it differs from the frontend bundle's` exercises the partial-deploy case end to end as well |
| 3 | When the version cannot be resolved, the footer renders without it (no `undefined`, `null`, `unknown` or empty gap) | Unit | `renders the app name alone with no version gap when the version request fails`, `renders the app name alone when the backend version is unresolvable`, `returns null when the backend reports the unknown sentinel` | Verifying it needs no navigation or interaction: it is a render branch on a rejected or null client result; the E2E `renders the footer with the app name alone when /api/version is unreachable` covers the browser path too |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version the backend reports once the request resolves`, `renders the app name alone with no version gap when the version request fails` | The criterion is itself a component-test requirement |
| 5 | Before the version request resolves, the footer shows the app name alone | Unit | `renders the app name alone while the version request is pending` | Verifying it needs no navigation or interaction: a never-settling mocked promise holds the component in its loading state, which a browser test cannot hold deterministically |

Additional unit tests the builder writes (not criterion-mapped, required by `testing_standards.md` Section 1.1's minimum cases): `returns null when the response carries no usable version string`, `throws with the status and reason when the response is not OK`, `uses VITE_API_BASE_URL instead of the default when it is configured` in `version.test.ts`; `renders the footer with the app name and the backend version` in `LandingPage.test.tsx` (renamed from `renders the footer with the app name and version`); the existing `renders the application name` and landmark tests in `AppFooter.test.tsx` stay. TEST-04's four E2E tests keep their structure, with titles naming the backend version instead of `frontend/package.json`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Read `version = "..."` from `backend/pyproject.toml`; `page.goto("/")`; expect `getByTestId("app-version")` to have text ` v{version}` and `app-footer` to contain `Task Notes v{version}` | Given the stack is running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Version comes from the backend at runtime | `page.route("**/api/version")` fulfils `{"version": "9.9.9-partial"}`; expect the footer to contain `Task Notes v9.9.9-partial` and not `v0.0.0` | Given the backend reports version 9.9.9-partial, When I open the landing page, Then the footer shows 9.9.9-partial, not the frontend's own 0.0.0 |
| 3 | Unresolvable version: footer renders without it | `page.route("**/api/version")` aborts; expect `app-footer` to have exact text `Task Notes` and `app-version` to have count 0 | Given the backend is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend unit suite, When it runs, Then the AppFooter present and absent tests pass |
| 5 | Loading state shows app name alone | covered at Unit, see Criterion coverage | Given the version request has not answered, When the page renders, Then the footer reads "Task Notes" with no "v" |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: from the repository root, `docker compose up -d --build` has started `db`, `backend` (port 8010) and `frontend` (port 5183); `backend/pyproject.toml` line 3 reads `version = "0.1.0"`.
1. Open `http://localhost:8010/api/version` in a browser tab → the page shows `{"version":"0.1.0"}`.
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer.
3. Read the footer text → it reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not from the frontend package.json
Prerequisites: the stack from Criterion 1 is running; `frontend/package.json` reads `"version": "0.0.0"`.
1. Open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, the backend's version, and does not read `v0.0.0`.
2. Edit `backend/pyproject.toml` line 3 to `version = "0.1.1"`, then run `docker compose up -d --build backend` (the frontend is not rebuilt) → the command finishes with the backend container running.
3. Open `http://localhost:8010/api/version` → it shows `{"version":"0.1.1"}`.
4. Reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.1`, although the frontend bundle was not rebuilt.
5. Revert `backend/pyproject.toml` line 3 to `version = "0.1.0"` and run `docker compose up -d --build backend` → reloading the page shows `Task Notes v0.1.0` again.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack from Criterion 1 is running.
1. Run `docker compose stop backend` → `http://localhost:8010/api/version` no longer answers.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, and no trailing space or gap after the name.
3. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers `{"version":"0.1.0"}`, then reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: `npm --prefix frontend install` has run.
1. From the repository root, run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: no failed or errored test on the summary line, exit code 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains the tests `renders the version the backend reports once the request resolves` (version present) and `renders the app name alone with no version gap when the version request fails` (version absent).

### Criterion 5: Before the version request resolves, the footer shows the app name alone
Prerequisites: the stack from Criterion 1 is running, in Chrome.
1. Open `http://localhost:5183/`, open DevTools, Network tab, and set throttling to `Slow 3G` → throttling is active.
2. Reload the page and watch the footer while the `version` request is pending in the Network tab → the footer reads `Task Notes` with no `v` and no placeholder text.
3. Wait for the `version` request to complete → the footer changes to `Task Notes v0.1.0`.
4. Set throttling back to `No throttling` → the page loads normally on the next reload.
