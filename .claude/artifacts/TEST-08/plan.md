# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria.** 1. The footer renders the version string on the landing page. 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component. 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap. 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

## Acceptance Criteria
Criterion 2 is amended and criterion 5 added by the tracker comment recorded under `## Re-Plan Feedback` (a comment overrides the description where the two disagree).
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. Amended: that source is the backend, read at runtime from `GET /api/version` (the backend's own `[project].version`), not `frontend/package.json` at build time; a frontend rebuilt against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved (the `/api/version` request fails, returns non-OK, returns an unusable body, or reports the backend's `unknown` sentinel), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (From the tracker comment) Before the `/api/version` request resolves, the footer has a defined loading state: it shows the app name only, with no placeholder text.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 amended as above. The footer stops importing `frontend/package.json` and fetches `GET /api/version` on mount through a new client module `frontend/src/api/version.ts`. **The endpoint already exists on `main`**: TEST-05 shipped `backend/app/routers/version.py`, `backend/app/services/version_service.py` and `backend/app/schemas/version.py`, returning `{"version": "<[project].version of backend/pyproject.toml>"}` with integration tests in `backend/tests/integration/test_version_integration.py`. This plan therefore adds no endpoint and does not duplicate it.
- Comment (tracker), same comment: "The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted." → Addressed by: **decision recorded**: in both the loading state and the failure state the footer is rendered (never blank, never removed) and reads exactly `Task Notes`, the app name with no version, no `v` prefix, no trailing space, and never the word `unknown`. Once the request resolves with a usable version it reads `Task Notes v{version}`. Reason: criterion 3 of the description already rules out a gap or a junk token, and a name-only footer is the one rendering that is true in every state (it never claims a version it does not have). The backend's own `unknown` sentinel (returned when its package metadata is not installed) is treated as unresolved for the same reason, so `Task Notes vunknown` can never render. Covered by criteria 3 and 5 and their tests.
- Comment (tracker), same comment: "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: stated here and in `## Backend Plan`. The comment's change is a backend **dependency**, not a backend **change**: the item now depends at runtime on `GET /api/version` (already delivered by TEST-05, a declared dependency of this item, status done), and no backend file is modified. The description's "Touches no backend file" stays literally true; its "genuinely parallel with TEST-07" framing does not, since the footer's output now depends on the backend being up. The File Manifest carries no `[B]` entry for that reason.
- Other comments on the task (mayker-dev bot notes from earlier, reset runs and one operator note about a past reset) → not acted on because they carry no requirement (per the dispatch).
- Assumption: the description's Notes say the item modifies `LandingPage.tsx`. With the fetch owned by `AppFooter.tsx`, `LandingPage.tsx` needs no change and is left untouched, which also removes the planned overlap with BUG-04; only its test file changes (it asserted the `package.json` version).
- Assumption: TEST-04's E2E spec asserts the footer shows the `frontend/package.json` version, which this item makes false by design, so this plan updates that spec to the backend version. TEST-04's committed UAT Gherkin and manual script (which say the same) are left as that item's historical record and are not edited; the new TEST-08 UAT artifacts supersede them.

