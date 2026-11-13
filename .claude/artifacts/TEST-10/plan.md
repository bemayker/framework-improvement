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
- Comment (tracker): 42 comments on the ClickUp task, all mayker-dev bot notices from earlier runs → not acted on because none carries a stakeholder correction or amendment to the criteria.
- Merged since the last plan: n/a (fresh plan, branched from current main e2379a70a42aba833b1a39ff4022e0c39c7ad5e6, which already holds TEST-08 and TEST-09).
- Assumption (criterion 2, no comment resolves it): the version and the commit arrive in ONE response (`GET /api/version` returns both), so while that request is pending or after it fails there is no version to show either. The footer then keeps TEST-08's established behaviour, the app name alone (`Task Notes`), with no commit text and never `undefined` or an error. The case where the footer genuinely shows "the version alone" is a successful response whose commit is unusable: the backend's `"unknown"` sentinel (BUILD_COMMIT unset, which is the default in docker-compose.yml and in CI), an empty string, or a missing or non-string `commit` field. Those render `Task Notes v{version}` with no commit, and do not fail the request.
- Assumption (criterion 1, display shape): the API already truncates the commit to 12 characters (TEST-09); the frontend cuts it to the first 7 and renders it after the version as ` ({commit7})`, e.g. `Task Notes v0.1.0 (4f2a9c1)`, in its own `<span data-testid="app-footer-commit">`. When the backend version is its `"unknown"` sentinel (TEST-08 then shows the app name alone) no commit is shown either, since there is no version to sit next to.

## Plan Overview
Frontend only. Extend the existing version API client (`frontend/src/api/version.ts`) so it returns both the version and a normalized commit (or null), and extend `AppFooter` to render the first 7 characters of that commit next to the version. Update the component and client unit tests (Vitest) for the success, pending and failure paths, and the one existing test that mocks the client's old return shape (`LandingPage.test.tsx`). No backend, no new dependency, no new route.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `fetchBackendVersion()` keeps its name and its failure contract (rejects on network error, non-OK answer, or a body without a non-empty `version` string) but now resolves to `BackendVersion | null`, where `type BackendVersion = { version: string; commit: string | null }`. It still resolves `null` when `version` is the `"unknown"` sentinel. `commit` is the body's `commit` when it is a non-empty string other than `"unknown"` (new exported constant `UNRESOLVED_BUILD_COMMIT = "unknown"`, mirroring `UNKNOWN_BUILD_COMMIT` in backend/app/core/config.py), otherwise `null`; a bad `commit` never rejects. `VersionResponse` gains `commit: string`.
  - `frontend/src/components/AppFooter.tsx`: state becomes `BackendVersion | null`. New module constant `COMMIT_DISPLAY_LENGTH = 7`. Render: `Task Notes`, then when state is non-null `<span data-testid="app-footer-version"> v{version}</span>`, then when state is non-null and `commit` is non-null `<span data-testid="app-footer-commit"> ({commit.slice(0, COMMIT_DISPLAY_LENGTH)})</span>`. Pending and failure keep state `null`, so the footer reads exactly `Task Notes`.
- Routes: none.
- State management: local `useState` inside `AppFooter`, as today; no new store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span adds no style of its own and inherits the footer's existing `fontSize 0.875rem, color #5f5f5f`.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version (existing, TEST-05 and TEST-09; unchanged by this item)
- Request: no body, no parameters
- Response: 200 `{"version": "0.1.0", "commit": "4f2a9c1d8e7b"}`; `commit` is BUILD_COMMIT cut to 12 characters, or `"unknown"` when unset. The frontend displays `commit[0:7]`, i.e. `4f2a9c1`.

## Technology Selection
- Commit truncation: chose the standard `String.prototype.slice(0, 7)` over any formatting helper or dependency, because the standard library covers it fully.
- No net-new component, module or dependency: the commit is a `<span>` inside the existing `AppFooter`, fetched by the existing `fetchBackendVersion` client and the platform `fetch`.

