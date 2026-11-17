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
> Source: [TEST-08: Footer shows the app version](https://app.clickup.com/t/123k99ctgch). The newest tracker comment corrects criterion 2 and adds the loading and failure states; the criteria below are the description as amended by that comment (see `## Re-Plan Feedback`).

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, the backend, fetched at runtime from `GET /api/version` (amended by the tracker comment, replacing "frontend package metadata or a build-time variable"), never a string typed into the component and never `frontend/package.json`: a frontend built against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (From the tracker comment) The footer's loading state (before `GET /api/version` resolves) and failure state (`/api/version` unreachable, non-OK, or reporting no usable version) are decided and recorded: both render the footer as `Task Notes` with no version text, no placeholder and no trailing gap.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 is rewritten to the backend as the single source. `AppFooter.tsx` drops its `package.json` import and fetches `GET /api/version` through a new client `frontend/src/api/version.ts`. **The endpoint already exists on main** (checked at plan base 7508f8f4: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, delivered by TEST-05, returning `{"version": "<pyproject [project].version>"}`, covered by `backend/tests/integration/test_version_integration.py`). It is reused unchanged, so no new endpoint is added.
- Comment (tracker): "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: recorded as criterion 5. **Decision: neither a blank footer nor "unknown".** In both the loading state and the failure state the footer renders `Task Notes` (the app name, unchanged from today) and omits the version element entirely, so there is no `v`, no placeholder and no gap. Reasons: the footer stays a stable landmark that never disappears or shifts; "unknown" would read like a version string and is exactly the kind of answer a person checking a partial deploy could misread; and criterion 3 already asks for "renders without it". The backend's own sentinel `"unknown"` (returned by `get_app_version()` when the distribution metadata is absent) is treated as "cannot be resolved" by the client for the same reason, so it renders the same as a failure. Assumption recorded: the loading state is not visually distinguished (no spinner or "loading…" text), because the fetch is one small GET and an extra visual state is not asked for.
- Comment (tracker): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Backend Plan`. The item is **no longer frontend-only in behaviour**: it now depends at runtime on the backend's `GET /api/version`, and the E2E specs need the backend running. It is **still frontend-only in its diff**, because the endpoint the comment asks for already exists on main (TEST-05), so the File Manifest carries no `[B]` entry. If the build finds the endpoint missing or changed on its base, that is a plan deviation to report, not a silent backend addition.
- Consequence recorded (not in the comment, follows from it): the TEST-04 footer artifacts assert the old behaviour (version equals `frontend/package.json`, currently `0.0.0`). After this change the footer shows the backend's version (currently `0.1.0`), so `e2e/tests/TEST-04_page_footer.spec.ts` would fail; it is re-pointed at `backend/pyproject.toml`, and TEST-04's Gherkin scenario and manual script lines that name `frontend/package.json` are corrected in the same way. `AppFooter.test.tsx` and `LandingPage.test.tsx` also import `package.json`'s version and are updated.

## Plan Overview
Frontend change only in code, against an existing backend endpoint. A new API client `frontend/src/api/version.ts` calls `GET /api/version` and returns the version string, or `null` when the backend reports none usable. `AppFooter.tsx` fetches it on mount and renders `Task Notes v{version}` once resolved, and `Task Notes` alone while loading and on any failure. The API base URL constant currently private to `notes.ts` moves to a shared `frontend/src/api/baseUrl.ts` so both clients read one value from one source. `LandingPage.tsx` itself is not modified (the footer fetches for itself), which keeps this item off BUG-04's and TEST-10's likely edit of that file; only its test file changes, to mock the new client.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, resolved as `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"` (moved verbatim from `notes.ts`, so the env-driven configuration and its documented default are unchanged).
  - `frontend/src/api/version.ts` (new): `export async function getAppVersion(): Promise<string | null>`. Calls `fetch(`${API_BASE_URL}/api/version`)`. Non-OK response: throws `Error("Loading the version failed: {status} {statusText}")`, the same shape as `notes.ts`. OK response: returns `body.version` when it is a non-empty string other than the backend sentinel `"unknown"` (a named constant `UNRESOLVED_VERSION_SENTINEL` with a comment pointing at `backend/app/services/version_service.py` `UNKNOWN_VERSION`); otherwise returns `null` (unexpected response shape is handled, not cast). Network errors propagate as thrown errors.
  - `frontend/src/api/notes.ts` (modified): imports `API_BASE_URL` from `./baseUrl` instead of declaring it; behaviour unchanged.
  - `frontend/src/components/AppFooter.tsx` (modified): remove `import { version } from "../../package.json"`. Add `useState<string | null>(null)` and a `useEffect` that calls `getAppVersion()` once on mount with an `isMounted` guard (same pattern as `LandingPage.tsx`), setting the version on success and leaving it `null` on rejection (caught, nothing rendered for it). Render `<footer data-testid="app-footer" style={footerStyle}>Task Notes{version !== null && <span data-testid="app-footer-version"> v{version}</span>}</footer>`, so the resolved text is `Task Notes v0.1.0` and the unresolved text is exactly `Task Notes`.
- Routes: none (the landing page at `/` already renders `AppFooter`).
- State management: local component state in `AppFooter` (`useState` + `useEffect`); no global store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer style is kept unchanged: `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`; the version span inherits it, no new style values.

## Backend Plan
No backend changes required. The tracker comment asks for a `GET /api/version` endpoint, and it **already exists on main** (TEST-05: `backend/app/routers/version.py` → `services/version_service.py` `get_app_version()` → `{"version": str}`, registered in `backend/app/main.py`, CORS already allows `GET` from the configured origins). This item therefore adds a runtime dependency on the backend without a backend diff; the comment's request to say so is answered in `## Re-Plan Feedback`. Existing coverage of the endpoint (`backend/tests/integration/test_version_integration.py`) is reused, not changed.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05; called at `{API_BASE_URL}/api/version`)
- Request: no body, no parameters
- Response: 200 with `{"version": "0.1.0"}` (value is `backend/pyproject.toml` `[project].version`; `"unknown"` when the backend's package metadata is absent)
- Frontend interpretation: a non-empty `version` other than `"unknown"` is shown; `"unknown"`, a missing or non-string `version`, a non-OK status or a network error all mean "unresolved" and the footer shows `Task Notes` with no version.

## Technology Selection
- Version HTTP client (`frontend/src/api/version.ts`): chose the browser's native `fetch` over adding an HTTP library, because `fetch` already serves `notes.ts` and covers a single GET.
- Fetch-on-mount in `AppFooter`: chose React's built-in `useState` + `useEffect` over a data-fetching dependency (none is installed, and one GET does not warrant one).
- Shared base URL (`frontend/src/api/baseUrl.ts`): a plain module exporting the existing env-driven constant, chosen over a second copy of the constant in `version.ts`; no stdlib, platform feature or dependency is involved, it is a move of existing code.
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of the API base URL (VITE_API_BASE_URL with the documented localhost:8010 default), moved out of notes.ts
- [A] frontend/src/api/version.ts: getAppVersion() client for GET /api/version, returning the version string or null when unresolved
- [A] frontend/src/api/version.test.ts: unit tests for the version client with fetch stubbed (resolved, sentinel, bad shape, non-OK)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E specs for the backend-sourced footer version and its failure state
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus the unreachable-backend edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/notes.ts: import API_BASE_URL from ./baseUrl instead of declaring it; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import; fetch the version from the backend on mount; render the version span only when resolved
- [A] frontend/src/components/AppFooter.test.tsx: replace the package.json assertion with backend-version present, pending, failed and sentinel cases (client mocked)
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version and assert the footer shows the mocked backend version instead of package.json's
- [D] e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from backend/pyproject.toml instead of frontend/package.json, since the footer now shows the backend version
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: correct the step naming frontend/package.json as the version source to the backend's GET /api/version
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: correct the prerequisite and step 4 that compare the footer to frontend/package.json

No dependency manifest changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the change alters no project structure, run configuration, dependency or test infrastructure (the E2E run already starts the backend for the notes specs, and VITE_API_BASE_URL is already documented through notes.ts's existing use).

## Testing Strategy
- Unit tests: the version client (`getAppVersion`) with `fetch` stubbed, and `AppFooter` with `../api/version` mocked (resolved, pending, rejected, null), plus `LandingPage` with both clients mocked. No backend unit tests: no backend code changes.
  - Directory: co-located under `frontend/src/` (`*.test.ts(x)`, per `.claude/project-standards.md`)
  - Naming: `{Name}.test.tsx` / `version.test.ts`
- Integration tests: no new ones; no backend router, service or repository changes. The existing `test_get_version_returns_200_with_version_from_pyproject` in `backend/tests/integration/test_version_integration.py` already covers the endpoint this item consumes and is cited for criterion 2.
  - Directory: backend/tests/integration/
- E2E tests: the footer showing the backend's real version on `/`, the footer showing whatever the backend reports (route fulfilled with `9.9.9`, proving the bundle's own version is not used), and the footer reading exactly `Task Notes` when `/api/version` is aborted. The expected real version is read from `backend/pyproject.toml` in the spec, never typed in. TEST-04's spec is re-pointed at the same source.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts
- UAT scenarios: one scenario per criterion plus the unreachable-backend edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version from GET /api/version in the footer` | — |
| 2 | The version comes from the backend at runtime via GET /api/version, never typed in and never package.json | Unit | `renders the version returned by the backend`, `returns the version from GET /api/version`, `test_get_version_returns_200_with_version_from_pyproject` | verifying it needs no navigation or interaction: it is the wiring between the component, its client and the existing endpoint, proven by a mocked client returning a value the bundle cannot know |
| 3 | When the version cannot be resolved, the footer renders without it (no undefined, null or gap) | Unit | `renders the app name without a version when the request fails`, `renders the app name without a version when the backend reports none`, `returns null when the backend reports the unknown sentinel`, `returns null when the response has no version string` | verifying it needs no navigation or interaction: it is a rendering rule over the client's result, asserted on the exact footer text |
| 4 | A component test asserts both paths: version present and version absent | Unit | `renders the version returned by the backend`, `renders the app name without a version when the request fails` | the criterion itself names a component test |
| 5 | Loading and failure states are decided and recorded: Task Notes with no version, no placeholder, no gap | Unit | `renders the app name without a version while the request is pending`, `renders the app name without a version when the request fails` | verifying it needs no navigation or interaction: it is the component's state before and after a rejected promise, controllable only with a mocked client |

Additional E2E edge specs (not the covering tier for any row, kept as Section 4's per-feature edge case): `shows the version the backend reports, not the frontend bundle's` and `renders the footer without a version when /api/version is unreachable`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | goto `/`, read `app-footer-version`, expect ` v` + backend/pyproject.toml version | Given the backend is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the backend's version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage; edge spec fulfils /api/version with 9.9.9 | Given the backend reports version 9.9.9, When I open the landing page, Then the footer reads "Task Notes v9.9.9" |
| 3 | Unresolved version renders without it | covered at Unit, see Criterion coverage; edge spec aborts /api/version | Given /api/version is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then both present and absent paths pass |
| 5 | Loading and failure states recorded | covered at Unit, see Criterion coverage | Given /api/version has not answered yet, When the landing page renders, Then the footer reads "Task Notes" with no version |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the backend runs on http://localhost:8010 (via `uv run`, so its package metadata is installed) and the frontend on http://localhost:5183; note the `version` value under `[project]` in `backend/pyproject.toml` (currently `0.1.0`).
1. Open http://localhost:5183/ in a browser → the landing page shows the "Task Notes" heading, the note form and, at the bottom, the footer.
2. Read the footer text → it reads `Task Notes v0.1.0` (the `backend/pyproject.toml` version you noted, with a leading `v`).

### Criterion 2: The version comes from the backend at runtime
Prerequisites: as for criterion 1; note that `frontend/package.json` has `"version": "0.0.0"`.
1. Open http://localhost:8010/api/version in a new tab → the page shows `{"version":"0.1.0"}`.
2. Open http://localhost:5183/ → the footer reads `Task Notes v0.1.0`, matching the backend's answer and not `0.0.0` from `frontend/package.json`.
3. Open browser DevTools → Network, reload the landing page, and filter on `version` → one GET request to `http://localhost:8010/api/version` with status 200.
4. Run `npm --prefix frontend test -- src/api/version.test.ts src/components/AppFooter.test.tsx` from the repository root → the run passes: its summary reports no failed or errored test and the command exits 0.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: as for criterion 1, in Chrome or Edge.
1. Open http://localhost:5183/, open DevTools → Network, right-click the `version` request and choose "Block request URL", then reload the page → the request shows as blocked.
2. Read the footer → it reads exactly `Task Notes`: no `v`, no `undefined`, no `null`, no `unknown` and no trailing space or empty gap after the name.
3. Remove the block in DevTools (Network request blocking panel) and reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Open `frontend/src/components/AppFooter.test.tsx` → it contains `renders the version returned by the backend` (present path) and `renders the app name without a version when the request fails` (absent path).
2. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` from the repository root → the run passes: no failed or errored test on its summary line, exit code 0.

### Criterion 5: Loading and failure states are recorded
Prerequisites: as for criterion 1, in Chrome or Edge.
1. Open DevTools → Network, set throttling to "Slow 3G", and reload http://localhost:5183/ → while the `version` request is still pending, the footer reads exactly `Task Notes` (no placeholder, no "loading", no gap).
2. Wait for the request to finish → the footer changes to `Task Notes v0.1.0`.
3. Set throttling back to "No throttling" and repeat criterion 3 step 1 (block the `version` request) → the footer reads exactly `Task Notes`, the same as the loading state.
4. Open this plan's `## Re-Plan Feedback` section → the recorded decision for both states is "Task Notes with no version", with its reasons.
