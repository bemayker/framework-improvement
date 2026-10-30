# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component. **Amended by the tracker comment (see Re-Plan Feedback):** the single declared source is the backend's `GET /api/version`, read at runtime, so a frontend rebuilt against an older backend shows the backend's version.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by:
  - Source of the version: the footer now fetches `GET /api/version` at runtime through a new client module `frontend/src/api/version.ts`; the `package.json` import is removed from `AppFooter.tsx`. The comment overrides criterion 2's "frontend package metadata or a build-time variable" wording.
  - "Add a GET /api/version endpoint": checked on main at plan base 8e90cb7 before planning. The endpoint **already exists** (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`). It returns `{"version": "<pyproject [project].version>"}` and answers `"unknown"` when package metadata is missing. CORS already allows GET from the frontend origin (TEST-03's middleware). **So this item needs no backend change after all**: the scope the comment worried about (a backend change hidden in a frontend item) does not materialise, and that is stated here explicitly rather than left implicit. The Backend Plan says "No backend changes required" and the manifest carries no `[B]` entry. The item does, however, now **depend at runtime on the backend**, which it did not under the original description; that is recorded under Plan Overview.
  - Loading state (decision, recorded): before the fetch resolves the footer shows the app name only, `Task Notes`, with no `v`, no placeholder and no trailing space. Not blank: the footer landmark and the app name are always present, so the page layout does not shift and TEST-04's footer stays intact.
  - Failure state (decision, recorded): when `/api/version` is unreachable, answers non-2xx, returns a body without a non-empty string `version`, does not answer within 5 seconds, or reports the backend sentinel `unknown`, the footer shows `Task Notes` alone, exactly as in the loading state. **Chosen over a footer reading `unknown`** because criterion 3 requires the footer to "render without it", and `unknown` is a version-shaped string that carries no information; chosen over a blank footer because blank removes the app name TEST-04 delivered. The 5-second bound and the treatment of `unknown` match the behaviour already written in `docs/DEVELOPMENT.md` (the "page footer shows the backend's version" paragraph).
- Assumption: the backend's `"unknown"` sentinel (version_service.py `UNKNOWN_VERSION`) counts as "cannot be resolved" for criterion 3, and is matched in the frontend client as a named constant, not a typed version string.
- Assumption: the commit hash in the footer (mentioned in `docs/DEVELOPMENT.md`) is TEST-10's scope, not this item's; this plan does not render `commit`.
- Assumption: `LandingPage.tsx` itself does not need to change: `AppFooter` owns its own fetch, which keeps the shared file BUG-04 and TEST-10 also touch untouched. `LandingPage.test.tsx` does change, because it currently asserts the `package.json` version.
- Assumption: the existing TEST-04 E2E spec asserts the frontend `package.json` version (`0.0.0`) in the footer; after this change the footer shows the backend version (`0.1.0`), so that spec is updated to read the expected version from `backend/pyproject.toml`, otherwise it would fail on this branch.

## Plan Overview
Frontend change only. A new typed client `frontend/src/api/version.ts` exposes `fetchBackendVersion()` that calls `GET {API_BASE_URL}/api/version` and resolves to the version string or `null` (never throws). `AppFooter` calls it once on mount, holds the result in local state, and renders `Task Notes v{version}` when a version is present and `Task Notes` otherwise (loading and failure alike). The backend endpoint already exists from TEST-05, so no backend file changes; the frontend now has a runtime dependency on the backend for the version, which is the point of the tracker's correction (the footer reports the API actually being talked to). Existing tests that assert the `package.json` version are updated.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. Reuses the same `VITE_API_BASE_URL` / default `http://localhost:8010` resolution as `frontend/src/api/notes.ts` (extract nothing shared; two constants in two modules is acceptable for this size, or import the base URL if the builder finds a clean export point without touching notes.ts behaviour). Uses `fetch` with `AbortSignal.timeout(5000)`. Returns `null` on network error, timeout, non-2xx, a body whose `version` is not a non-empty string, or `version === "unknown"`.
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import; `useState<string | null>(null)` plus `useEffect` calling `fetchBackendVersion()` once with an `isMounted` guard (same pattern as LandingPage's notes load). Render `{APP_NAME}` and, only when the version is non-null, ` v{version}`. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
- Routes: none.
- State management: local component state in `AppFooter`.
- Design reference notes: AI freestyle (Design Reference mode NONE); the existing footer style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`) is kept unchanged.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05) and returns the backend's version; see Re-Plan Feedback.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05; consumed, not changed)
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0"}`; `version` is `"unknown"` when the backend cannot read its package metadata. Fields the frontend does not use (for example a later `commit`) are ignored.

## Technology Selection
- Version client `frontend/src/api/version.ts`: chose the browser's native `fetch` (already used by `frontend/src/api/notes.ts`) over adding an HTTP client library, because fetch covers a single GET.
- Request timeout: chose the native `AbortSignal.timeout(5000)` over a hand-written `setTimeout` plus `AbortController` race or a library, because the platform covers it in one call.
- Footer loading/failure state: chose React's built-in `useState`/`useEffect` (installed) over a data-fetching library (react-query, SWR), which this project does not install and one request does not warrant.
- No new dependency is added.

## File Manifest
### New files
- [A] frontend/src/api/version.ts: typed client for GET /api/version, returns the version string or null on any failure, timeout or the "unknown" sentinel
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the client (version returned; non-2xx, network error, malformed body and "unknown" each return null)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec, footer shows the backend version on the landing page, and edge case with /api/version routed to a 500 shows "Task Notes" with no version
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/AppFooter.tsx: remove the package.json import, fetch the backend version on mount, render name plus version or name only
- [A] frontend/src/components/AppFooter.test.tsx: mock ../api/version; assert version-present path (Task Notes v0.1.0), version-absent path (resolves null: text is exactly Task Notes, no "v", "undefined" or "null"), loading state before resolution, and the existing landmark test
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version and assert the footer shows the mocked backend version instead of the package.json version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from backend/pyproject.toml instead of frontend/package.json, since the footer now shows the backend version

No dependency manifest changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` edit: neither project structure, run configuration, dependencies nor test infrastructure change, and `docs/DEVELOPMENT.md` already describes the footer reading `GET /api/version` with the name-only fallback.

## Testing Strategy
- Unit tests (frontend, Vitest): the client `fetchBackendVersion` (happy path; non-2xx; fetch rejects; body missing `version`; `version` is `"unknown"`) and `AppFooter` (present, absent, loading) with the client mocked; `LandingPage` footer assertion updated.
  - Directory: next to the source, `frontend/src/api/` and `frontend/src/components/` (existing convention, `*.test.ts(x)`)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`
- Integration tests: no new backend integration test; the endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py` (happy path returns the pyproject version, 405 on POST).
  - Directory: backend/tests/integration/
- E2E tests: landing page footer shows the real backend's version over the running stack (catches CORS/base-URL wiring a unit test cannot); edge-case spec routes `**/api/version` to a 500 with `page.route` and asserts the footer reads exactly `Task Notes`.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source (backend GET /api/version at runtime), never a string typed into the component | Unit | verifying it needs no navigation: AppFooter.test.tsx asserts the footer shows whatever the mocked client returns, and version.test.ts asserts the client reads /api/version; the endpoint itself is covered by the existing integration test |
| 3 | When the version cannot be resolved, the footer renders without it (no undefined, null or gap) | Unit | verifying it needs no navigation: it is a rendering rule on the client returning null, asserted on exact text; the E2E edge-case spec adds a browser check but is not the covering tier |
| 4 | A component test asserts both paths: version present, and version absent | Unit | the criterion is itself a component test in AppFooter.test.tsx |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | goto `/`, expect `app-footer` to contain `Task Notes v` plus the version read from backend/pyproject.toml | Given the stack is running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Single declared source (backend at runtime) | covered at Unit, see Criterion coverage | Given the backend reports version X, When I open the landing page, Then the footer shows X and not the frontend package version |
| 3 | No undefined/null/gap when unresolved | covered at Unit; edge-case spec routes /api/version to 500 and expects exact text `Task Notes` | Given /api/version is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend suite, When it runs, Then the AppFooter present and absent tests pass |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is up with `docker compose up -d` from the repo root; backend answers at `http://localhost:8010`, frontend at `http://localhost:5183`.
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0"}` (the value of `[project].version` in `backend/pyproject.toml`).
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading.
3. Scroll to the bottom of the page → the footer reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not a typed string or the frontend package
Prerequisites: same as Criterion 1.
1. Open `frontend/package.json` and note `"version": "0.0.0"`; open `backend/pyproject.toml` and note `version = "0.1.0"`.
2. Open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, not `v0.0.0`.
3. Open DevTools → Network, reload the page → a `GET http://localhost:8010/api/version` request with status 200 is listed.
4. Open `frontend/src/components/AppFooter.tsx` → no literal version string such as `0.1.0` and no `package.json` import appear in the file.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: stack up as in Criterion 1.
1. Stop the backend only: `docker compose stop backend` (use the backend service name from `docker-compose.yml`).
2. Open `http://localhost:5183/` and wait up to 5 seconds → the footer reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, no trailing gap.
3. Restart it with `docker compose start backend` and reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → expected `0 failed`, and the output lists a test for the version-present path and one for the version-absent path in AppFooter.test.tsx.
