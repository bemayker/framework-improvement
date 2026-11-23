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
>
> **Amended by the tracker correction comment (overrides the description where they disagree):** the version must come from the backend at runtime via `GET /api/version`, not from `package.json` at build time; a frontend rebuilt against an older backend must show the backend's version. The loading and failure states must be decided and recorded, and the backend involvement must be stated rather than appearing silently in the manifest.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source: the backend, read at runtime from `GET /api/version` (amended by the tracker correction; it replaces "frontend package metadata or a build-time variable"). It is never a string typed into the component and never the frontend's own `package.json`, so a frontend built against an older backend shows the backend's version.
- [ ] 3. When the version cannot be resolved (request still pending, `/api/version` unreachable or non-OK, a body without a usable version, or the backend's own `unknown` sentinel), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (From the tracker correction) The loading state and the failure state are decided and recorded: in both, the footer reads `Task Notes` alone, with no version, no `v` prefix, no placeholder and no `unknown`.

## Re-Plan Feedback
- Comment (tracker), 2026-09-07, reset note ("Reset to to do ... operator reverts a9695cc ... Do not run /deliver against this item until that revert has merged"): → Not acted on as a blocker, because it is stale against the plan base. Assumption recorded: the revert it waits for has happened. Checked on main at 8b2ca059: `frontend/src/components/AppFooter.tsx` imports `version` from `../../package.json` (TEST-04's state), no version client exists under `frontend/src/api/`, and `git log` shows the later reset `06e9f14d` ("reset Arm E code after T8b") removing TEST-08's most recent build (`a116f048`). TEST-08's code is therefore absent from main and this plan builds it from TEST-04's footer. Its note about `LandingPage.tsx` is honoured differently: this plan leaves `LandingPage.tsx` unmodified (the footer fetches its own version), and only `LandingPage.test.tsx`, which asserts TEST-04's package.json version, changes.
- Comment (tracker), earlier, correction ("The version must come from the backend at runtime ... Add a GET /api/version endpoint ... Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable ... Say so in the plan"): → Addressed by: criterion 2 is rewritten to the backend runtime source, criterion 5 is added, and the footer fetches `GET /api/version` through a new client `frontend/src/api/version.ts`. Decisions recorded here and in the Frontend Plan:
  - Loading state: the footer reads `Task Notes` alone until the request resolves. Chosen over a `…` or `loading` placeholder because criterion 3 forbids an empty gap or a stand-in word, and the name alone is a complete, non-misleading footer.
  - Failure state (unreachable, non-OK, malformed body, or the backend's `unknown` sentinel from `version_service.UNKNOWN_VERSION`): the footer reads `Task Notes` alone, chosen over `Task Notes vunknown`. The comment distinguishes "blank" from "unknown"; this plan picks neither a blank footer nor the word unknown, but the name with the version omitted, which is exactly criterion 3's wording ("renders without it"). No retry: one request per page load, no polling (scope containment).
  - Backend scope, stated explicitly: the comment asks to add `GET /api/version`, but that endpoint already exists on main, built by TEST-05 (a declared dependency of this item, complete): `backend/app/routers/version.py`, `services/version_service.py` (reads `[project].version` from `backend/pyproject.toml` via package metadata), registered in `backend/app/main.py`, and covered by `backend/tests/integration/test_version_integration.py`. CORS already allows `GET` from the configured frontend origin (the notes client relies on it). So this item depends on a backend endpoint but changes **no backend file**; the Backend Plan says so, and the File Manifest carries no `[B]` entry. Should the endpoint be missing on the build branch, that is a regression to report, not something this item re-creates.
- Merged since the last plan: n/a (first plan on this base; no `[merged-since]` lines in the dispatch).

## Plan Overview
Frontend-only change against an existing backend endpoint. A new API client module `frontend/src/api/version.ts` calls `GET /api/version`; `AppFooter.tsx` drops its `package.json` import, fetches the version on mount through that client, and renders `Task Notes v{version}` when resolved and `Task Notes` alone while loading or on any failure. The API base URL, currently private to `api/notes.ts`, moves to one shared module so both clients read the same configured value (the "one value, one source" rule for deployment-dependent values in `coding_standards.md`). TEST-04's existing tests that pin the footer to `frontend/package.json` are updated to the backend source. `LandingPage.tsx` itself is not modified.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/apiBaseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, the value and default moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./apiBaseUrl` instead of defining it; no behaviour change.
  - `frontend/src/api/version.ts` (new): `export async function getBackendVersion(): Promise<string>`; `fetch(${API_BASE_URL}/api/version)`; throws `Loading the version failed: {status} {statusText}` on a non-OK response; throws when the body has no non-empty string `version`; returns the string otherwise. Type `VersionResponse = { version: string }`.
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import; `useState<string | null>(null)` plus a `useEffect` with an `isMounted` guard (the pattern `LandingPage.tsx` already uses) that calls `getBackendVersion()` once; treat a rejected promise or the value `unknown` as unresolved (stay `null`). Render `Task Notes` always, and ` v{version}` only when the state is a resolved string, inside `<span data-testid="app-footer-version">` so tests can assert its absence. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and the existing `footerStyle` values unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local component state in `AppFooter`; no context, no store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's existing values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem.

## Backend Plan
No backend changes required. `GET /api/version` exists on main from TEST-05 and is consumed as-is (see Re-Plan Feedback for the explicit statement the tracker correction asked for).

## API Integration Plan
No external API integration. The only call is to this project's own backend, covered under API Contract.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05), resolved against `API_BASE_URL` (`VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200 with `{"version": "0.1.0"}`, the value of `[project].version` in `backend/pyproject.toml`; the backend answers `{"version": "unknown"}` when its package metadata is not installed, which the footer treats as unresolved.
- Error handling in the client: network error (fetch rejects) and non-OK status both reject; a body without a non-empty string `version` rejects. The component maps every rejection to the name-only footer.

## Technology Selection
- Version fetch: chose the browser's native `fetch` inside a client module over adding a data-fetching dependency (React Query, SWR, axios), because one GET on mount needs no caching, retries or library; it matches the existing `notes.ts` client.
- Footer loading/failure state: chose React's built-in `useState` and `useEffect` over a Suspense boundary or a state library, because one nullable string covers both states.
- Shared base URL module: no stdlib call, native feature or installed dependency covers a shared configured constant, so it is a three-line module built here.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/apiBaseUrl.ts: single source of the backend base URL (`VITE_API_BASE_URL` with the existing default)
- [A] frontend/src/api/version.ts: `getBackendVersion()` client for `GET /api/version`
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client with `fetch` stubbed
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright specs for the backend-sourced version and the unreachable-endpoint edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./apiBaseUrl` instead of defining it locally
- [A] frontend/src/components/AppFooter.tsx: fetch the version from the backend on mount; name-only footer while loading and on failure; drop the `package.json` import
- [A] frontend/src/components/AppFooter.test.tsx: replace the package.json assertion with present, pending, failed and `unknown`-sentinel paths, mocking `../api/version`
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of the package.json one
- [D] e2e/tests/TEST-04_page_footer.spec.ts: assert the footer contains the version `/api/version` returned, replacing the `frontend/package.json` read
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: replace the "matches frontend/package.json" step with the backend `/api/version` value
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: point the version comparison step at `GET /api/version` instead of `frontend/package.json`

No dependency is added, so no lockfile changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this item changes no project structure, run configuration, dependency or test infrastructure (the backend URL variable and its default are unchanged, only moved between modules).

## Testing Strategy
- Unit tests: the version client (`fetch` stubbed, in the style of `notes.test.ts`) and the `AppFooter` component with `../api/version` mocked.
  - Directory: beside each module under `frontend/src/` (project standards: test beside each component and client)
  - Naming: `{Module}.test.tsx` / `{module}.test.ts`
- Integration tests: no new backend code, so no new integration test. The existing `test_get_version_returns_200_with_version_from_pyproject` in `backend/tests/integration/test_version_integration.py` already covers the server side of criterion 2 and must stay passing.
  - Directory: backend/tests/integration/
- E2E tests: the footer showing the real backend's version on the landing page (criterion 1), and the edge case with `/api/version` aborted via `page.route` (footer shows `Task Notes` with no version). TEST-04's spec is updated to the backend source.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the version the backend reports on /api/version in the landing page footer` | — |
| 2 | The version comes from the backend at runtime via GET /api/version, never typed in or from package.json | Unit | `fetches GET /api/version from the default base URL and returns the version`, `renders the backend version once /api/version resolves`, `test_get_version_returns_200_with_version_from_pyproject` | Verifying the source needs no navigation or interaction: it is which URL the client calls and which value the component renders, plus the existing backend router test for the server side |
| 3 | When the version cannot be resolved, the footer renders without it (no undefined, null, unknown or gap) | Unit | `renders the name alone when the version request fails`, `renders the name alone when the backend reports the unknown sentinel`, `throws with the status and reason when the response is not OK`, `throws when the response body carries no version string` | Verifying it needs no navigation or interaction: it is a render branch on a rejected or sentinel value; the browser edge-case spec adds confidence but is not the covering tier |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the backend version once /api/version resolves`, `renders the name alone when the version request fails` | The criterion names the component tier itself |
| 5 | Loading and failure states are decided and recorded: name alone in both | Unit | `renders the name alone while the version request is pending`, `renders the name alone when the version request fails` | Verifying it needs no navigation or interaction: it is the component's render before and after a rejected promise |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Wait for the `GET /api/version` response on `page.goto("/")`, read its `version`, assert `getByTestId("app-footer")` contains `v{version}` | Given the backend is running, When I open the landing page, Then the footer reads "Task Notes v" plus the backend version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage (the E2E spec for criterion 1 also compares against the live response, not package.json) | Given the backend reports a version, When I open the landing page, Then the footer version equals GET /api/version and not frontend/package.json |
| 3 | Unresolvable version is omitted | covered at Unit; edge-case spec `shows the footer without a version when /api/version is unreachable` aborts the route and asserts `app-footer-version` is absent | Given /api/version is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version and no "undefined", "null" or "unknown" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When it runs, Then the AppFooter present and absent tests pass |
| 5 | Loading and failure states recorded | covered at Unit, see Criterion coverage | Given /api/version answers slowly, When the page first renders, Then the footer reads "Task Notes" until the version arrives |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: backend running on http://localhost:8010 (via `uv run --directory backend uvicorn app.main:app --port 8010` or the compose stack), frontend dev server on http://localhost:5183.
1. Open http://localhost:8010/api/version in the browser → the page shows `{"version":"0.1.0"}` (or whatever `[project].version` in `backend/pyproject.toml` currently says); note the value.
2. Open http://localhost:5183/ → the landing page shows the "Task Notes" heading and, at the bottom, the footer.
3. Read the footer → it reads `Task Notes v0.1.0`, the exact value noted in step 1.

### Criterion 2: The version comes from the backend at runtime, never from package.json
Prerequisites: as for criterion 1; `frontend/package.json` still has `"version": "0.0.0"`.
1. Open http://localhost:5183/ → the footer reads `Task Notes v0.1.0`, not `Task Notes v0.0.0` (the frontend's own version).
2. Open the browser developer tools Network tab and reload http://localhost:5183/ → one `GET` request to `http://localhost:8010/api/version` appears with status 200 and body `{"version":"0.1.0"}`.
3. Stop the backend, change `version = "0.1.0"` to `version = "0.1.1"` in `backend/pyproject.toml`, run `uv sync --directory backend`, and start the backend again; do not restart or rebuild the frontend → reloading http://localhost:5183/ shows `Task Notes v0.1.1`. Revert the pyproject change and `uv sync --directory backend` afterwards.

### Criterion 3: An unresolvable version is omitted, never shown as undefined, null, unknown or a gap
Prerequisites: frontend dev server on http://localhost:5183; backend stopped.
1. With the backend stopped, open http://localhost:5183/ → the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown`, and no trailing space before the end of the line.
2. Start the backend and reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0`.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` → the run's summary line reports no failed test and the command exits 0; the listed tests include `renders the backend version once /api/version resolves` and `renders the name alone when the version request fails`.

### Criterion 5: Loading and failure states are recorded and behave as recorded
Prerequisites: backend running on http://localhost:8010, frontend on http://localhost:5183.
1. In the developer tools Network tab set throttling to "Slow 3G" and reload http://localhost:5183/ → while the `/api/version` request is still pending the footer reads `Task Notes` alone, then changes to `Task Notes v0.1.0` when it completes; at no moment does it read `Task Notes v`, `undefined` or `unknown`.
2. In the Network tab, right-click the `/api/version` request, choose "Block request URL", and reload → the footer reads `Task Notes` alone. Unblock it afterwards.
3. Open `.claude/artifacts/TEST-08/plan.md` and read the Re-Plan Feedback section → the loading and failure choices (name alone in both) are written there.
