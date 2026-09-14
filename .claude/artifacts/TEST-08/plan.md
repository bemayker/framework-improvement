# Implementation Plan, TEST-08: Footer shows the app version

## Feature

> A small frontend feature for the autonomous `/deliver` run (Arm E of measured run 2). Touches no backend file, so it is genuinely parallel with TEST-07 and is the item that makes the dependency graph's parallel path observable rather than theoretical.
>
> **What.** The landing page footer shows the application version, so anyone looking at a running instance can tell which build they are on.
>
> **Acceptance criteria.** 1. The footer renders the version string on the landing page. 2. The version comes from a single declared source (the frontend package metadata or a build-time variable), never a string typed into the component. 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap. 4. A component test asserts both paths: version present, and version absent.
>
> **Notes.** Frontend only, under `frontend/src/`. It modifies `LandingPage.tsx`, which TEST-04 also touched; TEST-04 is complete, so there is no live conflict.

Source: ClickUp task `123k99ctgch` (workspace 30307190, list 901524718831), `hybrid` work item source. Depends on: TEST-04 and TEST-05, both done. Scaffold TEST-01 done. Branch: `feature/TEST-08-footer-app-version`.

## Acceptance Criteria

- [ ] 1. The footer renders the version string on the landing page.
- [ ] 2. The version comes from a single declared source, never a string typed into the component. **Superseded by the tracker correction (see Re-Plan Feedback):** the single source is the backend's `GET /api/version` response, fetched at runtime; neither `frontend/package.json` nor a build-time variable is that source.
- [ ] 3. When the version cannot be resolved, the footer renders without it rather than showing `undefined`, `null` or an empty gap.
- [ ] 4. A component test asserts both paths: version present, and version absent.

## Re-Plan Feedback

This is a first plan for measured run 3, not a re-plan: no `plan.md` exists on `origin/main` or on the branch (the branch does not exist yet, locally or remotely), so Section 5 step 7's merged-since check does not apply. The tracker carries three comments; every one is recorded here, newest first.

