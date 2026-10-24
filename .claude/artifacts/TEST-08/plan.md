# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What:** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria (as written on the item):**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes:** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (Source: ClickUp task 123k99ctgch. The tracker comment recorded under Re-Plan Feedback corrects criterion 2 and adds the loading/failure decision; the criteria below are the corrected set this plan builds to.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. (amended by tracker comment) The version comes from a single declared source, the backend's version as reported at runtime by `GET /api/version` (backend package metadata, `[project].version` in `backend/pyproject.toml`), never from `frontend/package.json` at build time and never a string typed into the component. A frontend built against an older or newer backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (added by tracker comment) The footer's loading state (before `/api/version` answers) and failure state (`/api/version` unreachable or unusable) are decided and recorded in this plan, and each is covered by a test.

## Re-Plan Feedback
- Comment (tracker): "Correction to the description before this gets built. The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own. [...] Two consequences I want handled explicitly rather than assumed: The footer now has a loading state and a failure state. Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers and I want the choice recorded, not defaulted. This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by, point by point:
  - Runtime source: acted on. Criterion 2 is amended (above). `AppFooter.tsx` stops importing `frontend/package.json` and fetches `GET /api/version` once on mount through a new API client module, `frontend/src/api/version.ts`.
  - "Add a GET /api/version endpoint": not added, because it already exists. `backend/app/routers/version.py` (TEST-05, merged) serves `GET /api/version` returning `{"version": "<str>"}`, resolved by `backend/app/services/version_service.py` from installed package metadata (`importlib.metadata.version("task-notes-backend")`, i.e. `[project].version` in `backend/pyproject.toml`, currently `0.1.0`), registered in `backend/app/main.py`, and covered by `backend/tests/integration/test_version_integration.py`. CORS already admits a `GET` from `http://localhost:5183` (`backend/app/core/config.py`, `backend/app/main.py`). Writing a second endpoint would duplicate it, so the plan reuses it.
  - Backend scope, stated explicitly: **this item is no longer frontend-only in what it depends on, but it modifies no backend file.** The footer now has a runtime dependency on the backend's `GET /api/version` contract (API Contract below), so a change to that endpoint's shape (TEST-09 is planned to add a commit field to it) can affect this footer; the client reads only the `version` field and ignores any others, so an additive field is safe. The item description's "Touches no backend file" remains literally true; "genuinely parallel with TEST-07" also remains true (TEST-07 touches neither the version router nor the footer). No `[B]` entry exists in the File Manifest, and `## Backend Plan` says why.
  - Loading state, decided: before `/api/version` answers, the footer renders the app name alone, exactly `Task Notes`, with no version, no placeholder text (no "loading", no ellipsis) and no trailing space or `v`. Reason: any placeholder is a string a reader can mistake for a version, and the footer is a one-line, non-blocking element.
  - Failure state, decided: **blank, not "unknown".** When `/api/version` is unreachable (network error, CORS refusal), answers non-2xx, answers a body without a non-empty string `version`, or answers the backend's own unresolved sentinel `"unknown"` (`UNKNOWN_VERSION` in `version_service.py`, returned when the distribution metadata is not installed), the footer renders exactly `Task Notes`, identical to the loading state. Reason: criterion 3 says the footer "renders without it" when the version cannot be resolved, and a footer reading `unknown` would be the backend's sentinel leaking into the UI as if it were a version. Consequence, accepted and recorded: a reader cannot tell "still loading" from "failed" by looking at the footer; the browser's network tab (the `/api/version` request) is where that is read. The fetch is made once per page load, with no retry and no timeout (neither is asked for, per `user_story_alignment.md` Section 3; a timeout is the subject of the separate follow-up item CHORE-02).
  - Assumption recorded (comment is silent): the version is fetched by `AppFooter` itself on mount, not passed down from `LandingPage`, so `LandingPage.tsx` is not modified; only its test changes, because it currently asserts the `package.json` version.
  - Assumption recorded: the rendered format stays as TEST-04 shipped it, `Task Notes v{version}` (for example `Task Notes v0.1.0`).
  - Not acted on, recorded: TEST-04's own UAT artifacts (`e2e/uat/scenarios/TEST-04_page_footer.feature`, `e2e/uat/scripts/TEST-04_page_footer_uat_script.md`) describe the `package.json` version and become historically stale. They are TEST-04's record, are not executed, and are left unchanged (scope containment). TEST-04's E2E spec *is* modified, because it executes and would fail.

