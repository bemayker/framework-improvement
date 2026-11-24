# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> ## What
>
> The landing page footer shows the short build commit next to the version.
>
> ## Acceptance criteria
>
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> ## Notes
>
> Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 54 comments on ClickUp task 123k99cwybm, all automated "mayker-dev:" PR-link notices from earlier runs → not acted on because none states a requirement, a correction or an amendment to the feature text.
- Dependencies merged in this run: TEST-09 (#994, `GET /api/version` now returns `commit`, cut to 12 characters, `"unknown"` when `BUILD_COMMIT` is unset or blank) and TEST-08 (#995, `AppFooter` fetches `/api/version` at runtime) → this plan is written against `main` at 174ee472, which contains both; no merged-since overlap applies (fresh plan, branched from current main).
- Assumption (scope, criterion 2): version and commit arrive in ONE response, so "pending" and "request failed" have no version to show either. In those states the footer shows exactly TEST-08's state (app name only, no version, no commit, no placeholder). "Version alone" is the state where the request succeeded but carries no usable commit: commit missing, not a string, empty, or the backend's `"unknown"` sentinel (TEST-09's `DEFAULT_BUILD_COMMIT`). Without this rule the footer would print `unknown`, which is the first 7 characters of the sentinel.
- Assumption (scope, criterion 1): the commit renders only next to a rendered version; when the version itself is unusable (TEST-08's null case) no commit is shown, since there is nothing for it to sit next to. Format: `Task Notes v{version} ({short commit})`, the commit in parentheses after a space.
- Assumption (design): the shortening to 7 characters happens in the component, not the client: the client reports what the backend said, the footer decides how much of it to show.

## Plan Overview
Frontend only. Extend the existing version client (`frontend/src/api/version.ts`) to return the backend's `commit` beside `version`, and extend `AppFooter` to render the first 7 characters of that commit in its own `data-testid="app-commit"` span directly after the existing `app-version` span. The existing `app-version` span keeps its exact text (`v{version}`), so TEST-04's and TEST-08's E2E specs stay valid unchanged. No backend change: TEST-09 already serves the field. `LandingPage.tsx` is NOT modified; only its test file changes, because it mocks the version client whose return shape changes.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `getBackendVersion()` returns `Promise<BackendVersion>` where `BackendVersion = { version: string | null; commit: string | null }` (exported type). `version` keeps today's rules unchanged (throws on non-OK or non-string version; `""` and `"unknown"` map to null). `commit` is the body's `commit` when it is a non-empty string other than `"unknown"`, otherwise null; a missing or malformed commit never throws, so a response that is good for the version still shows the version (criterion 2). Add `UNKNOWN_BUILD_COMMIT = "unknown"` beside the existing `UNKNOWN_BACKEND_VERSION`, with a one-line why comment naming TEST-09's sentinel.
  - `frontend/src/components/AppFooter.tsx`: state becomes `BackendVersion | null` (null while pending or after a rejection). Add `SHORT_COMMIT_LENGTH = 7`. Render `{version !== null && <span data-testid="app-version"> v{version}</span>}` exactly as today, followed by `{version !== null && commit !== null && <span data-testid="app-commit"> ({commit.slice(0, SHORT_COMMIT_LENGTH)})</span>}`. The `.catch(() => {})` and `isMounted` guard stay. Update the existing comment so it also says the commit is never shown without a version.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today; no new state library.
- Design reference notes: AI freestyle. The commit span inherits `footerStyle` (0.875rem, #5f5f5f) and adds no style of its own.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05 and TEST-09; consumed, not changed)
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}`. `commit` is at most 12 characters, or the literal `"unknown"` when the backend has no `BUILD_COMMIT`.
- Client contract (`getBackendVersion`): resolves `{ version: "0.1.0", commit: "a1b2c3d4e5f6" }`; `{ version: "0.1.0", commit: null }` for a missing, non-string, empty or `"unknown"` commit; rejects on non-OK status or a non-string version (unchanged).

## Technology Selection
- Commit shortening: chose `String.prototype.slice(0, 7)` (standard library) over any formatting helper or dependency; no new module.
- No net-new component, module or dependency otherwise: the feature extends the existing `AppFooter` and version client, and the tests use the already installed Vitest, Testing Library and Playwright.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec, footer shows the 7-character commit next to the version, and the version alone for the unknown commit
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: artifact copy of the manual UAT script

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }`, add the `BackendVersion` type and the `UNKNOWN_BUILD_COMMIT` sentinel
- [A] frontend/src/components/AppFooter.tsx: render the `app-commit` span with the first 7 characters of the commit after the version
- [A] frontend/src/api/version.test.ts: update existing assertions to the object shape and add commit cases
- [A] frontend/src/components/AppFooter.test.tsx: mocks resolve the object shape; add success, pending, failure and unusable-commit commit cases
- [A] frontend/src/components/LandingPage.test.tsx: the `getBackendVersion` mock resolves `{ version: BACKEND_VERSION, commit: null }` instead of a bare string (mock shape only, no new test)

No dependency changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` change: the feature changes no project structure, run configuration, dependency or test infrastructure (`BUILD_COMMIT` wiring already exists from TEST-09).

## Testing Strategy
- Unit tests: the version client's commit parsing and the footer's three render paths (success, pending, failure) plus the unusable-commit path, with `getBackendVersion` mocked in the component test and `fetch` stubbed in the client test.
  - Directory: beside the file, `frontend/src/` (project-standards Layout: tests beside the file as `*.test.ts(x)`)
  - Naming: `{Component}.test.tsx`, `{module}.test.ts`
- Integration tests: not warranted: no endpoint, repository or migration changes (testing_standards.md Section 6); the backend contract is TEST-09's and already covered by `backend/tests/integration/test_version_integration.py`.
- E2E tests: criterion 1 only, through the landing page with `/api/version` fulfilled by `page.route` (exact pathname match, as TEST-08's spec does, so the Vite module `src/api/version.ts` is not intercepted) with a fixed 12-character commit; plus one edge-case spec fulfilling `"commit": "unknown"`. Stubbing the response keeps the spec independent of whatever `BUILD_COMMIT` the E2E stack runs with.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus an edge case (unknown commit)
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | `shows the short build commit next to the version in the landing page footer` | — |
| 2 | While pending or on failure, the footer shows the version alone, never `undefined` or an error | Unit | `renders only the app name while the version request is pending`, `renders only the app name when the version request fails`, `renders the version alone when the backend reports no usable commit`, `returns a null commit when the backend reports the unknown commit sentinel`, `returns a null commit when the response has no string commit` | verifying it needs no navigation or interaction: it is the footer's render state for a pending, rejected or commit-less response, which a browser cannot hold pending deterministically |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the first 7 characters of the build commit next to the version`, `renders only the app name while the version request is pending`, `renders only the app name when the version request fails` | the criterion is itself a component test requirement, satisfied by the Vitest file |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 characters of the commit next to the version | Fulfil `/api/version` with `{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}`, open `/`, assert `app-version` reads `v0.1.0` and `app-commit` contains `a1b2c3d` and not `a1b2c3d4` | Given the backend reports commit a1b2c3d4e5f6, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (a1b2c3d)" |
| 2 | Pending or failed shows the version alone, never undefined or an error | covered at Unit, see Criterion coverage; edge-case E2E spec fulfils `"commit": "unknown"` and asserts `app-commit` has count 0 and the footer has no `unknown` or `undefined` | Given the backend has no build commit, When I open the landing page, Then the footer reads "Task Notes v0.1.0" with no commit |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When AppFooter.test.tsx runs, Then it passes |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: the stack is started from the repository root with a known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up --build -d`.
1. Open `http://localhost:8010/api/version` in the browser → the JSON shows `"commit": "0123456789ab"` and the version from `backend/pyproject.toml` (for example `"version": "0.1.0"`).
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading.
3. Scroll to the footer at the bottom of the page → it reads `Task Notes v0.1.0 (0123456)`: exactly 7 commit characters, directly after the version.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack from criterion 1 is running; Chrome DevTools is available.
1. Open `http://localhost:5183/`, open DevTools → Network, right-click the `version` request and choose "Block request URL", then reload → the footer reads `Task Notes` only, with no `undefined`, no `unknown` and no error text.
2. In DevTools → Network, remove the block and set throttling to "Slow 3G", then reload → while the `version` request is still pending the footer reads `Task Notes` only; once it completes it reads `Task Notes v0.1.0 (0123456)`.
3. Stop the stack and restart it without a commit: `docker compose down`, then `BUILD_COMMIT= docker compose up --build -d`, open `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, with no parentheses, no `unknown` and no `undefined`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run's summary line reports no failed or errored test and the command exits 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains the tests `renders the first 7 characters of the build commit next to the version`, `renders only the app name while the version request is pending` and `renders only the app name when the version request fails`.
