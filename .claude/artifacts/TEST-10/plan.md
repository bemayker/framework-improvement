# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What.** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria.**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes.** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.

## Acceptance Criteria
<!-- Criterion 2 is restated to what one request carrying both fields can deliver; the reconciliation is recorded under Re-Plan Feedback. -->
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added: `Task Notes v{version} ({commit7})`.
- [ ] 2. When no commit can be shown (the request is pending, the request fails, or the backend reports no usable commit), the footer shows no commit and never `undefined`, `null`, `unknown` or an error: it reads `Task Notes v{version}` when a version is known, and TEST-08's `Task Notes` alone while pending or after a failed request.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 39 comments over 2 pages, all framework PR-opened notes from earlier runs → not acted on because none carries feedback on this item's behaviour or scope.
- Assumption (criterion 2 vs TEST-08's merged states, no human to ask): `GET /api/version` returns `version` and `commit` in one body (`backend/app/schemas/version.py`), so while that request is pending or after it fails the footer has no version either and cannot literally show "the version alone". This plan keeps TEST-08's merged behaviour for those two states, `Task Notes` alone with no `app-version` and no `app-commit` element (`frontend/src/components/AppFooter.tsx`, pinned by TEST-08's tests `renders the app name without a version while the request is pending` and `renders the app name without a version when the request fails`). The part of criterion 2 that one request can actually honour is the case where the request succeeds but carries no usable commit (`commit` is `unknown`, which TEST-09 answers whenever `BUILD_COMMIT` is unset, blank, or the field is missing from an older backend): there the footer shows exactly `Task Notes v{version}`. Rejected alternative: a second request or a cached version to show during pending, because it adds a request the criteria do not ask for and would contradict TEST-08 criterion 5 (`user_story_alignment.md` Section 3).
- Assumption: the commit is shown only next to a version. When the backend reports a commit but its version is `unknown` (TEST-08 maps that to no version), the footer stays `Task Notes` alone, because criterion 1 places the commit "next to the version" and a bare commit after the app name would read as a version.
- Assumption: the backend already cuts the commit to 12 characters (`backend/app/services/version_service.py`, `COMMIT_DISPLAY_LENGTH = 12`); the frontend cuts it to 7 for display. No backend change.
- Assumption (format): the commit renders in parentheses after the version, `Task Notes v0.1.0 (a1b2c3d)`, the commit text in its own `data-testid="app-commit"` span so tests and readers can tell it from the version. The criteria name no separator; parentheses keep `app-version` reading exactly `v{version}`, so TEST-08's specs keep passing.
- Merged since the last plan: n/a (fresh plan, branched from current main at df2dc5f, which holds both dependencies TEST-09 #763 and TEST-08 #764).

## Plan Overview
Frontend-only change on top of TEST-08's footer. The version client `frontend/src/api/version.ts` changes from returning the version string to returning both display values from the one `GET /api/version` body: `{ version, commit }`, each `string | null`, with the commit already cut to 7 characters and the backend's `unknown` sentinel mapped to `null`. `AppFooter` holds that object and appends ` (<span data-testid="app-commit">{commit}</span>)` after the version span when both are present. Pending and failure states are TEST-08's, unchanged. The two existing test files that mock the client (`AppFooter.test.tsx`, `LandingPage.test.tsx`) are updated to the new return shape. A new Playwright spec fulfils `/api/version` with a fixed body, because CI and the local stack leave `BUILD_COMMIT` unset (no `.github/` workflow sets it) and the live backend then answers `unknown`. No backend change, no new dependency, no migration.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): replace `getBackendVersion(): Promise<string | null>` with `getBackendVersionInfo(): Promise<BackendVersionInfo>`, where `export interface BackendVersionInfo { version: string | null; commit: string | null }`. Same single `fetch` of `${API_BASE_URL}/api/version`. Unchanged rules for `version`: throw `Loading the version failed: {status} {statusText}` on non-OK, throw `Loading the version failed: unexpected response shape` when `version` is not a string, map empty, blank or `unknown` to `null`. New rule for `commit`: when it is a string whose trim is neither empty nor `unknown`, return `trimmed.slice(0, SHORT_COMMIT_LENGTH)` with `const SHORT_COMMIT_LENGTH = 7`; otherwise (missing, not a string, blank, `unknown`) return `null` and never throw, so an older backend without the field still shows its version. Reuse the existing `BACKEND_UNKNOWN_VERSION` constant for both fields, renamed `BACKEND_UNKNOWN_SENTINEL` with its comment naming `version_service.py` and `config.py` (`DEFAULT_BUILD_COMMIT`). Rename rather than keep `getBackendVersion` alongside, so no dead export remains.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `useState<BackendVersionInfo | null>(null)`; the effect calls `getBackendVersionInfo()` with the same `isMounted` guard and swallowed rejection. Render: `Task Notes`, then when `info?.version` is set ` <span data-testid="app-version">v{version}</span>`, then when `info.version` and `info.commit` are both set ` (<span data-testid="app-commit">{commit}</span>)`. Never a trailing space or empty parentheses. `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local component state in `AppFooter`, as TEST-08.
- Design reference notes: AI freestyle. The commit inherits the existing footer style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`); no new values.

## Backend Plan
No backend changes required. `GET /api/version` already returns `{"version": str, "commit": str}` on main (TEST-09: `backend/app/routers/version.py`, `backend/app/schemas/version.py`, `backend/app/services/version_service.py` cutting to 12 characters, `backend/app/core/config.py` defaulting to `unknown`), covered by `backend/tests/integration/test_version_integration.py`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters.
- Response: `200 OK`, `{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}` (commit is at most 12 characters, or `"unknown"` when `BUILD_COMMIT` is unset). The client returns `{ version: "0.1.0", commit: "a1b2c3d" }`; with `"commit": "unknown"` or no `commit` field it returns `{ version: "0.1.0", commit: null }`.

## Technology Selection
- Commit shortening in `frontend/src/api/version.ts`: chose the standard `String.prototype.slice` over any formatting helper or dependency, because cutting to 7 characters is one call.
- Version and commit state in `AppFooter`: chose React's built-in `useState` and `useEffect`, already used by TEST-08, over a data-fetching library.
- No net-new component, module or dependency is introduced; every entry below modifies an existing module or adds a test.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright specs that fulfil `/api/version` with a fixed body and assert the 7-character commit next to the version, plus the `unknown`-commit edge case showing the version alone
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: the artifact copy of the manual UAT script that build-feature writes

### Modified files
- [A] frontend/src/api/version.ts: `getBackendVersionInfo()` returning `{ version, commit }` from one request, commit cut to 7 characters, sentinel and missing commit mapped to `null`
- [A] frontend/src/api/version.test.ts: tests renamed to the new function and extended with the commit rules
- [A] frontend/src/components/AppFooter.tsx: render the `app-commit` span in parentheses after the version when both are known
- [A] frontend/src/components/AppFooter.test.tsx: mock `getBackendVersionInfo`, keep TEST-08's cases on the new shape, add the commit success, pending, failure and no-commit cases
- [A] frontend/src/components/LandingPage.test.tsx: mock `getBackendVersionInfo` with the new return shape so the existing footer test keeps passing

No dependency changes, so no lockfile (`frontend/package-lock.json`, `backend/uv.lock`) is regenerated.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes (`BUILD_COMMIT` is already documented by TEST-09 in `.env.example` and README).
TEST-08's own specs, Gherkin and manual script stay unchanged: `app-version` still reads exactly `v{version}`, and with `BUILD_COMMIT` unset (the local and CI default) the footer still reads `Task Notes v0.1.0`.

## Testing Strategy
- Unit tests: Vitest, colocated with the source as the frontend already does.
  - `frontend/src/api/version.test.ts`: existing seven cases moved to `getBackendVersionInfo` (asserting `.version`), plus: commit cut to 7 characters, `unknown` commit to `null`, missing commit field to `null` without throwing.
  - `frontend/src/components/AppFooter.test.tsx`: commit shown in success, absent while pending, absent and no error on failure, absent when the backend reports no commit, absent when the version is unknown; TEST-08's existing cases kept on the new mock shape.
  - `frontend/src/components/LandingPage.test.tsx`: mock shape updated only.
  - Directory: colocated under `frontend/src/` (the CLAUDE.md unit directory `backend/tests/unit/` is the backend's; no backend test changes)
  - Naming: `{module}.test.ts(x)`, the frontend's existing convention
- Integration tests: no new tests. No router, repository or migration changes; the backend contract is TEST-09's, covered by `backend/tests/integration/test_version_integration.py`.
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 through the browser with `page.route` fulfilling `GET /api/version` (match by method and exact pathname, TEST-08's `isVersionApiRequest` pattern, because Vite serves `src/api/version.ts` under a URL containing the same text) with `{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}`; edge case with `"commit": "unknown"`. Fulfilling is required because no CI workflow sets `BUILD_COMMIT`, so the live backend answers `unknown`.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the unset `BUILD_COMMIT` edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit next to the version | E2E | `shows the first 7 characters of the build commit next to the version`, `renders the first 7 characters of the build commit next to the version`, `returns the version and the first 7 characters of the commit` | — |
| 2 | Pending, failed or no usable commit shows no commit, never `undefined`, `null`, `unknown` or an error | Unit | `renders no commit while the request is pending`, `renders no commit and no error when the request fails`, `renders the version alone when the backend reports no commit`, `renders no commit when the backend reports no version`, `returns a null commit when the backend reports the unknown sentinel`, `returns a null commit when the body has no commit field`, `shows the version alone when the backend reports no build commit` | each state is a render or client rule verifiable with a mocked response; a pending state in a browser is timing-dependent; the E2E edge spec is extra evidence, not the covering tier |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the first 7 characters of the build commit next to the version`, `renders no commit while the request is pending`, `renders no commit and no error when the request fails` | the criterion is itself a component test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Commit (7 chars) next to the version | Fulfil `/api/version` with version `0.1.0` and commit `a1b2c3d4e5f6`, open `/`, assert `app-footer` reads `Task Notes v0.1.0 (a1b2c3d)` and `app-commit` reads `a1b2c3d` | Given the backend was built with commit `a1b2c3d4e5f6`, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (a1b2c3d)" |
| 2 | No commit while pending, on failure, or when none is reported | covered at Unit, see Criterion coverage (plus the E2E `unknown`-commit edge spec) | Given the backend was built without a commit, When I open the landing page, Then the footer reads "Task Notes v0.1.0" with no "unknown" |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When it runs, Then the AppFooter commit tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: the stack is not running yet; `backend/pyproject.toml` has `version = "0.1.0"`.
1. From the repo root run `BUILD_COMMIT=a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 docker compose up -d --build` → all containers start.
2. Run `curl -s http://localhost:8010/api/version` → the body is `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}`.
3. Open `http://localhost:5183/` and scroll to the footer → it reads `Task Notes v0.1.0 (a1b2c3d)`: seven commit characters, in parentheses after the version.

### Criterion 2: Pending, failed, or no usable commit shows no commit and no error
Prerequisites: Criterion 1's stack is running.
1. In Chrome DevTools Network set throttling to `Slow 3G` and reload `http://localhost:5183/` → the footer first reads `Task Notes` alone (no version, no commit, no placeholder), then `Task Notes v0.1.0 (a1b2c3d)` once the `version` request finishes. Set throttling back to `No throttling`.
2. Run `docker compose stop backend` and reload the page → the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text.
3. Run `docker compose up -d --build backend` with no `BUILD_COMMIT` set in the shell or `.env` → the backend restarts.
4. Run `curl -s http://localhost:8010/api/version` → the body is `{"version":"0.1.0","commit":"unknown"}`.
5. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test` from the repo root → it runs `src/components/AppFooter.test.tsx`, `src/api/version.test.ts` and `src/components/LandingPage.test.tsx` among the frontend files and reports `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains `renders the first 7 characters of the build commit next to the version` (success), `renders no commit while the request is pending` (pending) and `renders no commit and no error when the request fails` (failure).