## Plan Overview
Frontend only. `AppFooter` stops importing `frontend/package.json` and instead fetches the backend's version at runtime from the existing `GET /api/version` endpoint (TEST-05), through a new client module `frontend/src/api/version.ts`. The footer has three states: loading and failure both render `Task Notes`; success renders `Task Notes v{version}`. The API base URL, today a private constant of `frontend/src/api/notes.ts`, moves to one shared module so the notes client and the version client read it from one source. No backend, database, dependency or configuration change.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/apiBaseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`, so both clients take the base URL from one source (`coding_standards.md` Section 5, one value one source).
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./apiBaseUrl` instead of defining it; no behaviour change.
  - `frontend/src/api/version.ts` (new): `fetchVersion(): Promise<string>` calls `fetch(`${API_BASE_URL}/api/version`)`; on a non-OK response throws `Loading the version failed: {status} {statusText}` (same shape as `notes.ts`); on a body whose `version` is not a non-empty string throws `Loading the version failed: unexpected response`; otherwise returns the string. Exports the type `VersionResponse = { version: string }`. No retry and no timeout (a hanging request simply leaves the footer in its loading state, which reads correctly; a fetch timeout is CHORE-02's scope per the map).
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import; `useState<string | null>(null)` for the version; a mount-time `useEffect` calls `fetchVersion()` once, sets the version on success unless it equals the backend's sentinel `unknown` (constant `UNKNOWN_VERSION = "unknown"`, the value `backend/app/services/version_service.py` returns), and leaves it `null` on rejection; an `isMounted` guard as in `LandingPage.tsx` so a late resolve after unmount sets no state. Renders `{APP_NAME}` followed by ` v{version}` only when the version is non-null. Keeps `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and the existing `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified (it already renders `<AppFooter />`).
- Routes: none.
- State management: local component state in `AppFooter`; no global store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps its existing TEST-04 styling: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the same styling in every state.

## Backend Plan
No backend changes required.

The tracker comment asks for a `GET /api/version` endpoint; it already exists on `main` (TEST-05: `backend/app/routers/version.py`, registered in `backend/app/main.py`, answering 200 with `{"version": ...}` read from installed package metadata, and `unknown` when the metadata is missing). CORS already allows the frontend origin `http://localhost:5183` through `CORS_ORIGINS` (`backend/app/core/config.py`). The item therefore gains a runtime dependency on the backend but modifies no backend file.

## API Integration Plan
No external API integration.

