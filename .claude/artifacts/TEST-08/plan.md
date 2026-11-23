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
>
> (Tracker task 123k99ctgch, ClickUp workspace 30307190. The tracker comment recorded under Re-Plan Feedback amends criterion 2 and adds criteria 5 and 6 below.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. Amended by the tracker comment: that source is the backend's own version, read at runtime from `GET /api/version`, never the frontend's `package.json` at build time. A frontend built against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (From the tracker comment) `GET /api/version` returns the backend's version.
- [ ] 6. (From the tracker comment) The footer's loading state and failure state are decided and recorded: before `/api/version` resolves, and when it is unreachable or answers an error, the footer reads exactly `Task Notes` (the app name, no `v`, no placeholder). It is never blank and never reads `unknown`.

## Re-Plan Feedback
- Comment (tracker, newest actionable): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: (a) criterion 2 amended, the footer fetches `GET /api/version` at mount through a new client `frontend/src/api/version.ts` and no longer imports `frontend/package.json`; (b) the endpoint already exists on `main` (TEST-05: `backend/app/routers/version.py`, `services/version_service.py`, `schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`), and CORS already allows `GET` from the frontend origin, so **this plan makes no backend change**: the description's "frontend only" framing survives the correction, and criterion 5 is covered by TEST-05's existing integration test rather than new code; (c) loading and failure states decided as criterion 6: both render the app name alone, `Task Notes`. Reason for that choice over `unknown`: criterion 3 already forbids a footer that shows a non-version where the version would be, and a name-only footer is a stable, non-empty landmark in both states; reason over blank: a blank `contentinfo` landmark reads as a rendering fault and would break TEST-04's footer-visible checks while the request is in flight.
- Assumption (tracker comment, backend sentinel): `version_service.get_app_version()` answers `{"version": "unknown"}` when the distribution metadata is missing. The frontend treats that sentinel as "cannot be resolved" (criterion 3) and shows `Task Notes`, so the footer never reads `vunknown`. The sentinel string is matched in the client only, in one constant.
- Assumption (tracker comment, partial deploy): "show the backend's version" is satisfied by the footer showing exactly what `/api/version` returns; no frontend version is shown beside it, since the comment asks for the backend's and the criteria name one version string.
- Comment (tracker): operator state-reset note, 2026-09-07 → not acted on because it is an operator note about sandbox state, not a requirement.
- Comment (tracker): framework PR-opened notices from earlier runs → not acted on because they are framework notifications, not requirements. Context only: `origin/main` carries an earlier TEST-08 merge (#958) that #963 reset to the pre-TEST-08 base; this plan is written against the code as it stands now (`AppFooter.tsx` importing `package.json`), not against #958.

## Plan Overview
Replace the footer's build-time version (`import { version } from "../../package.json"` in `AppFooter.tsx`, TEST-04) with the backend's runtime version from the existing `GET /api/version` (TEST-05). A new typed client `frontend/src/api/version.ts` performs the request (base URL shared with the notes client through a new `frontend/src/api/baseUrl.ts`), and `AppFooter` fetches it once on mount, rendering `Task Notes v{version}` on success and `Task Notes` while pending, on failure, and on the backend's `unknown` sentinel. Frontend only: no backend file changes, because the endpoint already exists. `LandingPage.tsx` is not modified (the footer stays self-contained), which keeps this item off BUG-04's file. Existing tests and TEST-04's E2E spec and UAT artifacts that assert the `frontend/package.json` version are updated to the new source, since they would otherwise fail or describe behaviour that no longer exists.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, resolved as `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved out of `notes.ts` so both clients read one source (`coding_standards.md` Section 1, DRY).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` instead of declaring it; behaviour unchanged.
  - `frontend/src/api/version.ts` (new): `export type VersionResponse = { version: string }`; `export async function fetchBackendVersion(): Promise<string | null>`. Calls `fetch(\`${API_BASE_URL}/api/version\`, { signal: AbortSignal.timeout(VERSION_REQUEST_TIMEOUT_MS) })` with a 5000 ms timeout. Throws `Loading the version failed: {status} {statusText}` on a non-OK response (covers 401/403/429/5xx); throws on an unexpected shape (body not an object, `version` not a non-empty string); returns `null` when `version` equals the backend sentinel `UNKNOWN_VERSION = "unknown"`; otherwise returns the string. Network errors and timeouts propagate as the rejected promise. No retry: the version is a non-critical label fetched once per page load, and the failure state is a defined, acceptable display (`coding_standards.md` Section 4 asks for retry "when appropriate").
  - `frontend/src/components/AppFooter.tsx` (modify): drop the `package.json` import; hold `version: string | null` in `useState(null)`; in a mount `useEffect`, call `fetchBackendVersion()` with an `isMounted` guard (the pattern `LandingPage.tsx` uses), set the result on success and keep `null` on rejection. Render `{APP_NAME}` followed by ` v{version}` only when `version` is a non-empty string, so the text is exactly `Task Notes` or `Task Notes v0.1.0`, never a trailing space or `v`. `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` are unchanged.
- Routes: none.
- State management: local component state in `AppFooter`; no shared state.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer style is kept as is: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem.

## Backend Plan
No backend changes required. `GET /api/version` already exists on `main` (TEST-05) and returns `{"version": "<[project].version from backend/pyproject.toml>"}`; CORS already allows `GET` from the configured frontend origin. The tracker comment's "Add a GET /api/version endpoint" is therefore satisfied by existing code, as recorded under Re-Plan Feedback.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05; consumed here, not changed)
- Request: no body, no parameters
- Response: 200 with JSON body `{"version": "0.1.0"}` (the value of `backend/pyproject.toml` `[project].version`; `"unknown"` when package metadata is missing). The client reads `version` only and ignores any additional field, so a field TEST-09 may add to this response (build commit) does not break it.

## Technology Selection
- Version request timeout: chose the native `AbortSignal.timeout()` over a hand-built `AbortController` plus `setTimeout`, because the platform covers it in one call; if the Vitest jsdom environment lacks it, the builder falls back to `AbortController` with `setTimeout` and records the deviation.
- Version client `frontend/src/api/version.ts`: chose the native `fetch` (already the notes client's mechanism) over adding an HTTP library; no new dependency.
- Shared base URL `frontend/src/api/baseUrl.ts`: no stdlib call, native feature or installed dependency covers a project constant, so it is a two-line module moved out of `notes.ts`.
- Footer data loading: chose React's built-in `useState` plus `useEffect` (already installed and used by `LandingPage.tsx`) over a data-fetching library.
- No new dependency is added, so no lockfile changes.

## File Manifest

### New files
- [A] frontend/src/api/baseUrl.ts: single source of the API base URL shared by the notes and version clients
- [A] frontend/src/api/version.ts: typed client for GET /api/version, sentinel and shape handling
- [A] frontend/src/api/version.test.ts: unit tests for the version client with a stubbed fetch
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: browser specs for the backend version in the footer and the unreachable-endpoint edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import API_BASE_URL from ./baseUrl instead of declaring it
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version at mount, render name-only while pending and on failure, drop the package.json import
- [A] frontend/src/components/AppFooter.test.tsx: mock ../api/version and assert present, pending, failed and sentinel paths; drop the package.json version test
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version and assert the footer shows the mocked backend version instead of the package.json version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: read the expected version from backend/pyproject.toml instead of frontend/package.json
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: version step now matches backend/pyproject.toml via GET /api/version, not frontend/package.json
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: prerequisite and step 4 compare the footer to GET /api/version, not frontend/package.json

No dependency is added or changed, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure (the frontend already reaches the backend through `VITE_API_BASE_URL`).

## Testing Strategy
- Unit tests: the version client (`fetchBackendVersion`: success, sentinel, non-OK, malformed shape) with a stubbed global `fetch`, following `frontend/src/api/notes.test.ts`; `AppFooter` with `../api/version` mocked (present, pending, rejected, sentinel), following `LandingPage.test.tsx`'s `vi.mock` pattern.
  - Directory: beside the module, `frontend/src/api/` and `frontend/src/components/` (project standards Layout)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: no new backend code, so no new integration test; criterion 5 is covered by TEST-05's existing router test in `backend/tests/integration/test_version_integration.py`.
  - Directory: backend/tests/integration/
- E2E tests: the footer on `/` shows `Task Notes v{backend version}`, the backend version read from `backend/pyproject.toml` in the spec; edge case: `page.route` aborts `**/api/version` and the footer reads exactly `Task Notes`. Prerequisite: the backend under E2E runs as an installed package (`uv run`), so `/api/version` returns the real version and not the `unknown` sentinel. TEST-04's spec is updated to the same source.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: footer shows the backend's version; footer shows the backend's version even though it differs from `frontend/package.json`; name-only footer when the backend is unreachable; edge case: name-only footer while the request is pending.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version from backend/pyproject.toml in the footer` | — |
| 2 | The version comes from one declared source, the backend's runtime `GET /api/version`, never typed into the component or read from frontend package.json | Unit | `shows the backend version, not the frontend package.json version`, `returns the version the backend reported, from the default base URL` | verifying it needs no navigation or interaction: which source the footer renders is provable with the client mocked to a value no package.json holds, and criterion 1's E2E spec exercises the real wiring end to end |
| 3 | When the version cannot be resolved, the footer renders without it, no undefined, null, unknown or empty gap | Unit | `shows only the app name when the version request fails`, `shows only the app name when the backend reports the unknown sentinel`, `returns null when the backend reports the unknown sentinel`, `throws when the version response has no version string`, `throws with the status and reason when the version response is not OK` | verifying it needs no navigation or interaction: it is a rendering rule over a failed or sentinel client result; the E2E edge spec `shows only the app name when /api/version is unreachable` adds the browser check |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version reported by the backend`, `shows only the app name when the version request fails` | the criterion is itself a component test requirement |
| 5 | GET /api/version returns the backend's version | Integration | `test_get_version_returns_200_with_version_from_pyproject` | verifying it needs no navigation or interaction: it is a router behaviour, already covered by TEST-05's existing test |
| 6 | Loading and failure states: the footer reads exactly Task Notes while pending and when unreachable | Unit | `shows only the app name while the version request is pending`, `shows only the app name when the version request fails` | verifying it needs no navigation or interaction: a pending promise and a rejection are deterministic in a component test and racy in a browser |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Go to `/`, expect `app-footer` to have text `Task Notes v{version from backend/pyproject.toml}` | Given the backend is running, When I open the landing page, Then the footer shows "Task Notes v" and the backend's version |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given frontend/package.json and backend/pyproject.toml hold different versions, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolvable version is omitted | Edge spec: abort `**/api/version` with `page.route`, go to `/`, expect `app-footer` to have exact text `Task Notes` | Given the backend is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version |
| 4 | Component test for both paths | covered at Unit, see Criterion coverage | Given the frontend unit suite, When I run it, Then the AppFooter tests pass |
| 5 | GET /api/version returns the backend version | covered at Integration, see Criterion coverage | Given the backend is running, When I request /api/version, Then the response carries the pyproject version |
| 6 | Loading and failure states | covered at Unit, see Criterion coverage | Given the version request is slow, When I open the landing page, Then the footer reads "Task Notes" until the version arrives |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: backend running on http://localhost:8010 through `uv run` (so its package metadata is installed), frontend running on http://localhost:5183. `backend/pyproject.toml` `[project].version` reads `0.1.0` at plan time; use whatever value it holds when you test.
1. Open http://localhost:5183/ → the landing page shows the heading "Task Notes" and the note form.
2. Scroll to the bottom of the page and read the footer → it reads exactly `Task Notes v0.1.0` (the backend's version).

### Criterion 2: The version comes from the backend at runtime, not from frontend/package.json
Prerequisites: as for criterion 1.
1. Open `frontend/package.json` and read its `version` field → it reads `0.0.0`.
2. Open http://localhost:8010/api/version in a browser tab → the page shows `{"version":"0.1.0"}`.
3. Open http://localhost:5183/ and read the footer → it reads `Task Notes v0.1.0`, matching step 2, and does not show `0.0.0`.
4. Stop the backend, change `version` in `backend/pyproject.toml` to `0.1.1`, start it again with `uv run` (do not rebuild or restart the frontend), and reload http://localhost:5183/ → the footer reads `Task Notes v0.1.1`. Revert the version to `0.1.0` afterwards.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: frontend running on http://localhost:5183, backend stopped.
1. Open http://localhost:5183/ → the page loads; the heading and note form are visible.
2. Read the footer → it reads exactly `Task Notes`, with no trailing `v`, and does not contain `undefined`, `null` or `unknown`.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed.
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run reports the tests `renders the version reported by the backend` and `shows only the app name when the version request fails` as passing, its summary line reports no failed or errored test, and the command exits 0.

### Criterion 5: GET /api/version returns the backend's version
Prerequisites: backend running on http://localhost:8010 through `uv run`.
1. Open http://localhost:8010/api/version → the response is `{"version":"0.1.0"}`, the same value as `[project].version` in `backend/pyproject.toml`.

### Criterion 6: Loading and failure states
Prerequisites: as for criterion 1, in Chrome.
1. Open http://localhost:5183/, open DevTools → Network, set throttling to "Slow 3G", and reload → while the `version` request is still pending the footer reads exactly `Task Notes`; once it completes the footer reads `Task Notes v0.1.0`.
2. In DevTools → Network, right-click the `version` request and choose "Block request URL", then reload → the footer reads exactly `Task Notes` and stays that way; it is never blank and never reads `unknown`.