- Comment (tracker, 2026-09-07, process note): "Reset to to do on 2026-09-07 for measured run 3 … Do not run /deliver against this item until that revert has merged. … reverting restores TEST-04's footer assertion as it was." → Addressed by: precondition verified against `origin/main` rather than taken on trust. `git log origin/main` carries `0ac6818 chore: revert TEST-06, TEST-07 and TEST-08 for measured run 3 (#29)` below head `f7eb597`; `frontend/src/components/AppFooter.tsx` on `origin/main` is TEST-04's version (it imports `version` from `../../package.json`), `frontend/src/api/` holds only `notes.ts` and `notes.test.ts` (no `version.ts`), `e2e/tests/` holds no `TEST-08_*` spec, and TEST-04's spec, feature file and UAT script all assert the `frontend/package.json` version again. The revert is complete and this plan is written against that state. Nothing else to act on.
- Comment (tracker, the correction): "The version must come from the backend at runtime, not from package.json at build time. Add a GET /api/version endpoint … A frontend rebuilt against an older backend must show the backend's version, not its own. … The footer now has a loading state and a failure state. Decide and record what it shows … This adds a backend change to what the description frames as a frontend-only item. Say so in the plan." → Addressed by, point by point:
  1. **Criterion 2 is superseded.** The version source is `GET /api/version` on the backend, fetched by the browser at runtime through a client module. The footer never imports `package.json`, never reads a `VITE_*` variable for the version, and carries no version literal. The Acceptance Criteria section above says so on the criterion itself rather than silently satisfying the older wording.
  2. **"Add a GET /api/version endpoint" is already satisfied by merged code, so no endpoint is added.** TEST-05 (done, on `origin/main`) shipped `backend/app/routers/version.py` (`APIRouter(prefix="/api")`, `GET /version`, `response_model=VersionResponse`), `backend/app/schemas/version.py` (`VersionResponse(version: str)`) and `backend/app/services/version_service.py` (`importlib.metadata.version("task-notes-backend")`, sentinel `"unknown"` when the distribution is not installed), registered in `backend/app/main.py` via `app.include_router(version_router)`, with unit and integration tests. Re-adding it would duplicate a router. **Consequence for the "backend change" the comment asks to be stated:** this item changes **no backend file**. It is frontend-only with a runtime dependency on TEST-05, which `feature_map.md` already records in `depends_on: [TEST-04, TEST-05]`. The Backend Plan below says "No backend changes required" and the File Manifest carries no `[B]` entry; that is the explicit statement the comment asked for, and the reason it is a statement rather than a manifest entry.
  3. **Loading state, decided:** the footer reads exactly `Task Notes` while the fetch is pending. Reason: on a healthy stack the request settles in milliseconds, so a "loading…" word would flash and then vanish; criterion 3's "renders without it" applies before resolution as much as after failure; and rendering nothing version-shaped is what guarantees `undefined`/`null` can never be painted from an unresolved state. **Failure state, decided:** the footer reads `Task Notes · version unavailable` when `/api/version` is unreachable, times out, answers non-2xx, or answers a body that is not `{"version": <non-empty string>}`. Reason: a bare `Task Notes` (the "blank" answer) is indistinguishable from the loading state and from a footer that never asked, so a reader could not tell "still loading" from "the API is down", which is exactly what the comment says a version string exists to answer; `unknown` (the other answer the comment names) is rejected because the backend already uses `"unknown"` as its own sentinel for "distribution not installed", so a footer reading `unknown` would be ambiguous between a frontend fetch failure and a backend metadata failure. **Reconciliation with criterion 3:** the footer renders *without the version*: the marker is not a version string, it is a statement that there is none, rendered in its own `data-testid="app-footer-version-unavailable"` element while the `data-testid="app-footer-version"` element is absent from the DOM. No `undefined`, no `null`, no empty gap. **One further decision the comment did not anticipate:** the backend's own `"unknown"` sentinel is passed through and rendered verbatim as `Task Notes vunknown`, not mapped to the failure state. Reason: the footer's job is to report what the API says about itself, and rewriting the backend's word into a message that suggests a network problem would send the reader to the wrong place; the sentinel is reachable only when the backend runs without its editable install (a bare checkout), never in Docker (`backend/Dockerfile` runs `uv sync` then `uv run uvicorn`) or under the test gate, so the E2E specs and UAT see the real `0.1.0`.
  4. **Loading and failure are both pinned by tests** (component tests and Playwright specs, Testing Strategy below), so the recorded choice cannot drift silently.
