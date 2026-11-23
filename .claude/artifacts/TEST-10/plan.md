# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What:** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes:** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates. Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 51 comments read by the dispatching session, all automated "mayker-dev:" notices from earlier runs → Addressed by: not acted on, because none states a requirement or a correction to the feature text.
- Assumption (criterion 2, recorded instead of a blocking question): the version and the commit arrive in the same `GET /api/version` response, so while that request is pending or after it fails there is no version either. On the plan base TEST-08 renders the name alone ("Task Notes") in those states. This plan reads criterion 2 as "no commit is shown and the footer is exactly what TEST-08 renders without it": name alone while pending or failed, "Task Notes v{version}" when the response carries a version but no usable commit. Never `undefined`, `null`, `unknown` or an error text.
- Assumption (usable commit): the backend answers `commit: "unknown"` when `BUILD_COMMIT` is unset (backend/app/core/config.py `DEFAULT_BUILD_COMMIT`), and an older backend may omit the field. Both count as "no commit": the footer shows the version alone, mirroring how TEST-08 treats the `"unknown"` version sentinel.
- Assumption (placement): the commit renders only next to a rendered version ("next to the version" in criterion 1). When the version itself is the `"unknown"` sentinel the footer stays name-only, as TEST-08 left it.
- Assumption (format): rendered as "Task Notes v0.1.0 (abcdef1)": the commit in parentheses after the version, in its own sibling span. The version span keeps its exact text `v{version}` because e2e/tests/TEST-08_footer_app_version.spec.ts asserts it with `toHaveText`.
- Merged since the last plan: n/a (fresh plan, branched from current main 4dc99708).

## Plan Overview
Frontend only. The version API client (frontend/src/api/version.ts) starts returning the commit alongside the version, and AppFooter renders the first 7 characters of that commit after the version. No backend change: TEST-09 already returns `commit` (first 12 characters of `BUILD_COMMIT`, default `"unknown"`) from `GET /api/version`. The 7-character display truncation lives in the component, because it is a display concern and the backend's 12 is the API's contract.

## Frontend Plan
- Components to create/modify:
  - frontend/src/api/version.ts: replace `getBackendVersion(): Promise<string>` with `getBackendVersionInfo(): Promise<BackendVersionInfo>`, where `BackendVersionInfo = { version: string; commit: string | null }`. Version validation unchanged (non-OK status or a missing/empty/non-string `version` still rejects with "Loading the version failed: ..."). `commit` is the response's `commit` when it is a non-empty string, otherwise `null`; a bad commit never rejects the call, because the version alone is still worth showing. Update `VersionResponse` to `{ version: string; commit: string }`. Rename rather than keep both functions: `getBackendVersion` has no other caller (AppFooter.tsx is the only import), so keeping it would be dead code.
  - frontend/src/components/AppFooter.tsx: state becomes `BackendVersionInfo | null`; call `getBackendVersionInfo()`. Render the version span exactly as today (`data-testid="app-footer-version"`, text ` v{version}`, hidden when version is `"unknown"`). Add a sibling span `data-testid="app-footer-commit"` with text ` ({commit.slice(0, 7)})`, rendered only when the version span renders AND `commit !== null` AND `commit !== "unknown"`. Constants: `COMMIT_DISPLAY_LENGTH = 7`, `UNKNOWN_COMMIT = "unknown"` (with a "why" comment naming backend/app/core/config.py `DEFAULT_BUILD_COMMIT`). Pending and failure stay `null` state, so the footer is "Task Notes" alone, unchanged from TEST-08.
- Routes: none (landing page `/` only).
- State management: local `useState` in AppFooter, as today.
- Design reference notes: AI freestyle. The commit span inherits the footer's existing style (0.875rem, #5f5f5f); no new style values.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version (existing, TEST-05 and TEST-09; consumed, not changed)
- Request: none
- Response: `{"version": "0.1.0", "commit": "abcdef123456"}`; `commit` is at most 12 characters, `"unknown"` when `BUILD_COMMIT` is unset or blank
- Client contract (frontend/src/api/version.ts): `getBackendVersionInfo()` resolves `{ version: "0.1.0", commit: "abcdef123456" }`, or `{ version: "0.1.0", commit: null }` when `commit` is missing, empty or not a string; rejects as today when the request fails or `version` is unusable.

## Technology Selection
- Commit truncation: chose `String.prototype.slice(0, 7)` from the standard library; no helper module or dependency is needed.
- No net-new component, module or dependency: the feature extends the existing client and component and adds one span.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec for criterion 1 plus one edge case (unknown commit shows the version alone)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/version.ts: `getBackendVersion` becomes `getBackendVersionInfo`, returning the version and a nullable commit
- [A] frontend/src/api/version.test.ts: tests renamed to the new function; commit returned, and null commit when missing, empty or non-string
- [A] frontend/src/components/AppFooter.tsx: render the first 7 characters of the commit in an `app-footer-commit` span after the version
- [A] frontend/src/components/AppFooter.test.tsx: mock switched to `getBackendVersionInfo`; success, pending, failure and unknown-commit paths for the commit
- [A] frontend/src/components/LandingPage.test.tsx: its `../api/version` mock switched to `getBackendVersionInfo` resolving `{ version, commit }` (lines 5, 12 to 14, 20, 33 to 34 only); no LandingPage.tsx change