## Plan Overview
Switch the footer's version source from the frontend bundle (`frontend/package.json`, build time) to the backend at runtime (`GET /api/version`, already served by TEST-05). Frontend only in files touched:
- A new API client `frontend/src/api/version.ts` exposing `fetchAppVersion(): Promise<string | null>`, which resolves to the version string, or `null` for every unresolved case (network error, non-2xx, malformed body, empty string, the backend sentinel `"unknown"`). It never throws, so the component has one shape to handle.
- The API base URL, currently a private constant in `frontend/src/api/notes.ts`, moves to `frontend/src/api/baseUrl.ts` and both clients import it, so `VITE_API_BASE_URL` and its `http://localhost:8010` default have one source (`coding_standards.md` Section 5, "One value, one source").
- `AppFooter.tsx` fetches once on mount (guarded against setting state after unmount, as `LandingPage.tsx` already does for notes) and renders `Task Notes v{version}` when resolved, `Task Notes` otherwise (loading and failure alike).
- Tests: client unit tests (stubbed `fetch`), component tests (mocked client) for present, absent, loading and failure; `LandingPage.test.tsx` mocks the new client; TEST-04's E2E spec switches its expected version from `frontend/package.json` to `backend/pyproject.toml`; a new TEST-08 E2E spec covers the version on the running stack plus a failure-path edge case.
No backend, database, migration, dependency or configuration change.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"`, moved verbatim from `notes.ts`.
  - `frontend/src/api/notes.ts` (modified): imports `API_BASE_URL` from `./baseUrl` instead of defining it; behaviour unchanged.
  - `frontend/src/api/version.ts` (new): `fetchAppVersion()` calls `fetch` on `${API_BASE_URL}/api/version`; returns `body.version` when the response is OK and `version` is a non-empty string other than `"unknown"`; returns `null` on any rejection, non-OK status, JSON parse failure or other shape. A typed response (`{ version: string }`) is declared, no `any`. A short comment names why `"unknown"` maps to `null` (it is the backend's unresolved sentinel, `UNKNOWN_VERSION` in `backend/app/services/version_service.py`).
  - `frontend/src/components/AppFooter.tsx` (modified): drop the `package.json` import; `useState<string | null>(null)` plus a mount-time `useEffect` calling `fetchAppVersion()` with an `isMounted` guard; render `{APP_NAME}` followed by ` v{version}` only when `version` is non-null. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark) and `footerStyle` unchanged.