- Comment (tracker, the previous run's answer): "implemented as requested in PR #25 … fetches GET /api/version at runtime through a client module (frontend/src/api/version.ts) … The endpoint already existed from TEST-05, so no backend file changed … while loading the footer reads exactly "Task Notes"; when /api/version is unreachable, answers non-2xx or returns no usable version it reads "Task Notes · version unavailable" … TEST-04's E2E spec and UAT artifacts asserted the package.json version and were re-scoped to the backend's response." → Addressed by: adopted as the baseline, since the revert put the code back to exactly the state that answer was written against and its reasoning holds. Two things are bettered rather than copied: (a) the default API base URL is extracted into one shared module (`frontend/src/api/apiBaseUrl.ts`) instead of being typed a second time in the new client, because `coding_standards.md` Section 5 requires one source for a deployment-dependent value and `notes.ts` already carries it; (b) the E2E specs read the backend's version from the browser's own `/api/version` response captured with `page.waitForResponse` rather than from a test-side base URL, so the E2E harness gains no copy of the port either. The TEST-04 re-scope the answer describes is still needed after the revert and is in this plan's File Manifest (`[D]` and `[G]` entries) rather than left to surface mid-build.

Two ambiguities decided here rather than asked (autonomous run):

- The description's Notes say the item "modifies `LandingPage.tsx`". On `origin/main` TEST-04 already extracted the footer into `frontend/src/components/AppFooter.tsx`, and `LandingPage.tsx` only renders `<AppFooter />`. So **`LandingPage.tsx` is not modified**; `LandingPage.test.tsx` is (it imports the `package.json` version and asserts it in the footer). The note predates TEST-04's component split.
- The rendered format for a resolved version stays TEST-04's `Task Notes v0.1.0`, so the unchanged parts of TEST-04's spec and UAT script keep asserting the same shape.

## Plan Overview

Frontend-only change with a runtime dependency on TEST-05's existing `GET /api/version`. A new typed client module `frontend/src/api/version.ts` fetches the version with the platform `fetch`, a native `AbortController` timeout and a hand-written response-shape guard, rejecting on network error, timeout, non-2xx and unexpected shape. `AppFooter.tsx` drops its `package.json` import and holds a three-state value (`loading` → `resolved` | `unavailable`) in React's own `useState`/`useEffect`, rendering `Task Notes`, `Task Notes v{version}` or `Task Notes · version unavailable`, each state under its own stable `data-testid`. The shared API base URL resolution moves from `notes.ts` into `frontend/src/api/apiBaseUrl.ts` so the default port has one source. Tests: Vitest client tests and component tests (both paths plus loading), a Playwright spec that asserts the footer against the browser's own `/api/version` response and drives the failure path with `page.route`, UAT Gherkin plus manual script, and a re-scope of TEST-04's spec, feature file and UAT script from the `package.json` version to the backend's response. No backend file, no dependency, no lockfile, no docs change.

## Frontend Plan

- Components to create/modify:
  - `frontend/src/api/apiBaseUrl.ts` (new): `export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;` with `DEFAULT_API_BASE_URL = "http://localhost:8010"` moved here verbatim from `notes.ts`. One source for the deployment-dependent value (`coding_standards.md` Section 5, "one value, one source"); `docker-compose.yml` still supplies `VITE_API_BASE_URL`.
  - `frontend/src/api/notes.ts` (modify): delete its local `DEFAULT_API_BASE_URL` and `API_BASE_URL` lines, add `import { API_BASE_URL } from "./apiBaseUrl";`. No behaviour change; `notes.test.ts` is untouched (its `VITE_API_BASE_URL` case uses `vi.resetModules()` plus a dynamic import, which re-evaluates `apiBaseUrl.ts` as well).
  - `frontend/src/api/version.ts` (new): the client layer for the version endpoint (`coding_standards.md` Section 4: components never call `fetch` directly). Exports `type VersionResponse = { version: string }`, `VERSION_REQUEST_TIMEOUT_MS = 5000`, and `fetchVersion(): Promise<string>`. Behaviour: `VERSION_URL` is `API_BASE_URL` concatenated with `/api/version`; create an `AbortController`, arm `setTimeout(() => controller.abort(), VERSION_REQUEST_TIMEOUT_MS)`, call `fetch(VERSION_URL, { signal: controller.signal })`, clear the timer in `finally`. Reject with an `Error` whose message starts `Loading the version failed:` on each of: the fetch rejecting (network error; an `AbortError` is reported as `timed out after 5000 ms`), `!response.ok` (covers 401/403/429/5xx alike: the endpoint has no auth and no rate limit, so no per-status branch is warranted), `response.json()` throwing (non-JSON body), and a body that fails the type guard `isVersionResponse` (not an object, `version` missing, not a string, or empty after `trim()`). On success return `body.version` verbatim, including the backend's `"unknown"` sentinel (decision recorded above). No retry: a footer label is not worth a second request, and the failure state is the designed answer (`coding_standards.md` Section 4 makes retry "when appropriate"; it is not, and this line records that).
  - `frontend/src/components/AppFooter.tsx` (modify): remove `import { version } from "../../package.json"`. Add constants `VERSION_UNAVAILABLE_LABEL = "version unavailable"` beside the existing `APP_NAME` (text stays in constants, i18n-ready, Section 3.3). State: `type VersionState = { status: "loading" } | { status: "resolved"; version: string } | { status: "unavailable" }`, initial `{ status: "loading" }`. `useEffect` on mount calls `fetchVersion()`, sets `resolved` on success and `unavailable` on rejection, guarded by the same `isMounted` pattern `LandingPage.tsx` uses so an unmount before settle sets nothing; the rejection is absorbed (no `console.*`, Section 2.3). Render: `<footer data-testid="app-footer" style={footerStyle}>` containing `APP_NAME`, then exactly one of: nothing (loading); `<span data-testid="app-footer-version"> v{state.version}</span>` (resolved); `<span data-testid="app-footer-version-unavailable"> · {VERSION_UNAVAILABLE_LABEL}</span>` (unavailable). Resulting footer text: `Task Notes` / `Task Notes v0.1.0` / `Task Notes · version unavailable`. Existing `footerStyle` (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`) and the `contentinfo` landmark are unchanged; the spans inherit it and add no style.
  - `frontend/src/components/LandingPage.tsx`: **not modified** (see Re-Plan Feedback).
- Routes: none; the landing page at `/` is the only route.
- State management: local component state via `useState`/`useEffect` in `AppFooter` (`coding_standards.md` Section 3.3, native state APIs first). No context, no store, no custom hook: the value is consumed by one component.
- Test attributes (`coding_standards.md` Section 3.6): `app-footer` (existing, unchanged), `app-footer-version` (new, present only when resolved), `app-footer-version-unavailable` (new, present only on failure). All three are part of the component's test contract from this item on.
- Design reference notes: AI freestyle

## Backend Plan

No backend changes required. The correction comment's "add a GET /api/version endpoint" is satisfied by TEST-05's merged code (`backend/app/routers/version.py`, `backend/app/schemas/version.py`, `backend/app/services/version_service.py`, registered in `backend/app/main.py`); adding another would duplicate the router. This item therefore stays frontend-only, with a runtime dependency on TEST-05 already expressed in `feature_map.md`. Nothing under `backend/` is touched, `backend/tests/integration/test_version_integration.py` keeps covering the endpoint, and no `[B]` entry appears in the File Manifest.

## API Integration Plan

No external API integration. The API consumed is this project's own backend, so the client module `frontend/src/api/version.ts` is Frontend Plan work (tagged `[A]`), following the precedent of `frontend/src/api/notes.ts`. Section 4's client-layer, typing and error-handling rules are applied to it anyway (see Frontend Plan).

## API Contract

The backend side is TEST-05's and is unchanged; recorded here as the contract the frontend consumes.

- Method: `GET`
- URL: `API_BASE_URL` + `/api/version` (`API_BASE_URL` = `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no parameters, no headers, no body, no authentication.
- Response: `200 OK`, `Content-Type: application/json`

  ```json
  { "version": "0.1.0" }
  ```

  `version` is always a non-empty string: `[project].version` from `backend/pyproject.toml` (`0.1.0` today) when the distribution is installed, the sentinel `"unknown"` otherwise. A wrong method yields FastAPI's `405`.

Frontend-side contract of the client module:

- `fetchVersion(): Promise<string>` resolves to `version` verbatim on a 2xx JSON body of the shape above.
- It rejects with an `Error` (message prefixed `Loading the version failed:`) on: network failure, timeout after `VERSION_REQUEST_TIMEOUT_MS` (5000 ms), any non-2xx status, a non-JSON body, or a body without a non-empty string `version`.
- `AppFooter` maps a resolution to the `resolved` state and any rejection to the `unavailable` state.

## Technology Selection

- HTTP call in `frontend/src/api/version.ts`: chose the platform-native `fetch` (already what `notes.ts` uses) over adding `axios`/`ky`, because a single GET with no auth, no interceptors and no retry is fully covered by `fetch`, and neither library is installed.
- Request timeout: chose the native `AbortController` plus `setTimeout` over a timeout helper library or a `Promise.race` wrapper, because the platform primitive aborts the actual request rather than abandoning a still-open connection, and it is a handful of lines.
- Response validation: chose a hand-written type guard (`isVersionResponse`, one object with one string field) over adding `zod`/`valibot`, because the shape has a single field and no installed dependency provides schema validation; a schema library for one field is exactly what "never add a new dependency for what a few lines can do" forbids.
- Footer state: chose React's own `useState`/`useEffect` over adding TanStack Query/SWR or a custom `useAppVersion` hook, because the value is read once, by one component, with no caching, refetch or sharing requirement (`coding_standards.md` Section 3.3, native state APIs first); a custom hook would wrap one effect used in one place.
- Shared API base URL (`frontend/src/api/apiBaseUrl.ts`): chose extracting the constant `notes.ts` already defines into one module over typing the default port a second time in `version.ts`, because `coding_standards.md` Section 5 requires one source per deployment-dependent value; this is a move of existing code, not a new dependency.
- Version endpoint: no net-new backend component. TEST-05's `GET /api/version` (already installed in this project, on `origin/main`) covers the need; building a second one was considered because the correction comment asks for it, and rejected as a duplicate router.
- E2E expected value: chose Playwright's built-in `page.waitForResponse` and `page.route` (already installed via `@playwright/test`) over reading `frontend/package.json` from disk (TEST-04's approach, wrong after the correction) or configuring a backend base URL in the E2E harness, because the browser's own `/api/version` response is the value under test and capturing it adds no second copy of the port.
- Test doubles: chose Vitest's own `vi.mock`, `vi.stubGlobal("fetch", …)` and `vi.useFakeTimers()` (already installed) over `msw` or `nock`, because the client is exercised by stubbing `fetch` exactly as `notes.test.ts` already does.

## File Manifest

### New files

- [A] frontend/src/api/apiBaseUrl.ts: `API_BASE_URL` resolution (`VITE_API_BASE_URL` with the `http://localhost:8010` default), moved out of `notes.ts` so the default has one source.
- [A] frontend/src/api/version.ts: `fetchVersion(): Promise<string>` client for `GET /api/version` with `AbortController` timeout, non-2xx, non-JSON and shape-guard rejections; `VersionResponse` type; `VERSION_REQUEST_TIMEOUT_MS`.
- [A] frontend/src/api/version.test.ts: Vitest tests for the client with `fetch` stubbed: happy path (value returned verbatim, URL called), non-2xx rejects, network error rejects, timeout aborts and rejects (fake timers), non-JSON body rejects, missing/non-string/empty `version` rejects, `VITE_API_BASE_URL` honoured.
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: Playwright spec: footer shows `v` + the version from the browser's own `/api/version` response; unreachable endpoint (`page.route` abort) shows the `version unavailable` marker with no `undefined`/`null`; 500 response shows the same marker (edge case).
- [G] e2e/uat/scenarios/TEST-08_footer_app_version.feature: Gherkin scenarios, one per acceptance criterion plus the backend-stopped edge case.
- [G] e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md: manual UAT script expanded from `## Manual verification plan` below.
- [G] .claude/artifacts/TEST-08/uat_script.md: the copy of the manual script build-feature Section 14 step 3 writes.

### Modified files

- [A] frontend/src/api/notes.ts: replace the local `DEFAULT_API_BASE_URL`/`API_BASE_URL` definitions with `import { API_BASE_URL } from "./apiBaseUrl"`; no behaviour change.
- [A] frontend/src/components/AppFooter.tsx: drop the `package.json` import; fetch the version on mount via `fetchVersion`; render the loading / resolved / unavailable states under `app-footer`, `app-footer-version`, `app-footer-version-unavailable`.
- [A] frontend/src/components/AppFooter.test.tsx: mock `../api/version`; assert version present (`Task Notes v1.2.3`, `app-footer-version` text), version absent (`app-footer-version-unavailable` reads `version unavailable`, `app-footer-version` absent, footer text contains neither `undefined` nor `null`), loading (pending promise: footer reads exactly `Task Notes`), and the `contentinfo` landmark; remove the `package.json` import.
- [A] frontend/src/components/LandingPage.test.tsx: remove the `package.json` import; add `vi.mock("../api/version")` with a resolved default; re-point the footer test at the mocked version via `app-footer-version`.
- [D] e2e/tests/TEST-04_page_footer.spec.ts: replace the `readFileSync(frontend/package.json)` version with the version captured from the page's own `/api/version` response (`page.waitForResponse` around `page.goto("/")`); the four existing tests keep their assertions otherwise.
- [G] e2e/uat/scenarios/TEST-04_page_footer.feature: re-scope the one step "matches the "version" field of frontend/package.json" to "matches the version returned by GET /api/version on the backend"; nothing else changes.
- [G] e2e/uat/scripts/TEST-04_page_footer_uat_script.md: re-scope the `frontend/package.json` prerequisite bullet and step 4 to `curl -s http://localhost:8010/api/version`; nothing else changes (its stale `5173`/`8000` ports predate the port move and are out of this item's scope).

No lockfile entry: this item adds or changes no dependency in `frontend/package.json`, `package.json` or `backend/pyproject.toml`, so `package-lock.json` and `uv.lock` are untouched. No `README.md` or `docs/DEVELOPMENT.md` entry: project structure, run configuration, dependencies and test infrastructure are unchanged (build-feature Section 15's condition does not fire); neither file documents the footer or the `frontend/src/api/` tree. `frontend/src/components/LandingPage.tsx` and everything under `backend/` are deliberately not modified.

## Testing Strategy

Tiers judged per `testing_standards.md` Section 6.

- Unit tests (Vitest, frontend): warranted, the feature adds client logic with four failure branches and a component with three render states. The frontend has no separate test directory: tests are colocated as `*.test.ts(x)` beside the source, the convention every existing frontend test follows (`CLAUDE.md`'s `backend/tests/unit/` and `test_{module}_unit.py` apply to the backend, which this item does not touch).
  - Directory: `frontend/src/api/` and `frontend/src/components/` (colocated)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, matching `notes.test.ts` and `AppFooter.test.tsx`
  - `frontend/src/api/version.test.ts` (fetch stubbed with `vi.stubGlobal`, as `notes.test.ts` does): returns the backend's `version` verbatim (`"9.9.9"`, proving pass-through with no rewriting) and calls `http://localhost:8010/api/version`; passes `"unknown"` through unchanged; rejects with `Loading the version failed: 500 Internal Server Error` on non-2xx; rejects when `fetch` rejects (network error); rejects with the timeout message when the request exceeds 5000 ms (fake timers, fetch mock rejecting on `signal` abort); rejects on a non-JSON body; rejects on `{}`, `{ "version": 1 }` and `{ "version": "   " }`; honours `VITE_API_BASE_URL` (`vi.stubEnv` plus `vi.resetModules`).
  - `frontend/src/components/AppFooter.test.tsx` (`../api/version` mocked): **version present**: `fetchVersion` resolves `"1.2.3"`, `app-footer-version` has text `v1.2.3` and `app-footer` has text `Task Notes v1.2.3`; **version absent**: `fetchVersion` rejects, `app-footer-version-unavailable` has text `version unavailable`, `app-footer-version` is not in the document, and the footer's text content contains neither `undefined` nor `null`; **loading**: `fetchVersion` returns a never-settling promise, the footer's text is exactly `Task Notes`; the footer is the `contentinfo` landmark carrying `data-testid="app-footer"`.
  - `frontend/src/components/LandingPage.test.tsx`: the existing footer test asserts `Task Notes` plus the mocked version through `app-footer-version`; all other tests unchanged.
- Integration tests: not warranted. No router, repository, model or migration changes; TEST-05's `backend/tests/integration/test_version_integration.py` already exercises `GET /api/version` through the full HTTP cycle and is untouched. The toggle is ENABLED; the tier simply has nothing new to test.
  - Directory: `backend/tests/integration/` (no file added)
- E2E tests: warranted for criterion 1, which needs a browser loading the landing page against a live backend.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-08_footer_app_version.spec.ts`
  - Specs: (1) capture the `/api/version` response with `page.waitForResponse` around `page.goto("/")`, then assert `app-footer-version` has text `v` + that response's `version` and `app-footer` contains `Task Notes`; (2) `page.route("**/api/version", route => route.abort())`, then assert `app-footer-version-unavailable` reads `version unavailable`, `app-footer-version` has count 0 and the footer text contains neither `undefined` nor `null`; (3) edge case: `route.fulfill({ status: 500 })` yields the same marker. Locators by `data-testid` only; no fixed waits.
  - `e2e/tests/TEST-04_page_footer.spec.ts` is re-scoped in the same phase (File Manifest) so it stops asserting the `package.json` version, which would otherwise go red the moment the footer switches source.
- UAT scenarios: one Gherkin scenario per criterion plus the backend-stopped edge case, and the manual script expanded from `## Manual verification plan`.
  - Directory: `e2e/uat/scenarios/`, `e2e/uat/scripts/`
  - Files: `e2e/uat/scenarios/TEST-08_footer_app_version.feature`, `e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md`, plus `.claude/artifacts/TEST-08/uat_script.md`; TEST-04's feature file and script get the one-line re-scope listed in the File Manifest.

The test gate command runs unchanged: the backend suite is untouched and green, the frontend suite gains the new Vitest files.

### Criterion coverage

| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer renders the version string on the landing page | E2E | — |
| 2 | The version comes from a single declared source (superseded: the backend's `GET /api/version` at runtime), never a string typed into the component | Unit | Provenance is not observable through navigation: a browser cannot tell a fetched `0.1.0` from a typed one. `version.test.ts` proves the client returns an arbitrary mocked value (`9.9.9`) verbatim from `/api/version`, and `AppFooter.test.tsx` proves the footer renders whatever the client returns, so no literal in the component can satisfy the tests; E2E spec 1 corroborates against the live backend. |
| 3 | When the version cannot be resolved, the footer renders without it rather than `undefined`, `null` or an empty gap | Unit | The failure path is a component render decision on a rejected promise; `AppFooter.test.tsx`'s version-absent case asserts the marker, the absence of `app-footer-version` and the absence of `undefined`/`null` in the text in milliseconds. E2E specs 2 and 3 corroborate the same states through `page.route`. |
| 4 | A component test asserts both paths: version present, and version absent | Unit | The criterion *is* a component test; `AppFooter.test.tsx`'s two named cases are the deliverable, and a browser test could only observe that they exist. |

## Acceptance Test Outline

| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer renders the version on the landing page | Spec 1: open `/`, capture the page's own `GET /api/version` response, assert `app-footer-version` reads `v` + its `version` and `app-footer` contains `Task Notes` | Given the stack is running, When I open the landing page, Then the footer reads "Task Notes v" followed by the version `curl http://localhost:8010/api/version` returns |
| 2 | Version from the backend at runtime, never typed into the component | Covered at Unit, see Criterion coverage; spec 1 corroborates by asserting against the live response | Given the backend is stopped, When I reload the landing page, Then no version is shown, proving it is not baked into the frontend bundle |
| 3 | Unresolvable version renders without it, no `undefined`/`null`/gap | Covered at Unit, see Criterion coverage; specs 2 and 3 corroborate via `page.route` abort and 500 | Given `/api/version` is unreachable, When I open the landing page, Then the footer reads "Task Notes · version unavailable" and contains neither "undefined" nor "null" |
| 4 | Component test asserts both paths | Covered at Unit, see Criterion coverage | Given the frontend test suite, When I run it, Then the AppFooter tests "version present" and "version absent" both pass |

## Manual verification plan

### Criterion 1: The footer renders the version string on the landing page
Prerequisites: Docker running; from the repository root `docker compose up -d --build` has completed and `docker compose ps` shows `db`, `backend` and `frontend` as running; nothing else bound to ports 5183 or 8010.
1. In a terminal run `curl -s http://localhost:8010/api/version` → the response is `{"version":"0.1.0"}` (the value is whatever `[project].version` in `backend/pyproject.toml` says; note it down).
2. Open `http://localhost:5183` in a browser → the landing page shows the title `Task Notes`, the note form and the list.
3. Read the footer at the bottom of the page → it reads `Task Notes v0.1.0`, the same version as step 1.
4. Open DevTools → Network, reload the page, filter on `version` → one request `GET http://localhost:8010/api/version` with status 200 and body `{"version":"0.1.0"}`.
5. Open DevTools → Elements and inspect the footer → a `<footer data-testid="app-footer">` containing a `<span data-testid="app-footer-version">` whose text is `v0.1.0`.

### Criterion 2: The version comes from the backend at runtime, never a string typed into the component
Prerequisites: Criterion 1 passed; the stack is still running.
1. In a terminal run `docker compose stop backend` → the command completes and `docker compose ps` shows `backend` as exited.
2. Reload `http://localhost:5183` → the page still renders; the footer reads `Task Notes · version unavailable` and no version number is anywhere in it. A version compiled into the frontend bundle would still be showing here; its absence proves the source is the backend.
3. Run `docker compose start backend`, wait until `curl -s http://localhost:8010/api/version` answers again, reload the page → the footer reads `Task Notes v0.1.0` again.
4. Not verifiable through the UI beyond steps 1 to 3; the observable code check is: open `frontend/src/components/AppFooter.tsx` and `frontend/src/api/version.ts` and confirm neither contains a version literal (no `0.1.0`, no `package.json` import, no `VITE_` version variable); the only version-shaped text is the `v` prefix.

### Criterion 3: When the version cannot be resolved, the footer renders without it rather than `undefined`, `null` or an empty gap
Prerequisites: the stack is running.
1. Run `docker compose stop backend` → `backend` shows as exited.
2. Open `http://localhost:5183` → the footer reads exactly `Task Notes · version unavailable`.
3. Select the footer text with the mouse or read it in DevTools → Elements → it contains neither the word `undefined` nor `null`, there is no trailing `v` with nothing after it, and no `<span data-testid="app-footer-version">` element exists; a `<span data-testid="app-footer-version-unavailable">` does.
4. In DevTools → Network the `GET /api/version` request shows as failed (connection refused) and the page shows no error dialog or blank area where the version would be.
5. Run `docker compose start backend` → after the backend answers `curl` again and the page is reloaded, the footer returns to `Task Notes v0.1.0`.

### Criterion 4: A component test asserts both paths: version present, and version absent
Prerequisites: Node 20 installed; `npm install` has been run inside `frontend/`.
1. Not verifiable through the UI. In a terminal, from the `frontend/` directory, run `npm test` → Vitest reports the suite green.
2. Read the reporter output for `src/components/AppFooter.test.tsx` → it lists a passing test named for the version-present path (footer reads `Task Notes v1.2.3`) and a passing test named for the version-absent path (footer reads `Task Notes · version unavailable`, no `undefined`/`null`), plus the loading and landmark tests.
3. From the repository root run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts e2e/tests/TEST-04_page_footer.spec.ts` with the stack running → all specs pass, including the re-scoped TEST-04 spec.