No dependency is added or changed, so no lockfile is regenerated. README.md and docs/DEVELOPMENT.md need no edit: no project structure, run configuration, dependency or test-infrastructure change (README already documents the optional BUILD_COMMIT).

## Testing Strategy
- Unit tests: Vitest component and client tests beside the source files (project layout: tests beside each component and api client).
  - Directory: frontend/src/components/ and frontend/src/api/
  - Naming: {Module}.test.tsx / {module}.test.ts
- Integration tests: not warranted: no repository, model, migration or endpoint changes (backend untouched; TEST-09 owns the endpoint's integration tests).
  - Directory: backend/tests/integration/ (unused by this item)
- E2E tests: criterion 1 (the commit reaching the rendered footer through the real fetch path) plus the unknown-commit edge case. Each test uses `page.route` on the exact pathname `/api/version` with `route.fetch()` and then `route.fulfill({ response, json: { ...body, commit: ... } })`, so the real backend answers and its CORS headers are kept while the commit is made deterministic (BUILD_COMMIT is unset in the local and CI stacks, which would otherwise always yield `"unknown"`). Match on `new URL(url).pathname === "/api/version"`, never a substring, for the Vite module-URL reason TEST-08's spec documents.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the unknown-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from GET /api/version, next to the version | E2E | `shows the first 7 characters of the build commit next to the version in the landing page footer`, `renders the first 7 characters of the build commit next to the version` | — |
| 2 | While pending or on failure, the footer shows the version alone, never undefined or an error | Unit | `renders no commit while the version request is pending`, `renders no commit when the version request fails`, `renders the version alone when the backend reports the unknown commit`, `renders the version alone when the response carries no commit` | verifying it needs no navigation or interaction: it is the component's rendering of a pending, rejected or commit-less client result, fully controlled by mocking the client |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the first 7 characters of the build commit next to the version`, `renders no commit while the version request is pending`, `renders no commit when the version request fails` | the criterion is itself a component test; its existence and passing are verified by the Vitest run, not through the UI |

Client tests in frontend/src/api/version.test.ts (supporting criteria 1 and 2): `returns the version and the commit from GET /api/version`, `returns a null commit when the response carries no usable commit`. E2E edge case: `shows the version alone when the backend reports the unknown commit`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows first 7 commit characters next to the version | Open `/` with /api/version's real response rewritten to `commit: "abcdef123456"`; expect `app-footer-commit` to have text `(abcdef1)` and `app-footer` to contain `Task Notes v{version} (abcdef1)` | Given the backend reports commit abcdef123456, When I open the landing page, Then the footer reads "Task Notes v{version} (abcdef1)" |
| 2 | Pending or failed request shows no commit, no undefined or error | covered at Unit, see Criterion coverage; E2E edge spec covers the unknown-commit variant | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no commit, "undefined" or error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run AppFooter.test.tsx, Then the success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker running; from the repository root the stack is started with BUILD_COMMIT set, for example `BUILD_COMMIT=abcdef1234567890 docker compose up -d --build`.
1. Run `curl -s http://localhost:8010/api/version` → the JSON carries `"commit": "abcdef123456"` and a `version` value; note that version.
2. Open `http://localhost:5183/` in a browser → the landing page shows the "Task Notes" heading.
3. Scroll to the footer at the bottom of the page → it reads `Task Notes v{the noted version} (abcdef1)`: seven commit characters, in parentheses, after the version.

### Criterion 2: While pending or on failure, the footer shows no commit and no error text
Prerequisites: the stack from criterion 1 is running.
1. Run `docker compose stop backend` → the backend container stops.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`: no version, no commit, and no `undefined`, `null`, `unknown` or error text.
3. Run `docker compose up -d backend` without BUILD_COMMIT (open a new shell, or `unset BUILD_COMMIT` first) and wait until `curl -s http://localhost:8010/api/version` answers with `"commit": "unknown"`.
4. Reload `http://localhost:5183/` → the footer reads `Task Notes v{version}` with no parenthesised commit and no `unknown` text.
5. The pending state is too brief to observe by hand: read the component test `renders no commit while the version request is pending` in frontend/src/components/AppFooter.test.tsx as the check instead.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run's summary reports no failed or errored test and the command exits 0.
2. In its output, find the tests `renders the first 7 characters of the build commit next to the version`, `renders no commit while the version request is pending` and `renders no commit when the version request fails` → each is listed as passed.