## API Contract
Internal endpoint consumed (existing, unchanged, owned by TEST-05):
- Method: GET
- URL: `/api/version` on `API_BASE_URL` (`VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200 with JSON `{"version": "0.1.0"}` (the value of `[project].version` in `backend/pyproject.toml`); the literal `{"version": "unknown"}` when the backend's package metadata is not installed, which the frontend treats as unresolved.
- Frontend handling: non-OK status, network error, body without a non-empty string `version`, or the `unknown` sentinel all render the name-only footer `Task Notes`.

## Technology Selection
- Version fetch client (`frontend/src/api/version.ts`): chose the browser's native `fetch`, as `notes.ts` already does, over adding an HTTP library; no new dependency.
- Shared base URL module (`frontend/src/api/apiBaseUrl.ts`): chose a plain exported constant over a config library or a React context, because one `import.meta.env` read (Vite's native env mechanism) covers it.
- Footer loading and failure state: chose React's built-in `useState` and `useEffect` over a data-fetching library (none is installed, and one request on mount does not warrant one).
- No new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/apiBaseUrl.ts: single source of the API base URL shared by the notes and version clients
- [A] frontend/src/api/version.ts: client for GET /api/version (fetchVersion, VersionResponse)
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the version client, fetch stubbed
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec, footer shows the backend version, and the name-only footer when /api/version is unreachable
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/notes.ts: import API_BASE_URL from ./apiBaseUrl instead of defining it locally
- [A] frontend/src/components/AppFooter.tsx: drop the package.json import, fetch the version from the backend on mount, render name-only while loading and on failure
- [A] frontend/src/components/AppFooter.test.tsx: replace the package.json assertion with tests for the success, loading, failure and sentinel paths, with ../api/version mocked
- [A] frontend/src/components/LandingPage.test.tsx: mock ../api/version and assert the footer shows the mocked backend version instead of the package.json version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: assert the backend version read from backend/pyproject.toml instead of the frontend/package.json version, since the footer no longer shows the latter

No dependency is added or changed, so no lockfile is produced. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the change alters no project structure, run configuration, dependency or test infrastructure (the footer already ran against the same compose stack).

## Testing Strategy
- Unit tests: the version client (`fetchVersion`: URL, non-OK throw, bad-body throw) and the `AppFooter` component (success, loading, failure, sentinel), with the client mocked; `LandingPage` updated to mock the version client.
  - Directory: co-located with the source under `frontend/src/` (the project's existing Vitest convention, as `notes.test.ts` and `AppFooter.test.tsx`)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`
- Integration tests: no new integration tests. The only endpoint involved is TEST-05's unchanged `GET /api/version`, already covered by `backend/tests/integration/test_version_integration.py`; this item adds no router, repository or migration.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: footer on the running landing page shows the backend version; edge case: with `/api/version` aborted through `page.route`, the footer reads exactly `Task Notes`. The expected version is read from `backend/pyproject.toml`, the declared source, in the spec.
  - Directory: e2e/tests/
  - File: TEST-08_footer_app_version.spec.ts (and TEST-04_page_footer.spec.ts updated)
- UAT scenarios: one scenario per criterion plus the backend-unreachable edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | `shows the backend version from /api/version in the landing page footer` | — |
| 2 | The version comes from the backend at runtime via GET /api/version, never typed into the component nor read from package.json | Unit | `renders the version returned by /api/version, not the frontend package version`, `fetches the version from /api/version on the default base URL` | verifying it needs no navigation or interaction: the component renders whatever the mocked client returns (a value distinct from package.json) and the client is shown to call /api/version |
| 3 | When the version cannot be resolved, the footer renders without it (no undefined, null, unknown or gap) | Unit | `renders the app name only when /api/version is unreachable`, `renders the app name only when the backend reports the unknown sentinel`, `throws with the status and reason when the response is not OK`, `throws when the response has no version string` | verifying it needs no navigation or interaction: it is the component's rendering of a rejected or sentinel result; the browser edge case is an additional E2E spec, not the covering tier |
| 4 | A component test asserts both paths: version present, and version absent | Unit | `renders the version returned by /api/version, not the frontend package version`, `renders the app name only when /api/version is unreachable` | the criterion is itself about component tests |
| 5 | Before /api/version resolves, the footer shows the app name only | Unit | `renders the app name only while the version is loading` | verifying it needs no navigation or interaction: it is the component's initial render with a pending client promise |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")`, `getByTestId("app-footer")` contains `v{backend pyproject version}` | Given the stack is running, When I open the landing page, Then the footer shows "Task Notes v0.1.0" |
| 2 | Version comes from the backend at runtime | covered at Unit, see Criterion coverage | Given the backend version differs from the frontend package version, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolvable version renders name-only | covered at Unit, see Criterion coverage; edge spec `renders the app name only when /api/version is unreachable` aborts the route | Given the backend is stopped, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run it, Then the AppFooter tests pass with 0 failed |
| 5 | Loading state is name-only | covered at Unit, see Criterion coverage | Given a slow /api/version, When the page first renders, Then the footer reads "Task Notes" until the version arrives |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repo root with `docker compose up -d --build`; `backend/pyproject.toml` reads `version = "0.1.0"`.
1. Open `http://localhost:5183/` in a browser → the landing page shows the heading "Task Notes" and the note form.
2. Scroll to the bottom of the page → the footer reads `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime
Prerequisites: the stack is running as for Criterion 1; `frontend/package.json` reads `"version": "0.0.0"`.
1. Open `http://localhost:8010/api/version` in a browser tab → the response body is `{"version":"0.1.0"}`.
2. Open `http://localhost:5183/`, then open the browser DevTools Network tab and reload → a request to `http://localhost:8010/api/version` appears with status 200.
3. Read the footer → it reads `Task Notes v0.1.0` (the backend's version), and never `v0.0.0` (the frontend package version).

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: the stack is running as for Criterion 1.
1. In a terminal at the repo root run `docker compose stop backend` → the backend container stops.
2. Open `http://localhost:5183/` and reload → the page renders; the footer is visible and reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap.
3. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run includes `renders the version returned by /api/version, not the frontend package version` and `renders the app name only when /api/version is unreachable`, with 0 failed.

### Criterion 5: Before /api/version resolves, the footer shows the app name only
Prerequisites: the stack is running as for Criterion 1; Chrome or Edge DevTools available.
1. Open `http://localhost:5183/`, open DevTools → Network, and set throttling to "Slow 3G" (or add a request-blocking pattern `*/api/version` to simulate a request that never completes).
2. Reload the page and watch the footer while the `/api/version` request is pending → the footer reads `Task Notes` with no placeholder text.
3. Remove the block (or the throttling) and reload → the footer reads `Task Notes v0.1.0`.