## File Manifest
### New files
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }` or null; normalize the commit sentinel, empty or missing commit to null; add `UNRESOLVED_BUILD_COMMIT`
- [A] frontend/src/api/version.test.ts: assert the commit is returned, normalized to null for `"unknown"`, empty and missing, and that a bad commit does not reject
- [A] frontend/src/components/AppFooter.tsx: render the first 7 characters of the commit in `app-footer-commit` next to the version
- [A] frontend/src/components/AppFooter.test.tsx: update mocks to the new return shape; add success, pending, failure and commit-unknown cases for the commit
- [A] frontend/src/components/LandingPage.test.tsx: update its `fetchBackendVersion` mock to resolve the new `{ version, commit }` shape (the old string shape would break its footer assertion)

No lockfile changes: no dependency is added or changed. No `README.md` or `docs/DEVELOPMENT.md` change: the feature changes no project structure, run configuration, dependency or test infrastructure. No E2E spec: every criterion is covered at the unit tier (Criterion coverage below), so Phase D has no file to produce.

## Testing Strategy
- Unit tests: Vitest component tests for `AppFooter` (success with commit, pending, failure, commit unknown) and client tests for `fetchBackendVersion` (commit returned, normalized, never rejecting on a bad commit).
  - Directory: co-located beside the source under frontend/src/ (the project's existing Vitest convention: `AppFooter.test.tsx`, `version.test.ts`)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: not warranted. The endpoint is unchanged and already covered by TEST-09's router integration tests; this item adds no router, repository or migration.
  - Directory: backend/tests/integration/
- E2E tests: not warranted per criterion (see Criterion coverage). No criterion needs navigation or interaction to verify: each is a render outcome of one component given one API answer, and the E2E stack runs with BUILD_COMMIT unset (`"unknown"`), so a browser could show a commit only through a stubbed route, which the component test already does more cheaply. The existing TEST-08 spec keeps passing unchanged because with the commit unknown the footer still reads exactly `Task Notes v{version}`.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: the three criteria plus the commit-unknown edge case
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | Unit | `renders the first 7 characters of the commit next to the version`, `returns the version and the commit from the backend` | verifying it needs no navigation or interaction: it is the footer's render of one API answer plus the client's parsing, both checked against stubbed responses |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | `renders no commit while the version request is pending`, `renders no commit when the version request fails`, `renders the version alone when the backend reports an unknown commit`, `returns a null commit when the backend reports the unknown commit` | verifying it needs no navigation or interaction: pending and failure are promise states the component test controls directly |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the first 7 characters of the commit next to the version`, `renders no commit while the version request is pending`, `renders no commit when the version request fails` | the criterion asks for a component test itself, which is the unit tier |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 characters of the commit next to the version | covered at Unit, see Criterion coverage | Given the backend reports version 0.1.0 and commit 4f2a9c1d8e7b, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (4f2a9c1)" |
| 2 | Pending or failing request shows no commit, never undefined or an error | covered at Unit, see Criterion coverage | Given /api/version is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no commit and no "undefined"; Given the commit is unknown, Then the footer reads "Task Notes v0.1.0" |
| 3 | A component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: the stack is started from the repository root with a known commit, `BUILD_COMMIT=4f2a9c1d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f docker compose up -d --build`, and all three containers are running.
1. Open `http://localhost:8010/api/version` in the browser → the JSON shows `"commit": "4f2a9c1d8e7b"` and a `"version"` value (note it, e.g. `0.1.0`).
2. Open `http://localhost:5183/` → the landing page loads with the footer at the bottom.
3. Read the footer → it reads exactly `Task Notes v0.1.0 (4f2a9c1)`: the version from step 1, then the first 7 characters of the commit in parentheses.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack from Criterion 1 is running.
1. Run `docker compose stop backend` from the repository root, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no version, no commit, no `undefined` and no error text (one response carries both values, so a failed request has no version to show; see Re-Plan Feedback).
2. Restart without a commit: `docker compose up -d --build backend` with BUILD_COMMIT unset in the shell, then open `http://localhost:8010/api/version` → `"commit": "unknown"`.
3. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0` (the version alone), with no parentheses and no `unknown`.
4. Pending state: in the browser dev tools Network panel set throttling to "Slow 3G" and reload → while `/api/version` is still loading the footer reads `Task Notes` with no commit and no `undefined`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repository root → the run lists `renders the first 7 characters of the commit next to the version`, `renders no commit while the version request is pending` and `renders no commit when the version request fails`, and reports 0 failed.
