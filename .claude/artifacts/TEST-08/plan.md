# Implementation Plan, TEST-08: Footer shows the app version

## Feature
> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria.**
> 1. The footer renders the version string on the landing page.
> 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component.
> 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
> 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.
>
> (ClickUp task 123k99ctgch. The newest tracker comment corrects criterion 2 and the "frontend only" note; see `## Re-Plan Feedback`. The criteria below are the description's, amended by that comment.)

## Acceptance Criteria
- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. (amended by the tracker correction) The version comes from the backend at runtime, read from `GET /api/version`, never from `frontend/package.json` at build time and never from a string typed into the component: a frontend rebuilt against an older backend shows the backend's version, not its own.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.
- [ ] 5. (added by the tracker correction) The footer's loading state (before `GET /api/version` resolves) and failure state (`/api/version` unreachable or answering an error) are decided and recorded, not defaulted. Decision: in both states the footer reads exactly `Task Notes`, with no version text, no placeholder and no `unknown`.

## Re-Plan Feedback
- Comment (tracker, newest, the correction): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint that returns the backend's version, and have the footer fetch it. A frontend rebuilt against an older backend must show the backend's version, not its own." → Addressed by: criterion 2 is amended to read the backend at runtime. The footer fetches `GET /api/version` through a new client module `frontend/src/api/version.ts` and no longer imports `frontend/package.json`. The endpoint already exists on main 1f1df4f (TEST-05: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`). It answers `{"version": "0.1.0"}`, read at runtime from the installed `task-notes-backend` distribution metadata (that is `[project].version` in `backend/pyproject.toml`), and CORS already allows GET from `http://localhost:5183` (`backend/app/core/config.py`, `backend/app/main.py`). So "add the endpoint" is already done, and this plan reuses it unchanged.
- Comment (tracker, same correction, loading and failure states): "Decide and record what it shows before the fetch resolves and what it shows if /api/version is unreachable. A blank footer and a footer reading unknown are different answers." → Addressed by: criterion 5, and the decision is recorded here and in the Frontend Plan. **Loading:** the footer reads exactly `Task Notes`, with no version, no "Loading..." text and no placeholder. **Failure** (network error, non-2xx status, malformed body): the footer also reads exactly `Task Notes`. The footer is never blank (the app name always renders) and never reads `unknown`. The backend's own `"unknown"` sentinel (what `version_service.py` returns when the distribution metadata is missing) is treated as "cannot be resolved" and renders the same way. Reasons: criterion 3 already says an unresolved version renders without it, and a footer reading `vunknown` tells nobody which API they are talking to, which is the question the comment says the version string exists to answer. Pending and failed look the same on purpose: neither one tells the reader a version.
- Comment (tracker, same correction, the backend scope): "This adds a backend change to what the description frames as a frontend-only item. Say so in the plan rather than letting it appear in the file manifest without comment." → Addressed by: said here explicitly. The correction makes this item **depend on a backend endpoint** and so ends the description's "frontend only, touches no backend file" framing. That endpoint is already on main, though, so the plan writes **no backend file** and the Backend Plan reads "No backend changes required". The backend dependency is real (the footer is only correct if `GET /api/version` is served), and the plan covers it through the E2E spec, which runs against the live backend. TEST-09 is being planned in parallel and adds a `commit` field to the same response. This plan's client reads only `version` and ignores extra fields, so TEST-09's additive change cannot break it, and this plan does not touch any file TEST-09 owns.
- Comment (tracker, 2026-09-07, operator note): "Reset to to do ... Note for the revert: TEST-08 changed LandingPage.tsx, which TEST-04 also touched; reverting restores TEST-04's footer assertion as it was." → Addressed by: this plan **does not modify `frontend/src/components/LandingPage.tsx`**. The fetch lives inside `AppFooter.tsx`, which `LandingPage.tsx` already renders unchanged. That keeps it off the file BUG-04 and TEST-10 are held behind. It does modify TEST-04's footer assertions, which pinned the version to `frontend/package.json` and become false under the correction: `frontend/src/components/LandingPage.test.tsx`, `e2e/tests/TEST-04_page_footer.spec.ts`, and TEST-04's Gherkin scenario and UAT script. The File Manifest lists each one.
- Comment (tracker, the remaining comments): earlier runs' "PR opened" notices → not acted on: none of those runs merged code that survives on main 1f1df4f, so they carry no requirement.
- Merged since the last plan: n/a (fresh plan, branched from current main 1f1df4f; no earlier TEST-08 plan exists on main).

## Plan Overview
Frontend-only code change, against a backend endpoint that already exists. A new client module `frontend/src/api/version.ts` calls `GET /api/version` on the configured API base URL and returns the backend's version string, or `null` when the backend reports its `"unknown"` sentinel. It throws on network error, a non-2xx status or a malformed body. `AppFooter.tsx` drops its `package.json` import, fetches the version once on mount, and renders `Task Notes` followed by ` v{version}` only once a version has resolved. The API base URL moves out of `notes.ts` into a small shared module, so both clients read one source (`coding_standards.md` Section 5, one value one source). TEST-04's tests and UAT artifacts that pinned the footer to `frontend/package.json` are updated to the backend source. No backend code, no new dependency, no change to `LandingPage.tsx`.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/baseUrl.ts` (new): exports `API_BASE_URL`, which is `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8010"` and moves verbatim from `notes.ts`. It is the one source of the backend base URL for every client.
  - `frontend/src/api/notes.ts` (modify): imports `API_BASE_URL` from `./baseUrl` instead of defining it. Behaviour is unchanged.
  - `frontend/src/api/version.ts` (new): `fetchBackendVersion(): Promise<string | null>`. It calls `fetch(API_BASE_URL + "/api/version")`. On `!response.ok` it throws `Error("Loading the version failed: {status} {statusText}")`, the same shape as `notes.ts`'s `requestFailed`. It throws `Error("Loading the version failed: unexpected response shape")` unless the body is an object whose `version` is a non-empty string after trimming. It returns `null` when `version` is the backend's sentinel `"unknown"`, and otherwise returns the trimmed `version`. It reads only `version`, so an extra field (TEST-09's `commit`) is ignored. Exports the type `VersionResponse = { version: string }`.
  - `frontend/src/components/AppFooter.tsx` (modify): removes `import { version } from "../../package.json"`. Holds `const [version, setVersion] = useState<string | null>(null)`. A mount-only `useEffect` calls `fetchBackendVersion()`, sets the result, swallows a rejection by leaving `null` in place, and uses the `isMounted` guard that `LandingPage.tsx` already uses so a late resolve after unmount sets nothing. Renders `<footer data-testid="app-footer" style={footerStyle}>{APP_NAME}{version !== null && <span data-testid="app-version"> v{version}</span>}</footer>`. When unresolved, the footer's text content is exactly `Task Notes`: no trailing space, no `v`, no `undefined`/`null`. The `contentinfo` landmark and the `app-footer` test id are kept.
- Routes: none (the landing page at `/` is unchanged).
- State management: local `useState` in `AppFooter`, one fetch per mount, no retry and no polling. A request that hangs stays in the loading state, which renders the same as failure (criterion 5), so no timeout is added.
- Loading and failure states (criterion 5, decided here): both render exactly `Task Notes`. The `app-version` span exists only when a version resolved.
- Design reference notes: AI freestyle. Design Reference mode is NONE. The footer keeps TEST-04's existing style unchanged (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`), and the `app-version` span carries no style of its own and inherits it.

## Backend Plan
No backend changes required. `GET /api/version` already exists on main (TEST-05), returns `{"version": "<pyproject version>"}` at runtime, answers without a database, and is reachable cross-origin from `http://localhost:5183` under the existing CORS settings. This item now depends on that endpoint (see `## Re-Plan Feedback`) but changes none of its files. TEST-09 owns the planned `commit` field.

## API Integration Plan
No external API integration. (The frontend consumes the project's own backend; the contract is below.)

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version`
- Request: no body, no query parameters, no custom headers (so no CORS preflight).
- Response: 200 with `{"version": "0.1.0"}` today. After TEST-09 merges it becomes `{"version": "0.1.0", "commit": "<string>"}`, and this client reads `version` only. A `version` of `"unknown"` means the backend could not resolve its own version, and the footer renders without one.
- Client handling: non-2xx, network error or malformed body: the promise rejects and the footer shows `Task Notes`. `"unknown"`: the promise resolves `null` and the footer shows `Task Notes`. A non-empty string: the footer shows `Task Notes v{version}`.

## Technology Selection
- HTTP call in `frontend/src/api/version.ts`: chose the browser's native `fetch` over adding an HTTP client library (axios or similar), because `fetch` covers one GET with a status check, and `notes.ts` already uses it.
- Data loading in `AppFooter`: chose React's built-in `useState` and `useEffect` (react is already installed) over adding a data-fetching library, because one fetch on mount needs no cache, retry or deduplication.
- `frontend/src/api/baseUrl.ts`: no stdlib call, platform feature or installed dependency shares a constant between two modules, so it is a two-line module. It was chosen over duplicating the base-URL expression into `version.ts`, which would give one deployment-dependent value two sources.
- Response validation: chose a plain `typeof` check in `version.ts` over adding a schema library (zod or similar), because the body has one string field.
- No new dependency is added, so no lockfile changes.

## File Manifest
<!--
  Phase tags: [0S]=Infrastructure Scaffolding, [A]=Frontend Plan, [B]=Backend Plan, [C]=API Integration Plan, [D]=Testing Strategy, [G]=Acceptance Test Outline, [Docs]=-
-->
### New files
- [A] frontend/src/api/baseUrl.ts: the single source of the backend base URL (`VITE_API_BASE_URL` with the existing `http://localhost:8010` default), moved out of `notes.ts`
- [A] frontend/src/api/version.ts: `fetchBackendVersion()` client for `GET /api/version`, with status and shape checks and the `"unknown"` sentinel mapped to `null`
- [A] frontend/src/api/version.test.ts: Vitest unit tests for the client (mocked `fetch`)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec showing the footer displays the live backend's version, plus the failure edge case
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-08/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/notes.ts: import `API_BASE_URL` from `./baseUrl` instead of defining it; no behaviour change
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the backend version on mount; render ` v{version}` in an `app-version` span only once resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; replace the package.json assertion with present, absent (rejected), loading (pending) and `null` (sentinel) cases, plus a version that differs from package.json
- [A] frontend/src/components/LandingPage.test.tsx: mock `../api/version` alongside `../api/notes`; the footer assertion uses the mocked backend version instead of `package.json`
- [D] e2e/tests/TEST-04_page_footer.spec.ts: its three `package.json` version assertions become false under the correction (footer now shows the backend's `0.1.0`, not the frontend's `0.0.0`); read the expected version from the page's own `GET /api/version` response instead
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: the step "that version number matches the version field of frontend/package.json" now names the backend's `GET /api/version` as the source
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: the prerequisite and step 4 compare the footer against `GET /api/version` instead of `frontend/package.json`

No dependency is added or changed, so no lockfile is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the project structure, run configuration, dependencies and test infrastructure are unchanged (`baseUrl.ts` is a new module inside the existing `frontend/src/api/` layer, and `README.md` does not describe the footer's version source).

## Testing Strategy
- Unit tests (Vitest, frontend; the backend gets no new code, so no new pytest tests):
  - `frontend/src/api/version.test.ts` covers `fetchBackendVersion`. It returns the version on 200 `{"version": "0.1.0"}`. It ignores an extra `commit` field. It calls `{API_BASE_URL}/api/version`. It returns `null` on `{"version": "unknown"}`. It rejects on a 503. It rejects on a network error (`fetch` rejects). It rejects on a malformed body (`{}`, `{"version": 7}`, `{"version": "  "}`).
  - `frontend/src/components/AppFooter.test.tsx` mocks `../api/version`. Present path: the mock resolves `"9.9.9"` (deliberately not `frontend/package.json`'s `0.0.0`), and the footer text becomes exactly `Task Notes v9.9.9` with an `app-version` span. Absent path, rejected: the mock rejects, and the footer text is exactly `Task Notes` with no `app-version`, `undefined` or `null`. Absent path, sentinel: the mock resolves `null`, with the same assertion. Loading: the mock returns a never-settling promise, and the footer reads exactly `Task Notes`. It also checks that the app name and `contentinfo` landmark are kept, and that the client is called once per mount.
  - `frontend/src/components/LandingPage.test.tsx`: the existing footer test now mocks `fetchBackendVersion` to resolve `"9.9.9"` and asserts the footer shows it.
  - Directory: `frontend/src/` (co-located `*.test.ts(x)`, the existing frontend convention; CLAUDE.md's `backend/tests/unit/` and `test_{module}_unit.py` apply to backend tests, and this item adds none)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, matching the existing frontend tests
- Integration tests: no new integration test. The only router involved, `GET /api/version`, is unchanged, and `backend/tests/integration/test_version_integration.py` (TEST-05) already covers it: 200 with the pyproject version, no database needed, and 405 on POST. That existing test is part of the gate this build runs.
  - Directory: `backend/tests/integration/`
- E2E tests: one spec, run against the live stack, for criterion 1 (and criterion 2 end to end), plus one edge-case spec.
  - Present path: wait for the page's own `GET /api/version` response, matching on the **exact** pathname `/api/version` and not a substring, because Vite serves the module `/src/api/version.ts` and a substring matcher catches that module instead (the trap `TEST-03_simple_note_form.spec.ts` documents). Read its JSON `version`, then assert that the `app-footer` text is exactly `Task Notes v{that version}` and does not contain `frontend/package.json`'s version when the two differ.
  - Failure edge case: `page.route` aborts requests whose exact pathname is `/api/version`, then assert the footer text is exactly `Task Notes`.
  - The TEST-04 spec is updated the same way.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-08_footer_app_version.spec.ts`
- UAT scenarios: one scenario per criterion, plus the "backend unreachable" edge-case scenario. The TEST-04 scenario's version-source step is corrected.
  - Directory: `e2e/uat/scenarios/` (Gherkin), `e2e/uat/scripts/` (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from the backend at runtime via `GET /api/version`, never from `package.json` or a typed string; a frontend against an older backend shows the backend's version | Unit | Verifying the source needs no navigation or interaction. `version.test.ts` proves the client reads `/api/version`, and `AppFooter.test.tsx` proves the footer shows a mocked backend value (`9.9.9`) that differs from `package.json`'s `0.0.0`. The E2E spec for criterion 1 additionally checks against the live backend's response. |
| 3 | When the version cannot be resolved, the footer renders without it, never `undefined`, `null` or an empty gap | Unit | It is a render rule for one component's states, set by mocking the client (rejected, or `null` for the sentinel), with no navigation needed. The feature's E2E edge-case spec (aborted `/api/version`) also exercises it. |
| 4 | A component test asserts both paths: version present and version absent | Unit | The criterion is itself a component-test requirement, met by `AppFooter.test.tsx`. |
| 5 | Loading and failure states are decided and recorded: both read exactly `Task Notes` | Unit | A pending promise and a rejected one are component states set by mocking the client, with no navigation needed. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Open `/`, wait for the exact-path `GET /api/version` response, assert `app-footer` reads `Task Notes v{response.version}` | Given the backend is running, When I open the landing page, Then the footer shows "Task Notes v" followed by the backend's version |
| 2 | Version comes from the backend at runtime | Covered at Unit, see Criterion coverage (the criterion-1 spec also compares with the live response) | Given the backend reports a version different from frontend/package.json, When I open the landing page, Then the footer shows the backend's version |
| 3 | Unresolvable version renders without it | Covered at Unit, see Criterion coverage; edge spec: aborted `/api/version` leaves the footer reading `Task Notes` | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no version, "undefined", "null" or "unknown" |
| 4 | Component test asserts present and absent | Covered at Unit, see Criterion coverage | Given the frontend unit tests, When I run them, Then the AppFooter present and absent tests pass |
| 5 | Loading and failure states recorded | Covered at Unit, see Criterion coverage | Given the version request has not answered yet, When the landing page renders, Then the footer reads "Task Notes" only |

## Manual verification plan

### Criterion 1: The footer renders the version string on the landing page
Prerequisites: the stack is running from the repository root with `docker compose up -d --build` (db, backend on `http://localhost:8010`, frontend on `http://localhost:5183`).
1. In a terminal, run `curl -s http://localhost:8010/api/version` → it prints `{"version":"0.1.0"}` (after TEST-09 merges, also a `commit` field). Note the `version` value.
2. Open `http://localhost:5183/` in a browser → the landing page shows the "Task Notes" heading and the note form.
3. Scroll to the bottom of the page and read the footer → it reads exactly `Task Notes v0.1.0`, the value from step 1.

### Criterion 2: The version comes from the backend at runtime, not from package.json
Prerequisites: as for criterion 1.
1. Open `frontend/package.json` and read its `version` field → it is `0.0.0`.
2. Open `backend/pyproject.toml` and read `[project].version` → it is `0.1.0`.
3. Open `http://localhost:5183/` and read the footer → it reads `Task Notes v0.1.0` (the backend's), and `0.0.0` appears nowhere in it.
4. Open the browser DevTools Network tab, reload the page, and filter on `version` → there is a `GET http://localhost:8010/api/version` request with status 200 and response body `{"version":"0.1.0"}`, and the footer shows that value.
5. Open `frontend/src/components/AppFooter.tsx` → it contains no `package.json` import and no literal version string.

### Criterion 3: An unresolvable version renders without it
Prerequisites: the stack is running as for criterion 1.
1. Run `docker compose stop backend` from the repository root → the backend container stops.
2. Reload `http://localhost:5183/` → the page still renders. The footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null`, no `unknown` and no trailing gap.
3. In the DevTools Elements tab, inspect the `footer` element → it holds the text `Task Notes` and no `app-version` span.
4. Run `docker compose start backend`, wait a few seconds, and reload the page → the footer reads `Task Notes v0.1.0` again.

### Criterion 4: A component test asserts both paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test` from the repository root → it ends with `0 failed`, and `src/components/AppFooter.test.tsx` and `src/api/version.test.ts` are among the files run.
2. Open `frontend/src/components/AppFooter.test.tsx` → there is one test asserting the footer reads `Task Notes v9.9.9` (version present) and at least one asserting it reads exactly `Task Notes` with no `app-version` element (version absent).

### Criterion 5: Loading and failure states are decided and recorded
Prerequisites: the stack is running as for criterion 1, in a Chromium-based browser.
1. Open DevTools → Network, right-click any request and choose "Block request URL", then enter the pattern `localhost:8010/api/version` → the block rule is listed.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes` (the failure state), and the Network tab shows `/api/version` as blocked.
3. Remove the block rule, set Network throttling to "Slow 3G", and reload → while the `/api/version` request is still pending, the footer reads exactly `Task Notes` (the loading state). Once the request completes, it reads `Task Notes v0.1.0`.
4. Set throttling back to "No throttling" → nothing else on the page changed in either state.
