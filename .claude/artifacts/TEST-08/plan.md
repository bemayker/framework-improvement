# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. **As corrected by the tracker comment below, that single source is the backend's `GET /api/version`, fetched at runtime; the frontend's `package.json` is no longer the source.**
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built.
  The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own.
  This matters because the two can diverge in exactly the situation where knowing the version is useful: a partial deploy. A footer that reports the frontend bundle's version tells you nothing about which API you are actually talking to, which is the question anyone reads a version string to answer.
  Two consequences I want handled explicitly rather than assumed:
  The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted.
  This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: this comment overrides acceptance criterion 2 and the description's "frontend package metadata" wording. (a) The footer fetches `GET /api/version` at runtime through a new client module `frontend/src/api/version.ts` and shows the backend's version; `AppFooter.tsx` stops importing `package.json`. (b) **Backend change: none is needed, and that is stated here on purpose.** The endpoint the comment asks for already exists on main from TEST-05 (`backend/app/routers/version.py`, registered in `backend/app/main.py`, returning `{"version": "<[project].version of backend/pyproject.toml>"}` or `"unknown"` when the distribution is not installed). Adding it again would register a duplicate route on the same path, so the `## Backend Plan` says "No backend changes required" and the File Manifest carries no `[B]` entry; the item keeps a runtime dependency on TEST-05, which `feature_map.md` already lists (`[TEST-04, TEST-05]`). (c) **Loading state, recorded:** before the fetch settles, the footer reads exactly `Task Notes` (no version element in the DOM). (d) **Failure state, recorded:** when `/api/version` is unreachable, answers non-2xx, returns a body without a non-empty string `version`, or returns the backend's own `"unknown"` sentinel, the footer reads exactly `Task Notes`, with no version element. A blank footer was rejected because it loses the app name TEST-04 put there; a footer reading `unknown` was rejected because criterion 3 says the footer renders *without* the version when it cannot be resolved, and `unknown` is the backend's placeholder, not a version. Loading and failure are deliberately the same text: neither has a version to show.
- Comment (tracker): "Reset to to do on 2026-09-07 for measured run 3 (operator-checklist Section S state reset). Built and merged in measured run 2 by /deliver (PR #25, squash a9695cc on main). It is one of the two Arm E items again because playbook Section 4 step 3 requires the same items both times. Code revert pending: the operator reverts a9695cc (with 8794a99 and ffbfc12) on the sandbox main in one chore/* PR before the run. Do not run /deliver against this item until that revert has merged. Note for the revert: TEST-08 changed LandingPage.tsx, which TEST-04 also touched; reverting restores TEST-04's footer assertion as it was." → Not acted on as a plan change: it is an operator state note, not a requirement. Its precondition holds for this run: the latest reset is commit 91e19ee3 on main (plan base 91e19ee37652a14621403c9bfdd0263de8767a5f), and `AppFooter.tsx` on main again imports `package.json` (TEST-04's state), so this plan builds the slice afresh against that. Its note about TEST-04's footer assertion is acted on below: TEST-04's tests and UAT artifacts assert the package.json version and are re-pointed to the backend's response.
- Merged since the last plan: n/a (fresh plan, no earlier plan.md for this item in this checkout; branched from current main 91e19ee3).
- Assumption: the "single declared source" of criterion 2 is `[project].version` in `backend/pyproject.toml`, served by `GET /api/version` (read via `importlib.metadata` in `version_service.py`); the frontend holds no version value of its own.
- Assumption: no request timeout is added. Because loading and failure render the same text, a request that never settles is indistinguishable to the reader from a failed one, and no criterion asks for a timeout (no gold plating, `user_story_alignment.md` Section 3).
- Assumption: the version is fetched once on mount of `AppFooter`, with no retry or polling; the criteria ask for the version to be shown, not refreshed.
- Assumption: TEST-04's own artifacts that assert the package.json version (its E2E spec, Gherkin and manual UAT script, and the footer assertions in `LandingPage.test.tsx` and `AppFooter.test.tsx`) are updated in this item, because the correction makes their assertion false by design; their other assertions (app name, contentinfo landmark, heading, subtitle, mobile viewport) are kept.
- Assumption: the API base URL constant currently private to `frontend/src/api/notes.ts` is moved to one shared module `frontend/src/api/baseUrl.ts` and imported by both clients, so the deployment-dependent base URL has one source (`coding_standards.md`, the rule "One value, one source") instead of being copied into the new client.

## Plan Overview
Frontend-only change with a runtime dependency on TEST-05's existing backend endpoint. A new API client `fetchVersion()` (in `frontend/src/api/version.ts`) calls `GET {API_BASE_URL}/api/version` and returns the version string, throwing on a non-2xx answer or an unusable body. `AppFooter` calls it once on mount, keeps the result in local state, and renders `Task Notes v{version}` once a usable version arrives; in the loading and failure states it renders exactly `Task Notes`. The backend's `"unknown"` sentinel and a blank version are treated as unresolved. The base URL constant moves from `notes.ts` to a shared `baseUrl.ts`. `LandingPage.tsx` is not edited (it already renders `<AppFooter />`); its test is updated to mock the new client. TEST-04's E2E spec and UAT artifacts are re-pointed from `frontend/package.json` to the backend's response.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`.
  - `frontend/src/api/version.ts` (new): `export async function fetchVersion(): Promise<string>`; `fetch(`${API_BASE_URL}/api/version`)`; on `!response.ok` throws `Error("Loading the version failed: {status} {statusText}")`; parses JSON and returns `body.version` when it is a string, otherwise throws `Error("Loading the version failed: unexpected response body")`. Exports the response type `VersionResponse = { version: string }`.
  - `frontend/src/api/notes.ts` (modified): imports `API_BASE_URL` from `./baseUrl` instead of declaring it; behaviour unchanged.
  - `frontend/src/components/AppFooter.tsx` (modified): drops the `package.json` import; `useState<string | null>(null)` for the version; `useEffect` calls `fetchVersion()` once, with the `isMounted` guard `LandingPage.tsx` already uses; a resolved value is kept only when `value.trim() !== ""` and `value !== "unknown"`, else state stays `null`; a rejection leaves state `null`. Render: `<footer data-testid="app-footer">Task Notes{version && <span data-testid="app-footer-version"> v{version}</span>}</footer>`. The `UNKNOWN_SENTINEL = "unknown"` constant carries a one-line comment naming the backend's sentinel.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none new.
- State management: local component state in `AppFooter` (`version: string | null`); no global store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer style is kept unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the version span inherits it.

## Backend Plan
No backend changes required. The endpoint the tracker correction asks for, `GET /api/version`, already exists on main from TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py` behind the CORS middleware the browser needs). This item consumes it at runtime and adds no backend file; see `## Re-Plan Feedback`.

