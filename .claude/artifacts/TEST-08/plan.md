# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written on the ticket):**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> **Tracker correction comment (overrides the description where they disagree):** the version must come from the backend at runtime via `GET /api/version`, not from `package.json` at build time; record the loading and failure states; say explicitly that this adds a backend dimension to a "frontend-only" item.

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. Per the tracker correction, that source is the backend's own version, fetched at runtime from `GET /api/version`; a frontend rebuilt against an older backend shows the backend's version, not its own `package.json` version.
- [ ] 3. When the version cannot be resolved (still loading, `/api/version` unreachable or non-OK, malformed body, or the backend's `unknown` sentinel), the footer renders without it rather than showing `undefined`, `null`, `unknown` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (From the tracker correction comment) `GET /api/version` returns the backend's version, and it is that value the footer shows.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by, point by point:
  * Source of the version: criterion 2 is rewritten above. The footer drops its `import { version } from "../../package.json"` and fetches `GET /api/version` through a dedicated client `frontend/src/api/version.ts`. The ticket's "frontend package metadata or a build-time variable" wording is superseded by the comment.
  * "Add a GET /api/version endpoint": **the endpoint already exists on `main`**, delivered by TEST-05 (`backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, covered by `backend/tests/integration/test_version_integration.py`). It returns `{"version": "<backend pyproject version>"}` read from installed package metadata, so it already is the backend's own version. CORS already allows `GET` from `http://localhost:5183`. This plan therefore **adds no backend file**: the backend dimension the comment asks to be named is real (the item now depends on a backend endpoint at runtime and is no longer "frontend only" in behaviour), but its backend work was already delivered by TEST-05, which TEST-08 already depends on in `feature_map.md`. Stated here, in `## Backend Plan`, and in `shared_risks.md`, so its absence from the File Manifest is explained rather than silent. Criterion 5 is covered by the existing integration tests, unchanged.
  * Loading state (decided): before the fetch resolves the footer reads exactly `Task Notes`, with no version, no placeholder, no spinner, and no trailing space or `v`.
  * Failure state (decided): when `/api/version` is unreachable, answers non-OK, returns a body without a non-empty string `version`, or returns the backend's own `unknown` sentinel (`UNKNOWN_VERSION` in `version_service.py`, returned when package metadata is missing), the footer reads exactly `Task Notes`. **Chosen: app name without a version, never a blank footer and never the word `unknown`.** Reason: the ticket's criterion 3 already says "renders without it", the footer keeps identifying the app (TEST-04's contract), and `unknown` would read as if it were a version string. Treating the backend's `unknown` sentinel as unresolved is an assumption recorded here: the backend uses it to mean "I could not resolve my version", which is criterion 3's case.
  * Not acted on: a fetch timeout. A hanging request simply leaves the footer in its loading state (`Task Notes`), which is already an acceptable answer; a timeout is not in the criteria (`user_story_alignment.md` Section 3) and is tracked separately in `feature_map.md` as CHORE-02's scope.

## Plan Overview
Frontend-only code change against an existing backend endpoint. `AppFooter` stops importing the version from `frontend/src/package.json` at build time and fetches it once on mount from `GET /api/version` through a new client module, `frontend/src/api/version.ts`. The API base URL, today a private constant of `frontend/src/api/notes.ts`, moves to `frontend/src/api/baseUrl.ts` so both clients share one source (`coding_standards.md` Section 5: one value, one source). `LandingPage.tsx` is **not** modified: the footer owns its own fetch, so the page renders `<AppFooter />` unchanged. Tests that pinned the `package.json` version (TEST-04's component, page, E2E and UAT artifacts) are updated to the backend's version, since that is now the declared source.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts` with its comment.
  - `frontend/src/api/version.ts` (new): `fetchAppVersion(): Promise<string | null>`. Calls `${API_BASE_URL}/api/version`; on a non-OK response throws `Error("Loading the version failed: {status} {statusText}")` (same shape as `notes.ts`); on an OK body whose `version` is not a non-empty string, or equals `"unknown"`, returns `null`; otherwise returns the trimmed version. Exports the `VersionResponse` type `{ version: string }`. No `any`.
  - `frontend/src/api/notes.ts` (modify): import `API_BASE_URL` from `./baseUrl` and delete its local `DEFAULT_API_BASE_URL` and `API_BASE_URL` constants. Behaviour unchanged; `notes.test.ts` keeps passing unmodified (it re-imports after `vi.resetModules()`, which re-evaluates `baseUrl.ts`).
  - `frontend/src/components/AppFooter.tsx` (modify): remove the `package.json` import; hold `version: string | null` in `useState(null)`; in a mount `useEffect` call `fetchAppVersion()`, set the result on resolve, set `null` on reject, guarded by an `isMounted` flag (the pattern `LandingPage.tsx` already uses). Render `{APP_NAME}` followed by ` v{version}` only when `version` is non-null, so the text is exactly `Task Notes` when absent and `Task Notes v0.1.0` when present. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local component state in `AppFooter` only.
- Design reference notes: AI freestyle (Design Reference mode NONE); the existing footer style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`) is kept unchanged.

## Backend Plan
No backend changes required. The tracker comment asks for a `GET /api/version` endpoint returning the backend's version; that endpoint is already on `main` from TEST-05 (`backend/app/routers/version.py`, service `get_app_version()` reading `task-notes-backend` package metadata, `VersionResponse` schema, router registered in `backend/app/main.py`, CORS allowing `GET` from the frontend origin) with integration tests in `backend/tests/integration/test_version_integration.py`. This item consumes it and changes none of it.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200 `{"version": "0.1.0"}` (the backend's `[project].version` from `backend/pyproject.toml`); `{"version": "unknown"}` when the backend's package metadata is not installed, which the frontend treats as unresolved. Existing contract from TEST-05, unchanged.

## Technology Selection
- Version fetch client (`frontend/src/api/version.ts`): chose the browser's native `fetch` (already the notes client's mechanism) over any HTTP library; nothing new is installed.
- Shared base URL (`frontend/src/api/baseUrl.ts`): a plain module constant over a config library or a React context; a few lines cover it.
- Loading and failure states in `AppFooter`: React `useState`/`useEffect` (installed) over a data-fetching library such as React Query, which this project does not install and one request does not warrant.
- E2E failure and partial-deploy simulation: Playwright's built-in `page.route` (installed) over a mock server.
- No new dependency, so no lockfile changes.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: the single `API_BASE_URL` both API clients import
- [A] frontend/src/api/version.ts: `fetchAppVersion()` client for `GET /api/version`, null on an unresolved version
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the client with `fetch` stubbed
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E spec: footer shows the backend's version, the partial-deploy case, and the unreachable case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus the edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/components/AppFooter.tsx: fetch the version at runtime, render `Task Notes` alone while loading and on failure
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert present, loading, rejected, and null paths; drop the `package.json` import
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of `package.json`'s
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of declaring it
- [D] e2e/tests/TEST-04_page_footer.spec.ts: compare the footer against the backend's `/api/version` response instead of `frontend/package.json`
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the expected version is the backend's `/api/version` value, not `frontend/package.json`'s
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: steps 4 and the prerequisite compare against `http://localhost:8010/api/version` instead of `frontend/package.json`

No dependency is added or changed, so no lockfile is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `frontend/src/api/version.test.ts` (stub `fetch` like `notes.test.ts`): returns the version on 200, calls `${API_BASE_URL}/api/version`, returns `null` for `{"version": "unknown"}`, for `{"version": ""}` and for a body without `version`, throws with status and reason on a non-OK response. `frontend/src/components/AppFooter.test.tsx` (mock `../api/version`): present path shows `Task Notes v9.9.9` from a mocked `9.9.9` that differs from `package.json`'s `0.0.0`; loading path shows exactly `Task Notes` before the promise settles; rejected path and `null` path show exactly `Task Notes` and contain neither `undefined`, `null`, `unknown` nor a trailing ` v`; landmark and test id kept. `LandingPage.test.tsx` mocks the version client.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (the frontend's established Vitest convention; `CLAUDE.md`'s `backend/tests/unit/` applies to backend tests, and no backend test is added)
  - Naming: `{module}.test.ts(x)`, test names describe the scenario
- Integration tests: no new ones; the endpoint is unchanged and already covered by `backend/tests/integration/test_version_integration.py` (200 with the pyproject version, answers without a database, 405 on POST), which covers criterion 5.
  - Directory: `backend/tests/integration/`
- E2E tests: `e2e/tests/TEST-08_footer_app_version.spec.ts`: (a) load `/`, capture the `GET /api/version` response matched on exact pathname `/api/version` (a substring match also catches Vite serving `src/api/version.ts`, the pitfall TEST-03's spec documents), assert the footer contains `v{response.version}`; (b) partial deploy: `page.route` fulfils `/api/version` with `{"version": "9.9.9-backend"}`, assert the footer reads `Task Notes v9.9.9-backend`; (c) edge case: `page.route` aborts `/api/version`, assert the footer has text exactly `Task Notes`. TEST-04's spec switches its expected version to the backend's response the same way.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one Gherkin scenario per criterion plus the unreachable-backend edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from one declared source, the backend at runtime via `/api/version`, never typed into the component | Unit | verifying it needs no navigation or interaction: a mocked client returning `9.9.9` against `package.json`'s `0.0.0` proves the footer renders the fetched value, and the client test proves the URL (the E2E partial-deploy test adds runtime evidence) |
| 3 | When the version cannot be resolved, the footer renders without it | Unit | verifying it needs no navigation or interaction: loading, rejected, `null` and `unknown` are component and client state, driven by mocks (the E2E abort test is the feature's edge-case spec) |
| 4 | A component test asserts both paths: present and absent | Unit | the criterion is itself a component test |
| 5 | `GET /api/version` returns the backend's version, and the footer shows that value | Integration | verifying the endpoint needs no navigation or interaction: it is router behaviour, covered by the existing `test_version_integration.py`; the footer half is criterion 1's E2E test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version | Load `/`, assert footer contains `v` plus the version the page's own `/api/version` response carried | Given the app is running When I open the landing page Then the footer shows "Task Notes v" and the backend's version |
| 2 | Version from the backend at runtime | covered at Unit, see Criterion coverage; E2E partial-deploy test fulfils `/api/version` with `9.9.9-backend` | Given the backend reports a version different from the frontend's package When I open the landing page Then the footer shows the backend's version |
| 3 | Unresolved version is omitted | covered at Unit, see Criterion coverage; E2E aborts `/api/version` and expects exactly `Task Notes` | Given the backend is unreachable When I open the landing page Then the footer reads "Task Notes" with no version, "undefined", "null" or "unknown" |
| 4 | Component test covers both paths | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter tests Then the present and absent cases pass |
| 5 | Endpoint returns the backend version | covered at Integration, see Criterion coverage | Given the backend is running When I request /api/version Then I receive its pyproject version |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repository root with `docker compose up -d --build` (frontend on `http://localhost:5183`, backend on `http://localhost:8010`).
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0"}` (or whatever `backend/pyproject.toml` `[project].version` now holds); note the value.
2. Open `http://localhost:5183/` → the landing page with the "Task Notes" heading loads.
3. Scroll to the bottom of the page and read the footer → it reads `Task Notes v0.1.0`, the value noted in step 1.

### Criterion 2: The version comes from the backend at runtime, not the frontend's package.json
Prerequisites: as Criterion 1; `frontend/package.json` `version` is `0.0.0` and `backend/pyproject.toml` `version` is `0.1.0` (they differ, which is what makes this check meaningful).
1. Open `http://localhost:5183/` and read the footer → it reads `Task Notes v0.1.0`, the backend's version, and not `Task Notes v0.0.0`.
2. Open the browser's developer tools, Network tab, reload the page → one `GET` request to `http://localhost:8010/api/version` with status 200 and response `{"version":"0.1.0"}`.
3. Open `frontend/src/components/AppFooter.tsx` in an editor → it contains no `package.json` import and no version string literal.

### Criterion 3: An unresolved version is omitted, never shown as undefined, null, unknown or a gap
Prerequisites: as Criterion 1.
1. From the repository root run `docker compose stop backend` → the backend container stops; the frontend keeps running.
2. Open `http://localhost:5183/` and reload → the page loads; the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing space.
3. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, then reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths, version present and version absent
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` → the run lists the present, loading, rejected and null cases of `AppFooter.test.tsx` and the client cases of `version.test.ts`, and reports `0 failed`.

### Criterion 5: GET /api/version returns the backend's version, and the footer shows that value
Not a UI behaviour on its own; the observable checks are:
1. Run `curl -s http://localhost:8010/api/version` with the stack up → `{"version":"0.1.0"}`, equal to `backend/pyproject.toml` `[project].version`.
2. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` with the stack's database reachable → `0 failed`.
3. The footer half is Criterion 1, step 3.
