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
- Comment (tracker): the item's thread holds only bot PR-opened notes from earlier runs (0 actionable, recorded in decisions.md) → Addressed by: nothing to act on; none of them is an instruction.
- Assumption (criterion 2, recorded instead of a question): version and commit arrive in the same `GET /api/version` response, so while that one request is pending, or when it fails, there is no version to show either. "The version alone" is therefore read as "what TEST-08 shows in that state, with no commit": the footer reads exactly `Task Notes` (TEST-08's unchanged pending and failure behaviour), and never `undefined`, `null`, `unknown`, a placeholder or an error text. The commit-specific failure case, where the request succeeds but the commit is absent, malformed or the backend's `unknown` sentinel, shows the version alone: `Task Notes v0.1.0`.
- Assumption (criterion 1, display shape): the commit renders after the version in parentheses, `Task Notes v0.1.0 (0123456)`, in its own element `data-testid="app-footer-commit"`, and only when a version is shown. The first 7 characters are cut on the frontend from the backend's 12-character value (TEST-09 serves `BUILD_COMMIT[:12]`).
- Orchestrator re-plan feedback 1 (/deliver 6.2, run deliver-20261125T083205Z): `frontend/src/components/LandingPage.test.tsx` line 32 mocks `fetchBackendVersion` with the bare string `"9.8.7"` and its test `renders the footer with the app name and version` asserts `app-footer-version` contains it; the new `{ version, commit } | null` return shape breaks it → Addressed by: manifest entry `[A] frontend/src/components/LandingPage.test.tsx`, mock moved to `{ version: BACKEND_VERSION, commit: null }`, no other change. `LandingPage.tsx` stays untouched.
- Orchestrator re-plan feedback 2: `e2e/tests/TEST-08_footer_app_version.spec.ts` line 36 asserts the whole footer equals `Task Notes v{version}`, and `docker-compose.yml` line 43 passes `BUILD_COMMIT` through (`.env.example` lists it), so a configured commit turns that merged spec red once this feature lands (this plan's own Manual verification Criterion 1 step 1 does exactly that) → Addressed by: manifest entry `[D] e2e/tests/TEST-08_footer_app_version.spec.ts`, the whole-footer `toHaveText` replaced by an exact `toHaveText` on `app-footer-version` (` v{version}`), the `toContainText` line kept, the unreachable-backend test unchanged.
- Orchestrator re-plan feedback 3: supporting text → Addressed by: the TEST-08 spec removed from the "Not touched" line; in `shared_risks.md` both files listed under modified files and the TEST-08-spec conflict bullet dropped as closed.
- Merged since the last plan: n/a (fresh plan, plan base e499c421 is the current main tip).

## Plan Overview
Frontend only. The existing version client (`frontend/src/api/version.ts`, TEST-08) is extended to read the `commit` field TEST-09 added to `GET /api/version`, cut it to 7 characters and turn the `unknown` sentinel or a missing or non-string commit into `null`, without failing the version. `AppFooter.tsx` stores the returned version info and renders the short commit next to the version. `LandingPage.tsx` is not touched: it already renders `<AppFooter />`; only its test's version mock moves to the new client shape. TEST-08's E2E happy path is narrowed from the whole footer text to the version element, so it stays green when a build commit is configured. No backend, no new route, no new dependency.

## Frontend Plan
- Components to create/modify: `frontend/src/components/AppFooter.tsx` (state changes from a version string to the client's `BackendVersion` object; renders `<span data-testid="app-footer-commit"> ({commit})</span>` right after the existing version span, only when the version is shown and `commit !== null`). `frontend/src/api/version.ts` (adds `commit` to `VersionResponse`; `fetchBackendVersion` returns `{ version: string; commit: string | null } | null`, null still meaning the backend reported the unknown version; `commit` is the first 7 characters of the response's commit, or `null` when it is missing, not a non-empty string, or equals `unknown`). A malformed commit never throws, so a commit problem costs the commit and not the version (criterion 2). `frontend/src/components/LandingPage.test.tsx`: only the `fetchBackendVersion` mock in `beforeEach` moves to `{ version: BACKEND_VERSION, commit: null }`; no test added or removed.
- Routes: none.
- State management: local `useState` in `AppFooter`, as TEST-08 built it; one request, one state value.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05, commit field TEST-09; consumed, not changed)
- Request: no body, no parameters
- Response: `{"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is at most 12 characters, or `"unknown"` when `BUILD_COMMIT` is unset or blank. `version` is `"unknown"` when unresolvable.
- Frontend client contract (`fetchBackendVersion`): resolves `null` for an unknown version; resolves `{ version: "0.1.0", commit: "0123456" }` for the example above; resolves `{ version: "0.1.0", commit: null }` when the commit is `"unknown"`, missing or not a non-empty string; rejects on a non-2xx status or a missing or non-string version (unchanged).

## Technology Selection
- Short commit: chose `String.prototype.slice(0, 7)` (language standard library) over a formatting helper or dependency, because one call covers it.
- No net-new component, module or dependency: the feature extends the existing `version.ts` client and `AppFooter.tsx` component with the already-installed React, Vitest, Testing Library and Playwright.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec for the short commit next to the version, and the version-alone edge case for an unknown commit
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/version.ts: read `commit`, cut it to 7 characters, map unknown, missing or malformed to null; return `{ version, commit }`
- [A] frontend/src/api/version.test.ts: update existing cases to the new return shape; add the commit cases
- [A] frontend/src/components/AppFooter.tsx: hold the version info object; render the `app-footer-commit` span after the version
- [A] frontend/src/components/AppFooter.test.tsx: move the mock to the new return shape; add success-with-commit and commit-absent cases; assert no commit element on pending and failure
- [A] frontend/src/components/LandingPage.test.tsx: move the `fetchBackendVersion` mock (line 32) from the bare string to `{ version: BACKEND_VERSION, commit: null }`; nothing else changes
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: replace the whole-footer `toHaveText` (line 36) with an exact `toHaveText` on `app-footer-version` (` v{version}`); keep the `toContainText` line and the unreachable-backend test unchanged
No dependency changes, so no lockfile changes.
No README.md or docs/DEVELOPMENT.md change: the feature changes no project structure, run configuration, dependency or test infrastructure (`BUILD_COMMIT` is already documented by TEST-09).
Not touched: frontend/src/components/LandingPage.tsx, frontend/src/App.tsx, and any backend file.

## Testing Strategy
- Unit tests: `fetchBackendVersion` commit parsing (cut to 7, unknown sentinel, missing or non-string commit, existing version cases on the new shape) and `AppFooter` render states (success with commit, version with null commit, pending, failure). Vitest with Testing Library, client mocked in the component test, `fetch` stubbed in the client test. `LandingPage.test.tsx` keeps its existing cases; only its version mock follows the new client shape.
  - Directory: co-located with the source under `frontend/src/` (`*.test.ts`, `*.test.tsx`), per project-standards Layout
  - Naming: `{Module}.test.ts(x)` beside the module
- Integration tests: not warranted: no endpoint, repository or model changes (backend untouched; `GET /api/version` integration coverage already exists from TEST-09).
  - Directory: backend/tests/integration/ (no file this feature)
- E2E tests: criterion 1 in the browser through the real client and real backend response, with `/api/version` intercepted by `route.fetch()` and its `commit` overridden to `0123456789ab` (deterministic whatever `BUILD_COMMIT` the run has); edge case: the same interception with `commit: "unknown"` shows the version alone. TEST-08's happy-path spec is narrowed to the version element so it passes whether or not `BUILD_COMMIT` is set.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts (new), e2e/tests/TEST-08_footer_app_version.spec.ts (modified)
- UAT scenarios: one per criterion plus the unknown-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | `shows the first 7 characters of the build commit next to the version`, `renders the version and the first 7 characters of the build commit`, `returns the version and the commit cut to its first 7 characters` | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | `renders only the app name while the version is loading`, `renders only the app name when the version request fails`, `renders the version alone when the backend reports no commit`, `returns a null commit when the backend reports the unknown commit sentinel`, `returns a null commit when the response has no string commit` | verifying it needs no navigation or interaction: the pending and failure states are component states driven by a mocked client, which a browser can only reach through timing or network faults |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the version and the first 7 characters of the build commit`, `renders only the app name while the version is loading`, `renders only the app name when the version request fails` | verifying it needs no navigation or interaction: the criterion is the component test itself |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Short commit next to the version | Intercept `/api/version` with `route.fetch()`, override `commit` to `0123456789ab`, open `/`, expect `app-footer` text `Task Notes v{version} (0123456)` and `app-footer-commit` visible | Given the backend reports commit `0123456789ab` When I open the landing page Then the footer reads `Task Notes v0.1.0 (0123456)` |
| 2 | Version alone while pending, on failure | covered at Unit, see Criterion coverage; edge spec: commit `unknown` gives `Task Notes v{version}` and no `app-footer-commit` | Given the backend reports commit `unknown` When I open the landing page Then the footer reads `Task Notes v0.1.0` with no commit and no `undefined` |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter tests Then the run passes |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker running; repository root `.env` copied from `.env.example`; ports 5183 (frontend) and 8010 (backend) free; read `[project].version` from `backend/pyproject.toml` (currently `0.1.0`, used below).
1. From the repository root run `BUILD_COMMIT=0123456789abcdef docker compose up --build` and wait for the frontend log to show the Vite server listening → backend, frontend and db are running.
2. Open `http://localhost:8010/api/version` → the body is `{"version":"0.1.0","commit":"0123456789ab"}`.
3. Open `http://localhost:5183/` and scroll to the footer → it reads `Task Notes v0.1.0 (0123456)`: exactly 7 commit characters, after the version.
4. In dev tools Elements, inspect `<footer data-testid="app-footer">` → it contains a `data-testid="app-footer-commit"` element whose text is ` (0123456)`.

### Criterion 2: While pending or on failure, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack from Criterion 1 is running.
1. On `http://localhost:5183/`, set dev tools Network throttling to "Slow 3G" and reload → while `/api/version` is pending the footer reads exactly `Task Notes` (no `undefined`, no `null`, no placeholder), then becomes `Task Notes v0.1.0 (0123456)`.
2. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, and no `app-footer-commit` element exists.
3. Run `docker compose down`, then `docker compose up --build` without `BUILD_COMMIT` set, and open `http://localhost:8010/api/version` → the body shows `"commit":"unknown"`.
4. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`: no `(unknown)`, no `()`, no `undefined`, and no `app-footer-commit` element.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: no failed or errored test on the summary line, exit code 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains `renders the version and the first 7 characters of the build commit`, `renders only the app name while the version is loading` and `renders only the app name when the version request fails`.
