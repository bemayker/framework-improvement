# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written in the tracker description):**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> **Amended by the tracker comment (newest, overrides the description where they disagree):** the version must come from the backend at runtime through `GET /api/version`, not from `package.json` at build time; the footer's loading and failure states must be decided and recorded; the backend dimension must be stated in the plan.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. (Amended by tracker comment.) The version comes from a single declared source, the backend's own version (`backend/pyproject.toml` `[project].version`, served by `GET /api/version`), fetched at runtime by the footer; never a string typed into the component and never the frontend `package.json`. A frontend running against a backend of a different version shows the backend's version.
- [ ] 3. When the version cannot be resolved (backend unreachable, non-OK response, malformed body, or the backend's own `unknown` sentinel), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (From tracker comment.) Before the `/api/version` fetch resolves, the footer shows the app name without a version: no placeholder text, no `loading` string, no empty gap.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 is rewritten to name the backend as the single source; `AppFooter.tsx` drops its `package.json` import and fetches `GET /api/version` through a new client module `frontend/src/api/version.ts`. **`GET /api/version` already exists on main** (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`), returning `{"version": "<pyproject version>"}` from installed package metadata. It is reused as-is rather than added again, so this plan contains no backend file change. The CORS middleware already allows `GET` from the configured origins, so the browser call needs no backend change either.
- Comment (tracker): "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: **decision recorded, neither a blank footer nor `unknown`**. Loading: the footer renders `Task Notes` only (the app name, no version suffix, no placeholder). Failure (network error, non-OK status, malformed body): the footer renders `Task Notes` only, identical to loading. The backend's own `unknown` sentinel (what `version_service.get_app_version` returns when package metadata is missing) is treated as unresolved and also renders `Task Notes` only. Reasons: criterion 3 says "renders without it", and `unknown` printed after a `v` reads like a version string, which is the misleading answer a version footer exists to avoid; keeping the app name means the footer is never blank, so the landmark and layout stay stable. Assumption: no retry, no timeout and no error text in the footer (the notes client has none either, and adding them is scope beyond the criteria); recorded here rather than asked.
- Comment (tracker): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Plan Overview` and `## Backend Plan`. The item is no longer frontend-only in behaviour (the footer now depends on the backend at runtime), but because the endpoint shipped with TEST-05 the File Manifest lists **no backend file**. The description's note "It modifies `LandingPage.tsx`" is also superseded: the fetch lives inside `AppFooter.tsx`, so `LandingPage.tsx` is not modified (only its test file, whose footer assertion hardcodes the `package.json` version).
- Merged since the last plan: n/a (first plan, plan base 622c796d, branched from current main).

## Plan Overview
Switch the landing-page footer's version source from the frontend `package.json` (build time) to the backend's `GET /api/version` (runtime). Frontend only in the File Manifest: a new API client module for the version endpoint, a shared API base URL module so the base URL keeps one source, a rewritten `AppFooter` with a pending/resolved/absent state, and updated tests. The backend endpoint already exists (TEST-05) and is reused unchanged; this is the backend dependency the tracker comment asked to be named. The TEST-04 E2E spec, which asserts the `package.json` version, is updated to the new source because its assertion is now false by design. `frontend/src/components/LandingPage.tsx` is not touched.

## Frontend Plan
- Components to create/modify:
  `frontend/src/api/apiBaseUrl.ts` (new): exports `API_BASE_URL`, resolved once from `import.meta.env.VITE_API_BASE_URL` with the documented default `http://localhost:8010`, moved verbatim out of `notes.ts` so both clients read the same value (`coding_standards.md` Section 5, one value one source).
  `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./apiBaseUrl` instead of declaring it; no behaviour change.
  `frontend/src/api/version.ts` (new): `getBackendVersion(): Promise<string | null>`. Fetches `${API_BASE_URL}/api/version`; throws `Error("Loading the version failed: {status} {statusText}")` on a non-OK response (same shape as `notes.ts`); throws on a body without a non-empty string `version`; resolves `null` when the backend reports the sentinel `unknown`; otherwise resolves the version string. Exports a `VersionResponse` type `{ version: string }`.
  `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import. Hold `version: string | null` in `useState(null)`; on mount, call `getBackendVersion()` in a `useEffect` with an `isMounted` guard (the pattern `LandingPage.tsx` already uses), setting the resolved value, and leaving `null` on rejection. Render `Task Notes` always, and only when `version` is a non-empty string, append ` v{version}` inside `<span data-testid="app-version">`. With no version there is no span, no trailing space and no placeholder. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and the existing `footerStyle` values unchanged.
  `frontend/src/components/LandingPage.tsx`: **not modified**.
- Routes: none.
- State management: local component state in `AppFooter` (`useState` + `useEffect`); no global store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Existing footer values are kept unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version span inherits them.

## Backend Plan
No backend changes required.

The footer now depends on the backend at runtime (tracker comment), but the endpoint it needs, `GET /api/version`, already exists on main from TEST-05 (`backend/app/routers/version.py`, registered in `backend/app/main.py`) and returns the backend's `[project].version` from installed package metadata, falling back to `unknown`. It is reused unchanged, so this plan lists no backend file; its existing integration test is cited in `### Criterion coverage` as the backend half of criterion 2.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05; consumed, not changed)
- Request: no body, no parameters
- Response: 200 with JSON `{"version": "0.1.0"}`; the value is `backend/pyproject.toml` `[project].version`, or `"unknown"` when the package metadata is not installed. The frontend treats `"unknown"`, a non-OK status, a network failure and a body without a non-empty string `version` as unresolved.

## Technology Selection
- Version fetch (`frontend/src/api/version.ts`): chose the browser's native `fetch` over any HTTP library, the same as `notes.ts`; no new dependency.
- Shared base URL (`frontend/src/api/apiBaseUrl.ts`): chose Vite's built-in `import.meta.env` (already used by `notes.ts`) over a config library; no new dependency.
- Footer state: chose React's built-in `useState` and `useEffect` over a data-fetching library (none installed, and one request does not warrant one).
- Version value: chose the existing backend endpoint (TEST-05, `importlib.metadata` from the standard library) over a new endpoint or a build-time variable; no stdlib or platform alternative is needed beyond what is installed.
- E2E expected value: chose a plain read of `backend/pyproject.toml` with Node's built-in `fs` and a line match over a TOML parser dependency.

## File Manifest
### New files
- [A] frontend/src/api/apiBaseUrl.ts: single source for the API base URL (env with documented default), shared by both clients
- [A] frontend/src/api/version.ts: client for GET /api/version, resolves the version string or null for the backend sentinel, throws on failure
- [A] frontend/src/api/version.test.ts: Vitest tests for the version client with a stubbed fetch (OK, sentinel, non-OK, malformed body, configured base URL)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs, footer shows the backend version on the landing page, and renders without it when /api/version is aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: artifact copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import; fetch the backend version on mount; render the app name always and the version span only when resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock ../api/version; assert the present, pending, failure and absent paths and that no undefined, null, unknown or trailing gap is rendered
- [A] frontend/src/api/notes.ts: import API_BASE_URL from ./apiBaseUrl instead of declaring it (no behaviour change)
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version and replace the package.json footer assertion with the mocked backend version (LandingPage.tsx itself is not modified)
- [D] e2e/tests/TEST-04_page_footer.spec.ts: its three version assertions read frontend/package.json, now false by design; switch the expected value to the backend version read from backend/pyproject.toml

No dependency is added or changed, so no lockfile changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test-infrastructure change (the existing `VITE_API_BASE_URL` keeps its meaning and default).

## Testing Strategy
- Unit tests: Vitest component and client tests. `AppFooter.test.tsx` mocks `../api/version` and covers resolved, pending, rejected and null (sentinel) results; `version.test.ts` stubs `fetch` so the real client body runs, including the non-OK throw, the malformed-body throw and the sentinel mapping; `LandingPage.test.tsx` mocks the version client so the page test stays network-free.
  - Directory: beside their module under `frontend/src/` (project convention, `.claude/project-standards.md`)
  - Naming: `{Module}.test.tsx` / `{module}.test.ts`
- Integration tests: no new backend integration test, because no backend code changes. The existing `backend/tests/integration/test_version_integration.py` (TEST-05) already asserts the endpoint returns the `pyproject.toml` version and is cited for criterion 2.
  - Directory: backend/tests/integration/
- E2E tests: the landing page footer shows the backend version (`0.1.0` from `backend/pyproject.toml`, which differs from the frontend `package.json` `0.0.0`, so the spec distinguishes the two sources), plus an edge-case spec that aborts `/api/version` with `page.route` and asserts the footer shows `Task Notes` with no `app-version` element. `TEST-04_page_footer.spec.ts` is updated to the new expected source.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version in the landing page footer` | — |
| 2 | The version comes from one declared source, the backend's version via GET /api/version at runtime, never typed into the component nor read from package.json | Unit | `renders the backend version once the fetch resolves`, `returns the version the backend sent, from the default base URL`, `test_get_version_returns_200_with_version_from_pyproject` | verifying it needs no navigation or interaction: provenance is a data-flow property, proven by the component rendering exactly what the mocked client returns, the client reading GET /api/version, and the existing backend integration test tying that endpoint to pyproject.toml |
| 3 | When the version cannot be resolved, the footer renders without it, never undefined, null, unknown or an empty gap | Unit | `renders the app name without a version when the backend is unreachable`, `renders the app name without a version when the backend reports unknown`, `resolves null when the backend reports the unknown sentinel`, `throws with the status and reason when the response is not OK` | verifying it needs no navigation or interaction: it is a render branch on a rejected or null client result, fully exercised by mocking the client |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the backend version once the fetch resolves`, `renders the app name without a version when the backend is unreachable` | verifying it needs no navigation or interaction: the criterion is itself a requirement on component tests |
| 5 | Before the fetch resolves, the footer shows the app name without a version | Unit | `renders the app name without a version while the fetch is pending` | verifying it needs no navigation or interaction: it is the initial render state, held deterministically with a never-resolving mocked promise |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Visit `/`, read the expected version from `backend/pyproject.toml`, assert `app-footer` contains `Task Notes` and `app-version` contains `v0.1.0`; edge case: abort `**/api/version` and assert `app-version` is absent | Given the backend is running, When I open the landing page, Then the footer shows "Task Notes v{backend version}" |
| 2 | Version from the backend at runtime | covered at Unit and Integration, see Criterion coverage | Given the frontend package version differs from the backend's, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage | Given the backend is stopped, When I open the landing page, Then the footer shows "Task Notes" and no version, undefined, null or unknown |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they pass |
| 5 | Loading state shows the app name only | covered at Unit, see Criterion coverage | Given the version request is slow, When the landing page first renders, Then the footer shows "Task Notes" without a version |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: backend running on http://localhost:8010 and frontend on http://localhost:5183 per `docs/DEVELOPMENT.md`; `backend/pyproject.toml` has `version = "0.1.0"` under `[project]`.
1. Open http://localhost:8010/api/version in the browser → the page shows `{"version":"0.1.0"}`.
2. Open http://localhost:5183/ → the landing page shows the "Task Notes" heading and the note form.
3. Scroll to the bottom of the page → the footer reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not from package.json
Prerequisites: as Criterion 1; note that `frontend/package.json` has `"version": "0.0.0"`.
1. Open http://localhost:5183/ → the footer reads `Task Notes v0.1.0`, not `Task Notes v0.0.0`.
2. Open DevTools → Network, reload the page → a `GET http://localhost:8010/api/version` request with status 200 appears.
3. Stop the backend, change `version = "0.1.0"` to `version = "0.1.1"` in `backend/pyproject.toml`, run `uv sync --directory backend`, start the backend again, and reload http://localhost:5183/ without restarting or rebuilding the frontend → the footer reads `Task Notes v0.1.1`.
4. Revert `backend/pyproject.toml` to `version = "0.1.0"`, run `uv sync --directory backend`, restart the backend → the footer reads `Task Notes v0.1.0` after a reload.

### Criterion 3: An unresolved version renders the footer without it
Prerequisites: frontend running on http://localhost:5183; backend stopped.
1. Open http://localhost:5183/ → the page loads and the footer reads exactly `Task Notes`.
2. Read the footer text closely → it contains no `v`, no `undefined`, no `null`, no `unknown`, and no trailing space or gap after `Task Notes`.
3. In DevTools → Network → the `GET http://localhost:8010/api/version` request shows as failed, and the page shows no error message.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains the tests `renders the backend version once the fetch resolves` and `renders the app name without a version when the backend is unreachable`.

### Criterion 5: Before the fetch resolves, the footer shows the app name only
Prerequisites: backend and frontend running as in Criterion 1.
1. Open http://localhost:5183/, open DevTools → Network, and set the throttling dropdown to "Slow 3G" → the throttling indicator shows next to the Network tab.
2. Reload the page and watch the footer while the version request is still pending → the footer reads `Task Notes` with no placeholder, no `loading` text and no gap.
3. Wait for the request to complete → the footer changes to `Task Notes v0.1.0` without the rest of the page re-rendering visibly.
