# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (ClickUp task 123k99ctgch. The description is amended by the tracker comment recorded under Re-Plan Feedback: the version comes from the backend at runtime through `GET /api/version`.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. Amended by the tracker comment: that source is the backend, read at runtime from `GET /api/version` (whose value is `[project].version` in `backend/pyproject.toml`), not `frontend/package.json` at build time; a frontend rebuilt against an older backend shows the backend's version.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback
- Comment (tracker, newest): "Reset to to do on 2026-09-07 for measured run 3 ... Code revert pending: the operator reverts a9695cc ... Do not run /deliver against this item until that revert has merged. Note for the revert: TEST-08 changed LandingPage.tsx, which TEST-04 also touched; reverting restores TEST-04's footer assertion as it was." → Addressed by: verified against main at 2bf4ad07 (the run's plan base) rather than assumed. Found: TEST-08's footer code is ABSENT (the latest reset, 2bf4ad07 "reset Arm E code after T8", left `frontend/src/components/AppFooter.tsx` rendering `Task Notes v{version}` from `import { version } from "../../package.json"`, and `e2e/tests/TEST-04_page_footer.spec.ts` asserting the `frontend/package.json` version). There is no `frontend/src/api/version.ts`. So the revert this comment waits on has effectively landed and this plan builds the footer from scratch. The dated details (a9695cc, PR #25) describe an older run and are not acted on further.
- Comment (tracker, older): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. ..." → Addressed by: the footer fetches `GET /api/version` at runtime through a new client `frontend/src/api/version.ts`; criterion 2 is restated above to match, and it overrides the description's "frontend package metadata or a build-time variable".
  - Backend change, said explicitly as the comment asks: the description frames this as frontend-only, and the comment expects a backend addition. Verified on main: `GET /api/version` ALREADY EXISTS (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`) and returns `{"version": "<[project].version of backend/pyproject.toml>"}`, currently `0.1.0`. It already answers exactly the comment's question, so this plan makes NO backend change and the File Manifest carries no `[B]` entry. The item stays frontend-only in its diff, but it now depends at runtime on the backend endpoint (TEST-05 is already an upstream dependency in the map).
  - Loading state, recorded decision: before the fetch resolves the footer renders `Task Notes` (the app name alone, no `v`, no trailing space, no placeholder). Not blank: the footer and its `contentinfo` landmark stay in place so the layout does not jump.
  - Failure state, recorded decision: if `/api/version` is unreachable (network error), answers non-2xx, or returns a body without a non-empty string `version`, the footer renders `Task Notes`, identical to the loading state. It never reads `unknown`, `undefined`, `null` or `v` with nothing after it. Chosen over showing `unknown` because criterion 3 asks for the footer to render "without it", and `unknown` is a version-shaped string a reader could mistake for a real build.
  - Assumption: the backend's own sentinel. `version_service.get_app_version()` returns the literal `unknown` when package metadata is missing. The client treats that value as unresolved (returns `null`), so the footer shows `Task Notes`, not `Task Notes vunknown`. The sentinel is mirrored as a frontend constant with a line comment naming its backend origin.
  - Assumption: no retry and no timeout of our own. The footer is informational, so `coding_standards.md` Section 4's retry is "when appropriate" and not here; a hung request simply keeps the loading display, which is the same text as the failure display.
- Description note "It modifies `LandingPage.tsx`" → not acted on: `LandingPage.tsx` already renders `<AppFooter />` and needs no change, since the fetch lives inside `AppFooter`. Only its test file changes (it must mock the new client). This keeps the item off BUG-04's likely file.

## Plan Overview
Frontend-only diff. A new typed client `frontend/src/api/version.ts` fetches `GET /api/version` from the same configured API base URL the notes client uses (the base URL is exported from `notes.ts` so it keeps one source). `AppFooter.tsx` drops its `package.json` import, fetches the version once on mount, and renders `Task Notes v{version}` when resolved, `Task Notes` otherwise. Component, client and landing-page tests are updated; TEST-04's E2E spec and UAT texts, which assert the `frontend/package.json` version, are re-pointed at the backend's declared version; a TEST-08 E2E spec and UAT artifacts are added. No backend change (the endpoint exists, see Re-Plan Feedback).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. Calls `fetch(`${API_BASE_URL}/api/version`)`; throws `Loading the version failed: {status} {statusText}` on a non-OK response; throws on a body whose `version` is not a string; returns `null` when `version` is empty or equals the mirrored backend sentinel `UNKNOWN_BACKEND_VERSION = "unknown"`; otherwise returns the string. Type `VersionResponse = { version: string }`.
  - `frontend/src/api/notes.ts` (modify): change `const API_BASE_URL` to `export const API_BASE_URL` so the version client reuses it. No behaviour change.
  - `frontend/src/components/AppFooter.tsx` (modify): remove `import { version } from "../../package.json"`; hold `const [backendVersion, setBackendVersion] = useState<string | null>(null)`; in a mount `useEffect` with an `isMounted` guard (same pattern as `LandingPage.tsx`), call `fetchBackendVersion()`, set the result, and on rejection leave it `null`. Render `{APP_NAME}` followed by ` v{backendVersion}` only when `backendVersion` is a non-empty string. Keep `data-testid="app-footer"`, the `<footer>` element and `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: NOT modified.
- Routes: none.
- State management: local `useState` inside `AppFooter`; no global store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Footer styling stays exactly as TEST-04 left it: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem. No new visual states beyond the text content described above.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05) and returns the backend's declared version; see Re-Plan Feedback for the verification.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, unchanged; called from the browser at `{VITE_API_BASE_URL or http://localhost:8010}/api/version`, CORS already configured in `backend/app/main.py`)
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0"}`; the value is `[project].version` of `backend/pyproject.toml`, or the literal `"unknown"` when the backend's package metadata is missing
- Client mapping: `"0.1.0"` → footer `Task Notes v0.1.0`; `"unknown"`, `""`, non-string, non-2xx or network error → footer `Task Notes`

## Technology Selection
- Version fetch client (`frontend/src/api/version.ts`): chose the browser's native `fetch` (as `notes.ts` already does) over adding an HTTP client library such as axios, because one GET needs nothing more.
- Footer async state: chose React's built-in `useState` and `useEffect` over a data-fetching dependency (react-query, SWR), which the project does not install and a single mount-time fetch does not need.
- Reading the backend's declared version inside the E2E specs: chose `node:fs` `readFileSync` plus one regular expression over `backend/pyproject.toml`'s `version = "..."` line over adding a TOML parser dependency, because only that one scalar is read.
- No other net-new component, module or dependency.

## File Manifest
### New files
- [A] frontend/src/api/version.ts: typed client for GET /api/version, returns the version or null for the unknown sentinel, throws on non-OK or malformed responses
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client with `fetch` stubbed
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright specs, footer shows the backend version, and footer renders the name alone when /api/version is aborted
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus the unreachable-endpoint edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/notes.ts: export the existing API_BASE_URL constant so the version client shares it
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import, fetch the backend version on mount, render the name alone while loading or on failure
- [A] frontend/src/components/AppFooter.test.tsx: mock the version client; assert version present, pending, unreachable and unknown paths, and that the backend value wins over the package.json one
- [A] frontend/src/components/LandingPage.test.tsx: mock the version client and assert the footer shows the mocked backend version instead of the package.json version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: expected footer version read from backend/pyproject.toml instead of frontend/package.json, since the footer now shows the backend's version
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the version step names backend/pyproject.toml (served by /api/version) instead of frontend/package.json
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisites and step 4 compare the footer against backend/pyproject.toml instead of frontend/package.json

No dependency is added or changed, so no lockfile changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: the version client (`frontend/src/api/version.test.ts`, `fetch` stubbed as in `notes.test.ts`) and the footer component (`AppFooter.test.tsx`, client module mocked with `vi.mock("../api/version")`); the landing page test mocks the same client.
  - Directory: co-located under `frontend/src/` (Vitest, per project-standards Layout); backend unit directory `backend/tests/unit/` is untouched
  - Naming: `{Module}.test.ts(x)` next to the module
- Integration tests: no new ones. The existing backend router test `test_get_version_returns_200_with_version_from_pyproject` in `backend/tests/integration/test_version_integration.py` already covers the endpoint's source and is cited for criterion 2; this item does not change the endpoint.
  - Directory: `backend/tests/integration/`
- E2E tests: footer on the running landing page shows the backend's version (criterion 1), plus the feature's edge-case spec aborting `/api/version` with `page.route` and asserting the footer text is exactly `Task Notes`. TEST-04's spec is re-pointed at `backend/pyproject.toml`.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one per criterion plus the unreachable-endpoint edge case.
  - Directory: `e2e/uat/scenarios/` (Gherkin), `e2e/uat/scripts/` (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version from /api/version in the landing page footer`, `renders the footer with the app name and the backend version` | — |
| 2 | The version comes from a single declared source (the backend at runtime via GET /api/version), never a string typed into the component | Unit | `renders the version from the backend, not the frontend bundle's own`, `returns the version the backend sent, from the default base URL`, `test_get_version_returns_200_with_version_from_pyproject` | verifying it needs no navigation or interaction: it is a data-source property, shown by a component fed a backend value that differs from package.json, the client's request URL, and the existing router test of the endpoint's source |
| 3 | When the version cannot be resolved, the footer renders without it, never `undefined`, `null` or an empty gap | Unit | `renders the app name without a version while /api/version is pending`, `renders the app name without a version when /api/version is unreachable`, `renders the app name without a version when the backend reports no version`, `returns null when the backend reports the unknown sentinel`, `throws with the status and reason when the response is not OK`, `throws when the response body carries no string version` | verifying it needs no navigation or interaction: the loading, failure and sentinel states are produced by mocking the client, and the exact footer text is asserted in the component |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the backend version once /api/version resolves`, `renders the app name without a version when /api/version is unreachable` | the criterion asks for a component test by definition, so the component tier is the covering tier |

The edge-case E2E spec `renders the footer without a version when /api/version is unreachable` additionally exercises criterion 3 in the browser (the one edge-case spec per feature `testing_standards.md` Section 4 asks for).

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")`, read `getByTestId("app-footer")`, expect `Task Notes v{version from backend/pyproject.toml}` | Given the app and backend are running, When I open the landing page, Then the footer shows "Task Notes v" and the backend's version |
| 2 | Version from the backend at runtime | covered at Unit, see Criterion coverage | Given frontend/package.json and backend/pyproject.toml declare different versions, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage (plus the edge-case spec aborting /api/version) | Given /api/version cannot be reached, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When AppFooter.test.tsx runs, Then it passes |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running with the frontend at http://localhost:5183 and the backend at http://localhost:8010 (or your VITE_API_BASE_URL); `backend/pyproject.toml` reads `version = "0.1.0"`.
1. In a terminal run `curl -s http://localhost:8010/api/version` → it prints `{"version":"0.1.0"}`.
2. Open http://localhost:5183/ in the browser → the landing page with the heading "Task Notes" is shown.
3. Scroll to the bottom of the page and read the footer → it reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, never typed into the component
Prerequisites: as for Criterion 1.
1. Open `frontend/package.json` and read its `version` field → it reads `0.0.0`.
2. Open http://localhost:5183/ and read the footer → it reads `Task Notes v0.1.0`, the backend's version, not `0.0.0`.
3. Open DevTools → Network, reload the page, and select the `version` request → it is a GET to `http://localhost:8010/api/version` with response `{"version":"0.1.0"}`.
4. Open `frontend/src/components/AppFooter.tsx` and search for `0.1.0` and `package.json` → neither appears.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as for Criterion 1, in Chrome or Edge.
1. Open http://localhost:5183/, open DevTools → Network, right-click any request and choose "Block request URL", then edit the pattern to `*/api/version` → the pattern is listed under Network request blocking and is enabled.
2. Reload the page → the page loads normally.
3. Read the footer → it reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown`, and no trailing gap after the name.
4. Remove the blocking pattern and reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Read the test titles in the output → they include `renders the backend version once /api/version resolves` (version present) and `renders the app name without a version when /api/version is unreachable` (version absent).
