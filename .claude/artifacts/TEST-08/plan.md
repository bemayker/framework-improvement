# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written on the ticket).**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (ClickUp task 123k99ctgch. The newest tracker comment corrects criterion 2 and the "frontend only" note; see Re-Plan Feedback. The criteria below are the amended ones.)

## Acceptance Criteria
- [ ] 1. The landing page footer renders the version string.
- [ ] 2. The version shown is the **backend's** version, fetched at runtime from `GET /api/version`, whose single declared source is `[project].version` in `backend/pyproject.toml` (read through package metadata). It is never a string typed into the component and never the frontend's own `package.json` version: a frontend running against an older backend shows the backend's version. (Amended by the tracker comment, which overrides the ticket's "frontend package metadata or a build-time variable".)
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap. The loading and failure states are decided as follows: **before the fetch resolves, and whenever it fails, the footer reads exactly `Task Notes`** (the app name, with no `v` suffix, no placeholder, and no `unknown`). The footer element itself is always rendered; it is never blank.
- [ ] 4. A component test asserts both paths: version present, and version absent (which covers both the loading state and the failure state).
- [ ] 5. A `GET /api/version` endpoint returns the backend's version. (Added by the tracker comment. It already exists on `main`, delivered by TEST-05, so this plan verifies it and adds no backend code.)

## Re-Plan Feedback
- Comment (orchestrator plan verdict, run deliver-20261101T062150Z): "1. Add to `### Modified files`: `[G] e2e/uat/scenarios/TEST-04_page_footer.feature`: replace the frontend/package.json reference (line 15) with the backend's version as served by GET /api/version (`[project].version` in backend/pyproject.toml). 2. Add to `### Modified files`: `[G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md`: prerequisites (line 9) and step 4 (line 26) compare the footer to `backend/pyproject.toml`'s `version` (or the `GET /api/version` response) instead of `frontend/package.json`. 3. Mirror both in `shared_risks.md` under "Existing files this feature will modify"." → Addressed by:
  - Both TEST-04 UAT artifacts were read and confirmed: the scenario file's line 15 reads `And that version number matches the "version" field of frontend/package.json`; the script's prerequisites line 9 tells the tester to open `frontend/package.json`, and step 4 (line 26) compares the footer to that file. Once this item ships, both would describe a footer that no longer exists.
  - Two `[G]` entries are added under `### Modified files`, and both are mirrored in `shared_risks.md`. Only the version-source lines change. The other stale details in those files (port 5173, `cd frontend && npm test`) are not touched, because the verdict did not ask for them and they are not this item's change.
  - Nothing else in the plan changed.
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by:
  - Version source: criterion 2 is rewritten. The footer fetches `GET /api/version` at runtime through a new client module `frontend/src/api/version.ts`, and `AppFooter.tsx` stops importing `frontend/package.json`.
  - The endpoint: `GET /api/version` **already exists on `main`** (checked against HEAD and `origin/main` 77b48c2). TEST-05 delivered it as `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py`, registered in `backend/app/main.py`, and it returns `{"version": "<[project].version from backend/pyproject.toml>"}`. The endpoint also already answers without a database, and CORS already allows `GET` from `http://localhost:5183`. Adding it again would duplicate TEST-05, so the plan adds no backend file. It is recorded as criterion 5 and covered by the existing `backend/tests/integration/test_version_integration.py`.
  - Backend change: this item is **no longer frontend-only**. It now has a runtime dependency on the backend, and on TEST-05's endpoint, which the feature map already lists as a dependency. That is said here, in `## Plan Overview` and in `## Backend Plan`. It changes **no backend file** because the endpoint is already there. If TEST-05's code had been absent from main, the endpoint would have been a `[B]` entry here.
  - Loading state: the footer reads `Task Notes`, with no version, no placeholder and no spinner.
  - Failure state: the footer also reads `Task Notes`. Failure means the backend is unreachable, the response is not 2xx, the body has an unexpected shape, the version is blank, or the backend reports its own `unknown` sentinel (`version_service.UNKNOWN_VERSION`, returned when package metadata is missing). The choice is recorded: **never `unknown` and never a blank footer**. The ticket's criterion 3 already rules out the empty gap, and showing a word that carries no version would answer the version question falsely. The backend's `unknown` is therefore treated as "not resolved" rather than displayed.