- Routes: none.
- State management: local component state in `AppFooter` (`string | null`); no shared store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer styling from TEST-04 (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`) is kept unchanged; no new visual element is introduced.

## Backend Plan
No backend changes required. The endpoint the tracker comment asks for, `GET /api/version`, already exists (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, registered in `backend/app/main.py`, CORS already allowing `GET` from the frontend origin) and returns the backend's own version from its package metadata. This item adds a runtime dependency on that endpoint but edits no backend file; see Re-Plan Feedback.

## API Integration Plan
No external API integration. (The only API consumed is this project's own backend, specified under API Contract.)

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version` (existing, TEST-05; not changed by this item)
- Request: no body, no parameters.
- Response: `200 OK`, `{"version": "0.1.0"}`. The value is `[project].version` of `backend/pyproject.toml` via installed metadata, or the sentinel `"unknown"` when that metadata is not installed. Extra fields, if a later item adds any, are ignored by the client.
- Client mapping (`fetchAppVersion`): OK with a non-empty string `version` other than `"unknown"` returns that string; everything else returns `null`.

## Technology Selection
- Version fetch (`frontend/src/api/version.ts`): chose the browser's native `fetch`, the same mechanism `notes.ts` already uses, over adding an HTTP client library; no new dependency.
- Mount-time load in `AppFooter`: chose React's built-in `useState` and `useEffect` (already installed, already the pattern in `LandingPage.tsx`) over a data-fetching library such as a query cache, which would be a new dependency for one GET.
- Shared base URL (`frontend/src/api/baseUrl.ts`): a plain exported constant read from `import.meta.env` (Vite native) over duplicating the literal in a second client; no alternative dependency considered necessary.
- E2E expected version: read `backend/pyproject.toml` with Node's standard `node:fs` plus a one-line match on the `version = "..."` line, over installing a TOML parser for one field.

## File Manifest
### New files
- [A] frontend/src/api/baseUrl.ts: single source of the API base URL (`VITE_API_BASE_URL`, default `http://localhost:8010`), moved out of `notes.ts`
- [A] frontend/src/api/version.ts: `fetchAppVersion()` client for `GET /api/version`, returning the version string or `null`
- [A] frontend/src/api/version.test.ts: unit tests for `fetchAppVersion` with stubbed `fetch`: resolved, non-OK, rejected fetch, malformed body, empty string, `"unknown"` sentinel, default and configured base URL
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: E2E: footer shows the backend's version (from `backend/pyproject.toml`) on the running stack; edge case with `/api/version` aborted via `page.route` shows exactly `Task Notes`
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-08/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it locally; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the version on mount via `fetchAppVersion`; render `Task Notes v{version}` when resolved, `Task Notes` while loading and on failure
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present (a value differing from `package.json`), absent on `null`, loading renders name only, no `undefined`/`null`/trailing `v`, landmark and test id unchanged
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` and assert the footer shows the mocked backend version instead of the `package.json` version
- [D] e2e/tests/TEST-04_page_footer.spec.ts: expected version read from `backend/pyproject.toml` instead of `frontend/package.json`, so the existing footer spec reflects the corrected source
No dependency is added or changed, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `fetchAppVersion` (stubbed global `fetch`, the pattern of `frontend/src/api/notes.test.ts`): happy path, non-OK status, rejected fetch, malformed body, empty string, `"unknown"` sentinel, and the base URL resolution with `VITE_API_BASE_URL` set (asserting the resolved URL, per `coding_standards.md` Section 5, not only the fallback literal). `AppFooter` (mocked `../api/version`): resolved version rendered as `Task Notes v9.9.9-test`, a value deliberately different from `frontend/package.json`; `null` renders exactly `Task Notes`; before the promise settles the footer renders exactly `Task Notes`; text never contains `undefined`, `null` or a trailing ` v`. `LandingPage` keeps its footer assertion with the client mocked.
  - Directory: `frontend/src/` (Vitest, co-located `*.test.ts(x)`, the existing frontend convention; `CLAUDE.md`'s `backend/tests/unit/` applies to the backend only)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, as the existing frontend tests
- Integration tests: no new backend integration test; the backend is unchanged and `GET /api/version` is already covered by `backend/tests/integration/test_version_integration.py` (200 with the `pyproject.toml` version, answers without a database, 405 on POST). That existing test is the integration-tier evidence for criterion 2's backend half.
  - Directory: `backend/tests/integration/`
- E2E tests: footer on the running stack shows the backend's version read from `backend/pyproject.toml` (criterion 1, and the rebuilt-frontend case of criterion 2, since `frontend/package.json` is `0.0.0` and the backend is `0.1.0`); edge case with `**/api/version` aborted by `page.route` renders exactly `Task Notes`. TEST-04's spec updated to the new source.
  - Directory: `e2e/tests/`
  - File: `TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one per criterion plus an edge case (backend unreachable).
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | Version comes from the backend at runtime (`GET /api/version`), not `frontend/package.json` or a typed string; frontend shows the backend's version | Unit | verifying the source needs no navigation: the component test mocks the client with a value that differs from `package.json` and asserts that value renders, and the existing `test_version_integration.py` proves the endpoint reports `pyproject.toml`; the E2E spec for criterion 1 also observes it end to end |
| 3 | When unresolved, the footer renders without it, no `undefined`, `null` or empty gap | Unit | verifying it needs no navigation or interaction: it is the client's `null` mapping plus the component's render branch, asserted on exact text; the E2E edge-case spec adds a browser-level check |
| 4 | A component test asserts both paths: version present and absent | Unit | the criterion is itself a component-test requirement, met by `AppFooter.test.tsx` |
| 5 | Loading and failure states decided, recorded and tested | Unit | verifying them needs no navigation: a pending promise and a `null` result are asserted in `AppFooter.test.tsx`; the decision itself is recorded in this plan |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | `page.goto("/")`, `getByTestId("app-footer")` contains `Task Notes v` plus the version read from `backend/pyproject.toml` | Given the app and backend are running, When I open the landing page, Then the footer reads "Task Notes v0.1.0" |
| 2 | Version from the backend at runtime | covered at Unit, see Criterion coverage (also observed by spec 1, since the expected value is the backend's, not `frontend/package.json`'s) | Given the frontend package version differs from the backend's, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolved version renders without it | covered at Unit; edge-case E2E aborts `**/api/version` and asserts the footer text is exactly `Task Notes` | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version, "undefined", "null" or "unknown" |
| 4 | Component test asserts both paths | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then they pass with 0 failed |
| 5 | Loading and failure states recorded and tested | covered at Unit, see Criterion coverage | Given the version request has not answered, When the landing page renders, Then the footer reads "Task Notes" only |

## Manual verification plan
### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running (`docker compose up`), backend on `http://localhost:8010`, frontend on `http://localhost:5183`; `backend/pyproject.toml` reads `version = "0.1.0"`.
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0"}`.
2. Navigate to `http://localhost:5183/` → the landing page shows the "Task Notes" heading, the note form and the note list.
3. Scroll to the bottom of the landing page → the footer reads exactly `Task Notes v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, not from the frontend bundle
Prerequisites: as Criterion 1; `frontend/package.json` reads `"version": "0.0.0"`.
1. Open `frontend/package.json` and note `"version": "0.0.0"`; open `backend/pyproject.toml` and note `version = "0.1.0"` → the two differ.
2. Navigate to `http://localhost:5183/` and open the browser devtools Network tab, then reload → a `GET` request to `http://localhost:8010/api/version` appears with status 200 and response `{"version":"0.1.0"}`.
3. Read the footer → it reads `Task Notes v0.1.0`, the backend's version, and does not contain `0.0.0`.
4. Open `frontend/src/components/AppFooter.tsx` → it contains no `package.json` import and no version literal such as `"0.1.0"`.

### Criterion 3: When the version cannot be resolved, the footer renders without it
Prerequisites: frontend running on `http://localhost:5183`; backend stopped (`docker compose stop backend`).
1. Navigate to `http://localhost:5183/` → the landing page renders; the Network tab shows the `/api/version` request failing.
2. Read the footer → it reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap.
3. Restart the backend (`docker compose start backend`) and reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports 0 failed, and the AppFooter test names include a version-present case and a version-absent case.

### Criterion 5: Loading and failure states are decided, recorded and tested
Prerequisites: as Criterion 1.
1. Open this plan's `## Re-Plan Feedback` section → it records the loading state (`Task Notes` only) and the failure state (`Task Notes` only, blank rather than `unknown`) with the reason for each.
2. Navigate to `http://localhost:5183/`, then in devtools set Network throttling to "Slow 3G" and reload → while `/api/version` is still pending the footer reads exactly `Task Notes`, then changes to `Task Notes v0.1.0` when the request completes, with no intermediate placeholder text.
3. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run reports 0 failed, including the loading-state and failure-state cases.