## API Integration Plan
No external API integration. The only call is to this project's own backend, defined under `## API Contract`.

## API Contract
- Method: GET
- URL: `/api/version` (absolute: `{VITE_API_BASE_URL or http://localhost:8010}/api/version`)
- Request: no body, no parameters
- Response: 200, `application/json`, body `{"version": "0.1.0"}` (the backend's `[project].version`; `"unknown"` when the distribution is not installed). The client treats any non-2xx status, a network error, a non-JSON body, or a body whose `version` is not a string as a failure (the footer then shows `Task Notes`); the component additionally treats `""`, whitespace-only and `"unknown"` as unresolved.

## Technology Selection
- `frontend/src/api/version.ts` (version client): chose the browser's native `fetch`, the pattern `frontend/src/api/notes.ts` already uses, over adding an HTTP library such as axios; nothing installed or native is missing for one GET.
- `frontend/src/api/baseUrl.ts` (shared base URL): chose one exported constant read from Vite's built-in `import.meta.env` over a config library or a second copy of the constant in the new client; Vite already provides the env mechanism, and a copy would give the base URL two sources.
- Loading and failure state in `AppFooter`: chose React's built-in `useState` and `useEffect` (React is installed) over a data-fetching library (react-query, SWR), because one fetch on mount needs no cache or retry layer.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: the single `API_BASE_URL` constant, moved out of notes.ts
- [A] frontend/src/api/version.ts: `fetchVersion()` client for GET /api/version and its `VersionResponse` type
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client (fetch stubbed)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright specs: backend version shown, footer without version when the request fails
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: the artifact copy of the manual UAT script

### Modified files
- [A] frontend/src/api/notes.ts: import API_BASE_URL from ./baseUrl instead of declaring it
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version on mount; render `Task Notes v{version}` when resolved, exactly `Task Notes` when loading or unresolved; drop the package.json import
- [A] frontend/src/components/AppFooter.test.tsx: mock ../api/version; assert version-present, loading, failure, unknown-sentinel and blank-version paths; keep the landmark test
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version; footer assertion uses the mocked backend version instead of package.json's
- [D] e2e/tests/TEST-04_page_footer.spec.ts: assert the version the page received from GET /api/version instead of frontend/package.json's
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step names the backend's GET /api/version instead of frontend/package.json
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the comparison step reads the version from GET /api/version instead of frontend/package.json

Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this item changes no project structure, run configuration, dependency or test infrastructure (the backend it calls is already started by `docker compose up` and by the E2E setup).

## Testing Strategy
- Unit tests: the version client (`fetchVersion`: happy path, non-2xx, unusable body) and the footer component (version present, loading, failure, `"unknown"` sentinel, blank version, landmark), with `fetch` stubbed for the client and `../api/version` mocked for the component. Updated `LandingPage.test.tsx` mocks `../api/version`.
  - Directory: beside the code under `frontend/src/` (project-standards Layout: "tests beside the component"); the backend unit directory `backend/tests/unit/` is untouched
  - Naming: `{Module}.test.ts(x)` (`version.test.ts`, `AppFooter.test.tsx`)
- Integration tests: no new integration test. No backend code changes; `GET /api/version` is already covered by `backend/tests/integration/test_version_integration.py` (TEST-05), which this plan leaves unchanged.
  - Directory: backend/tests/integration/
- E2E tests: the landing page footer shows the version the browser received from the real backend's `GET /api/version` (wiring and CORS only a browser exercises); edge case: with `/api/version` routed to a 500 by `page.route`, the footer reads exactly `Task Notes`. TEST-04's spec is re-pointed to the backend's response.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the failure edge case, in Gherkin; manual script expanded from the Manual verification plan.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the version the backend's GET /api/version returned in the footer` | — |
| 2 | The version comes from a single declared source (the backend's GET /api/version, per the correction), never a string typed into the component | Unit | `renders the version the API client returned`, `requests GET /api/version from the default base URL and returns the version` | verifying it needs no navigation or interaction: it is the component's data source and the client's request URL, observable by mocking the client and stubbing fetch |
| 3 | When the version cannot be resolved, the footer renders without it, never `undefined`, `null` or an empty gap | Unit | `renders exactly Task Notes when the version request fails`, `renders exactly Task Notes when the backend reports the unknown sentinel`, `renders exactly Task Notes when the backend reports a blank version`, `throws when the response is not OK`, `throws when the body carries no string version` | verifying it needs no navigation or interaction: each failure is a mocked client outcome and an exact text assertion; the E2E edge-case spec `shows the footer without a version when GET /api/version fails` adds a browser check but is not the covering test |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version the API client returned`, `renders exactly Task Notes while the version is loading`, `renders exactly Task Notes when the version request fails` | verifying it needs no navigation or interaction: the criterion is itself a requirement on the component test suite |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Wait for the `/api/version` response while `page.goto("/")`, read its `version`, assert `getByTestId("app-footer")` contains `Task Notes` and `v{version}` | Given the backend is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the version GET /api/version returns |
| 2 | Version comes from the backend's GET /api/version | covered at Unit, see Criterion coverage | Given the backend reports version X, When I open the landing page, Then the footer shows X and not frontend/package.json's version |
| 3 | Unresolved version renders without it | covered at Unit; E2E edge case routes `/api/version` to 500 and asserts the footer text is exactly `Task Notes` | Given GET /api/version fails, When I open the landing page, Then the footer reads exactly "Task Notes" with no "undefined", "null" or trailing "v" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend unit suite, When I run AppFooter.test.tsx, Then the version-present and version-absent tests pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: from the repository root, `docker compose up` is running (frontend http://localhost:5183, backend http://localhost:8010).
1. Open http://localhost:8010/api/version in a browser tab → the page shows JSON such as `{"version":"0.1.0"}`; note the value of `version`.
2. Open http://localhost:5183/ → the landing page shows the "Task Notes" heading, the note form, and a footer at the bottom.
3. Read the footer text → it reads `Task Notes v` followed by exactly the value noted in step 1 (for example `Task Notes v0.1.0`).

### Criterion 2: The version comes from the backend's GET /api/version, never a string typed into the component
Prerequisites: as for Criterion 1.
1. Open `frontend/package.json` and read its `version` field → it reads `0.0.0` (different from the backend's value noted in Criterion 1 step 1).
2. Open http://localhost:5183/ and read the footer → it shows the backend's value from Criterion 1 step 1, not `0.0.0`.
3. Open browser DevTools → Network tab, reload http://localhost:5183/, filter on `version` → one GET request to `http://localhost:8010/api/version` with status 200, whose response `version` equals the version shown in the footer.
4. Open `frontend/src/components/AppFooter.tsx` → it contains no version literal and no import of `package.json`; the version comes from `fetchVersion` in `frontend/src/api/version.ts`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: frontend running at http://localhost:5183; backend stopped (`docker compose stop backend`).
1. Open http://localhost:5183/ → the landing page renders; DevTools Network shows the request to `http://localhost:8010/api/version` failed.
2. Read the footer → it reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, and no trailing space or separator.
3. Restart the backend (`docker compose start backend`) and reload http://localhost:5183/ → the footer reads `Task Notes v` followed by the backend's version again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root, run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Read the run's test titles → they include `renders the version the API client returned` (version present) and `renders exactly Task Notes when the version request fails` (version absent).