- Comment (tracker, other comments on the item): the framework's own "PR opened" notices from earlier runs, whose work a reset removed from main, and an operator reset note → not acted on, because they carry no requirement. They were received as a summary in the dispatch, not verbatim.
- Merged since the last plan: n/a (no `[merged-since]` lines in this re-plan's dispatch).

## Plan Overview
The footer changes from the frontend's own build-time version (`frontend/package.json`, imported into `AppFooter.tsx` by TEST-04) to the backend's version, fetched at runtime from the existing `GET /api/version`.

Frontend:
- a new API client `frontend/src/api/version.ts`;
- a shared API base-URL module `frontend/src/api/baseUrl.ts`, extracted from `notes.ts`, so the base URL keeps one source (`coding_standards.md` Section 5);
- `AppFooter.tsx` fetches the version on mount and renders `Task Notes v{version}`, or `Task Notes` while loading or when the version is unresolved.

`LandingPage.tsx` is **not** modified: the footer owns its fetch. Only `LandingPage.test.tsx` changes, because it currently asserts the `package.json` version.

Backend: **this item now depends on the backend at runtime**, a change from the ticket's "frontend only" framing that the tracker comment asked to be stated. No backend file is created or modified, because TEST-05's `GET /api/version` already provides exactly what the comment asks for.

E2E: a new TEST-08 spec. TEST-04's footer spec is also modified, because it asserts the `frontend/package.json` version, which the footer no longer shows. Both specs read the expected version from one helper.

UAT: TEST-04's Gherkin scenario and manual UAT script are also modified, for the same reason: both compare the footer to `frontend/package.json`, and after this item they compare it to the backend's version (`[project].version` in `backend/pyproject.toml`, as served by `GET /api/version`).

## Frontend Plan
- Components to create or modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, which is `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`. This moves the existing constant and its default out of `notes.ts` unchanged.
  - `frontend/src/api/notes.ts` (modified): imports `API_BASE_URL` from `./baseUrl` instead of defining it. No behaviour change.
  - `frontend/src/api/version.ts` (new): exports `getBackendVersion(): Promise<string | null>`. It calls `fetch(`${API_BASE_URL}/api/version`)` and handles the cases as follows:
    - **not OK:** throws `Loading the version failed: {status} {statusText}`, the same message shape as `notes.ts`;
    - **body that is not an object with a string `version`:** throws an unexpected-shape error;
    - **reported `version` that is blank after trimming, or equal to `unknown`:** returns `null`;
    - **otherwise:** returns the trimmed version.
    
    It reads only the `version` field, so an added field such as TEST-09's planned build commit does not break it. Network errors propagate as the rejected `fetch` promise. There is no retry and no timeout: a hung request leaves the footer in its loading rendering, which is identical to the failure rendering, so a timeout would change nothing visible. Retry is not asked for.
  - `frontend/src/components/AppFooter.tsx` (modified):
    - remove the `package.json` import;
    - add `useState<string | null>(null)`, plus a `useEffect` that calls `getBackendVersion()` once on mount with an `isMounted` guard (the same pattern as `LandingPage.tsx`), sets the state on resolve, and leaves it `null` on rejection;
    - render `Task Notes v{version}` when `version` is non-null, and exactly `Task Notes` otherwise, with no trailing space, no `v` and no placeholder;
    - keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged;
    - wrap the version in `<span data-testid="app-version">` so tests can assert its presence or absence without parsing the text.
- Routes: none (the footer is on `/`).
- State management: local component state in `AppFooter`. No context and no store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer values are kept unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem.

## Backend Plan
No backend changes required.

This is a deliberate statement, because the tracker comment turns the item into one that depends on the backend: the footer now reads `GET /api/version` at runtime. That endpoint already exists on `main`, from TEST-05. It returns `{"version": "0.1.0"}` today, from `[project].version` in `backend/pyproject.toml` via `importlib.metadata`, and it is covered by `backend/tests/integration/test_version_integration.py`. The plan therefore creates and modifies no backend file. CORS already allows `GET` from the frontend origin (`backend/app/main.py`, `backend/app/core/config.py`).

## API Integration Plan
No external API integration. The only API consumed is this project's own backend, through `frontend/src/api/version.ts`.

## API Contract
- Method: GET
- URL: `/api/version` (backend, base URL `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200 with JSON body `{"version": "0.1.0"}`. The value is `[project].version` of `backend/pyproject.toml`, or the sentinel `"unknown"` when package metadata is missing. The frontend treats `"unknown"` and a blank value as unresolved. Unknown extra fields are ignored.
- Errors: a non-2xx status, a network failure or an unexpected body shape makes the client throw, and the footer renders `Task Notes` with no version.

## Technology Selection
- Version fetch (`frontend/src/api/version.ts`): chose the browser's native `fetch` over adding axios or a data-fetching library such as react-query, because `fetch` is what `notes.ts` already uses and covers one GET.
- Loading and failure state in `AppFooter`: chose React's `useState` and `useEffect`, which are already installed, over a data-fetching library. One request on mount needs nothing more.
- Shared base URL (`frontend/src/api/baseUrl.ts`): no stdlib call, native feature or dependency covers it. It is a three-line module extracted from `notes.ts`, so the second client does not restate the default URL.
- Backend version source: chose the existing `importlib.metadata` path in TEST-05's `version_service.py` (standard library) and added nothing.
- E2E expected-version helper (`e2e/helpers/backendVersion.ts`): chose Node's `node:fs` plus one regular expression over `[project]`'s `version = "..."` line, instead of adding a TOML parser dependency to the root `package.json`. The file is the project's own, and one line is read.
- No new dependency is added anywhere.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: the single source of the API base URL (`VITE_API_BASE_URL`, default `http://localhost:8010`), extracted from notes.ts
- [A] frontend/src/api/version.ts: `getBackendVersion()` client for GET /api/version, which normalizes a blank version or `unknown` to null and throws on non-OK or an unexpected shape
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client, with `fetch` stubbed
- [D] e2e/helpers/backendVersion.ts: reads `[project].version` from backend/pyproject.toml, the expected footer version for the E2E specs
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E specs for the footer showing the backend version, plus edge cases (backend version differs from the frontend's, and /api/version unreachable)
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from ./baseUrl instead of defining it, with no behaviour change
- [A] frontend/src/components/AppFooter.tsx: fetch the backend version on mount; render `Task Notes v{version}` or exactly `Task Notes`; drop the package.json import
- [A] frontend/src/components/AppFooter.test.tsx: rewrite with `../api/version` mocked, covering version present, loading, failure (rejection), and the client returning null
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of the package.json version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: take the expected version from e2e/helpers/backendVersion.ts instead of frontend/package.json, because the footer no longer shows the frontend version
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: replace the frontend/package.json reference (line 15) with the backend's version as served by GET /api/version (`[project].version` in backend/pyproject.toml)
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisites (line 9) and step 4 (line 26) compare the footer to `backend/pyproject.toml`'s `version` (or the GET /api/version response) instead of `frontend/package.json`

No dependency manifest changes, so no lockfile is regenerated. README.md and docs/DEVELOPMENT.md need no edit: the feature changes no project structure, run configuration, dependency or test infrastructure. The footer reads an endpoint that is already documented by TEST-05, and the compose wiring is unchanged.

## Testing Strategy
- Unit tests: the version client (`frontend/src/api/version.test.ts`, with `fetch` stubbed) covers these cases:
  - a 200 response returns the trimmed version from the default base URL;
  - `unknown` returns null;
  - a blank version returns null;
  - non-OK throws with the status;
  - an unexpected shape throws;
  - a rejected fetch propagates;
  - an extra field is ignored.

  The footer component (`frontend/src/components/AppFooter.test.tsx`, with `../api/version` mocked) covers these cases:
  - version present: `Task Notes v0.1.0` and `app-version` are present;
  - loading, while the promise is still pending: the text is exactly `Task Notes` and `app-version` is absent;
  - failure (rejected): exactly `Task Notes`, and no `undefined`, `null` or `unknown`;
  - null (unresolved): exactly `Task Notes`;
  - a mocked version different from `frontend/package.json` (`9.9.9`) is what renders;
  - the contentinfo landmark and test id are kept.

  `LandingPage.test.tsx` asserts the footer shows the mocked backend version.
  - Directory: frontend Vitest tests sit beside their modules under `frontend/src/` (the project's existing convention). The backend unit directory `backend/tests/unit/` needs no change.
  - Naming: `{module}.test.ts(x)`
- Integration tests: no new test. Criterion 5's endpoint is already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, works without a database, 405 on POST).
  - Directory: backend/tests/integration/
- E2E tests:
  - TEST-08 spec, first case: open `/`, and the footer contains `Task Notes v{backend version from pyproject}`.
  - TEST-08 spec, second case: `page.route` fulfils GET /api/version with a version of `9.9.9-e2e`, and the footer reads `Task Notes v9.9.9-e2e`. This proves the footer shows the backend's value and not its own.
  - TEST-08 spec, third case (edge case): `page.route` aborts /api/version, and the footer reads exactly `Task Notes`.
  - TEST-04 spec: updated to the backend version.

  Route matching must compare the request URL's pathname to `/api/version` exactly. A substring or glob such as `**/api/version*` also matches Vite's module URL for `src/api/version.ts`, the same trap TEST-03's spec documents for notes.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts
- UAT scenarios: one per criterion plus the unreachable-backend edge case. TEST-04's scenario file and manual script are updated so their version comparison names the backend's version.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The landing page footer renders the version string | E2E | — |
| 2 | The version is the backend's, fetched at runtime from GET /api/version, never typed in and never the frontend's package.json | Unit | verifying it needs no navigation or interaction: a component test with the client mocked to return a version different from frontend/package.json proves the footer renders the fetched value, and the client test proves the URL. The E2E route-fulfil case adds a browser check but is not required |
| 3 | Unresolved version: the footer reads exactly `Task Notes`, while loading and on failure, never undefined, null, unknown or an empty gap | Unit | verifying it needs no navigation or interaction: the pending, rejected and null client results are rendering branches of one component, and the E2E abort case is the feature's edge-case spec |
| 4 | A component test asserts version present and version absent | Unit | the criterion is itself a component test (AppFooter.test.tsx) |
| 5 | GET /api/version returns the backend's version | Integration | verifying it needs no navigation or interaction: it is a router behaviour, already covered by backend/tests/integration/test_version_integration.py |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | Open `/`, getByTestId app-footer contains `Task Notes v` plus the version from backend/pyproject.toml | Given the stack is running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Version is the backend's at runtime | covered at Unit, see Criterion coverage (plus the E2E route-fulfil case with 9.9.9-e2e) | Given the backend reports version "9.9.9", When I open the landing page, Then the footer reads "Task Notes v9.9.9" and not the frontend's "0.0.0" |
| 3 | Unresolved: footer reads `Task Notes` | covered at Unit, see Criterion coverage (plus the E2E abort edge case) | Given /api/version is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When AppFooter.test.tsx runs, Then 0 tests fail |
| 5 | GET /api/version returns the backend version | covered at Integration, see Criterion coverage | Given the backend is running, When I GET /api/version, Then I receive 200 with {"version": "0.1.0"} |

## Manual verification plan
### Criterion 1: The landing page footer renders the version string
Prerequisites: the stack is running with `docker compose up -d --build` from the repository root (frontend at http://localhost:5183, backend at http://localhost:8010). `backend/pyproject.toml` has `version = "0.1.0"`.
1. Open http://localhost:5183/ in Chrome → the landing page shows the heading "Task Notes" and the note form.
2. Scroll to the bottom of the page → the footer reads `Task Notes v0.1.0`.

### Criterion 2: The version is the backend's, fetched at runtime, not the frontend's package.json
Prerequisites: same as Criterion 1. `frontend/package.json` has `"version": "0.0.0"`.
1. Open http://localhost:5183/ with Chrome DevTools open on the Network tab and the filter set to `version` → one request to `http://localhost:8010/api/version` with status 200, response `{"version":"0.1.0"}`.
2. Read the footer → it reads `Task Notes v0.1.0`, the backend's version, and does not contain `0.0.0`, the frontend's own version.
3. In `backend/pyproject.toml`, change `version = "0.1.0"` to `version = "0.1.1"`, run `docker compose up -d --build backend`, then reload http://localhost:5183/ without rebuilding the frontend → the footer reads `Task Notes v0.1.1`.
4. Revert `backend/pyproject.toml` to `version = "0.1.0"` and run `docker compose up -d --build backend` → after a reload, the footer reads `Task Notes v0.1.0` again.

### Criterion 3: Loading and failure render `Task Notes` with no version
Prerequisites: same as Criterion 1.
1. In Chrome DevTools, set Network throttling to "Slow 3G" and reload http://localhost:5183/ → while the `/api/version` request is still pending, the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no "loading" text. After it resolves, it reads `Task Notes v0.1.0`. Set throttling back to "No throttling".
2. Run `docker compose stop backend`, then reload http://localhost:5183/ → the footer is visible and reads exactly `Task Notes`, with nothing after the name.
3. Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0"}`, then reload the page → the footer reads `Task Notes v0.1.0`.

### Criterion 4: A component test asserts version present and version absent
Prerequisites: frontend dependencies are installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports 0 failed, and the AppFooter tests include a version-present case and the version-absent cases (pending, rejected and null).

### Criterion 5: GET /api/version returns the backend's version
Prerequisites: the backend is running at http://localhost:8010.
1. Run `curl -s -i http://localhost:8010/api/version` → `HTTP/1.1 200 OK` and the body `{"version":"0.1.0"}`.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → 0 failed.
