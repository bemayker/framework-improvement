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
- Comment (tracker): 47 comments across 2 pages, every one a framework-authored "PR opened" note from an earlier run (recorded in `.claude/artifacts/TEST-10/decisions.md`) → Addressed by: not acted on, because none carries feedback on this item's scope or behaviour.
- Assumption (criterion 2, recorded instead of a question): the version and the commit arrive in the same `GET /api/version` response, so while that request is pending or after it fails there is no version to show either. The footer then renders exactly what TEST-08 renders in those states, `Task Notes` with no version and no commit, never `undefined`, `null`, `unknown` or an error message. "The version alone" is read literally for the one case where it is reachable: the request succeeds with a usable version but the commit is the backend's `unknown` default (no `BUILD_COMMIT` set), missing, empty or not a string. Then the footer shows `Task Notes v{version}` with no commit.
- Assumption (unknown version): when the backend reports the `unknown` version sentinel (TEST-08's unresolved case), the footer keeps showing `Task Notes` only and shows no commit, because criterion 1 places the commit next to the version and there is no version to sit next to.
- Assumption (display format): the commit renders as a sibling span after the version, reading ` (abc1234)`, so the whole footer reads `Task Notes v0.1.0 (abc1234)`. A sibling span, not text inside `app-version`, keeps TEST-08's E2E assertion `app-version` toHaveText(`v{version}`) and AppFooter's existing exact-text tests true without editing them.

## Plan Overview
Frontend only. The backend already returns `{"version", "commit"}` from `GET /api/version` (TEST-09; `commit` is `BUILD_COMMIT`'s first 12 characters, default `unknown`). This item:
1. Extends the existing client `frontend/src/api/version.ts` so `getBackendVersion()` resolves `{ version, commit }` (or `null` for the unknown version, as today), where `commit` is the first 7 characters of the backend's commit, or `null` when the backend sent `unknown`, an empty value, or no string. A bad commit never throws, so it can never hide a good version.
2. Renders the commit in `AppFooter.tsx` as a sibling `<span data-testid="app-commit">` after the version span, only when both are resolved.
3. Updates the three test files that mock or assert this client's return shape, and adds one E2E spec plus the UAT artifacts.

No backend change, no new dependency, no change to `LandingPage.tsx`, `notes.ts` or any existing E2E spec or helper.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: add the `commit` field to `VersionResponse`; add an exported `BackendVersion` type `{ version: string; commit: string | null }`; `getBackendVersion()` now returns `Promise<BackendVersion | null>`. Keep every existing rule unchanged (non-OK throws with status and reason, a missing, empty or non-string `version` throws "malformed", the `unknown` version resolves `null`). Add: `commit` is `body.commit.slice(0, 7)` when it is a non-empty string other than `unknown`, otherwise `null`. Constants: `UNKNOWN_COMMIT = "unknown"`, `COMMIT_DISPLAY_LENGTH = 7` (a short why-comment: the backend sends 12 characters, the footer shows 7 per TEST-10).
  - `frontend/src/components/AppFooter.tsx`: state becomes `BackendVersion | null`; render `{APP_NAME}`, then `<span data-testid="app-version"> v{version}</span>` when resolved (unchanged markup), then `<span data-testid="app-commit"> ({commit})</span>` only when the version is resolved and `commit` is non-null. Update the existing why-comment on the state to cover the commit. No style change: the span inherits `footerStyle`.
- Routes: none.
- State management: local `useState` in `AppFooter`, as TEST-08 already does; no new state library.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Existing internal endpoint (TEST-09), consumed unchanged:
- Method: GET
- URL: `/api/version` (through `API_BASE_URL` from `frontend/src/api/apiBaseUrl.ts`)
- Request: none
- Response: 200, `{"version": "0.1.0", "commit": "0123456789ab"}`. `commit` is at most 12 characters; `"unknown"` when no `BUILD_COMMIT` is set.

Client contract after this item (`frontend/src/api/version.ts`):
- `getBackendVersion(): Promise<BackendVersion | null>`
- `{"version": "0.1.0", "commit": "0123456789ab"}` resolves `{ version: "0.1.0", commit: "0123456" }`
- `{"version": "0.1.0", "commit": "unknown"}` (or commit missing, empty, non-string) resolves `{ version: "0.1.0", commit: null }`
- `{"version": "unknown", ...}` resolves `null`
- non-OK status or malformed `version` rejects, as today

## Technology Selection
- Commit shortening: chose the built-in `String.prototype.slice(0, 7)` over any helper or dependency, because the standard library covers it in one call.
- Commit display: chose a plain `<span>` inside the existing `<footer>` over a new component, because native markup covers a single text fragment and the footer already renders its version the same way.
- No net-new module or dependency otherwise: the fetch client (`frontend/src/api/version.ts`), React state, Vitest with Testing Library and Playwright are all already installed and in use.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright spec; stubs `**/api/version` with fixed bodies and asserts the commit next to the version (success) and the version alone (unknown commit edge case)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-10/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/version.ts: add `commit` to the response type, export `BackendVersion`, resolve `{ version, commit }` with the commit cut to 7 characters or `null`
- [A] frontend/src/api/version.test.ts: update the existing assertions to the new resolved shape; add unit tests for the 7-character commit, the unknown commit and a missing or non-string commit
- [A] frontend/src/components/AppFooter.tsx: hold `BackendVersion | null`; render the `app-commit` span after the version when both resolved
- [A] frontend/src/components/AppFooter.test.tsx: switch the mock to the new shape; add the success-with-commit, version-alone and no-commit assertions on the pending and failure paths
- [A] frontend/src/components/LandingPage.test.tsx: one change only, in `beforeEach`: the `getBackendVersion` mock resolves `{ version: BACKEND_VERSION, commit: null }` instead of the bare string, because the module mock's return type changes; no other line and no note-form test is touched

Not touched (stated for the concurrent BUG-04 and CHORE-02 plans): `frontend/src/components/LandingPage.tsx`, `frontend/src/api/notes.ts`, `frontend/src/api/notes.test.ts`, `frontend/src/components/NoteForm.tsx`, `frontend/src/components/NoteForm.test.tsx`, every existing spec under `e2e/tests/` (TEST-01, TEST-03, TEST-04, TEST-08) and `e2e/helpers/`. TEST-04's and TEST-08's footer specs stay green unchanged: TEST-04 uses toContainText on the footer, TEST-08 asserts exact text only on `app-version` (unchanged) and on the aborted-request footer (`Task Notes`, unchanged).
No lockfile changes: this feature adds and changes no dependency.
No README.md or docs/DEVELOPMENT.md change: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: the client's response mapping (`frontend/src/api/version.test.ts`) and the footer component's success, pending, failure, unknown-version and unknown-commit rendering (`frontend/src/components/AppFooter.test.tsx`), with `fetch` and `getBackendVersion` mocked respectively.
  - Directory: beside the module under `frontend/src/` (project standards: `NoteForm.tsx` with `NoteForm.test.tsx` beside it); `backend/tests/unit/` is unaffected
  - Naming: `{Module}.test.tsx` / `{module}.test.ts` beside the module
- Integration tests: not warranted. No repository, model, migration or endpoint changes; TEST-09's `backend/tests/integration/` tests already cover the `commit` field.
  - Directory: backend/tests/integration/
- E2E tests: one spec for criterion 1 in the real page, with `page.route("**/api/version")` fulfilling fixed JSON so the result does not depend on whether the run's backend has `BUILD_COMMIT` set; plus the edge case where the backend reports `"commit": "unknown"`.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the unknown-commit edge case.
  - Directory: e2e/uat/scenarios/ (scripts in e2e/uat/scripts/)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added. | E2E | `shows the short build commit next to the version in the landing page footer`, `renders the short commit next to the version once the fetch resolves`, `returns the version and the 7-character commit the backend sent` | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. | Unit | `renders the app name without a version or commit while the fetch is pending`, `renders the app name without a version or commit when the backend is unreachable`, `renders the version alone when the backend reports no commit`, `resolves a null commit when the backend reports the unknown commit`, `resolves a null commit when the body has no string commit` | verifying it needs no navigation or interaction: pending and failed fetch states are deterministic only with a mocked client in a component test |
| 3 | A component test covers the success, pending and failure paths. | Unit | `renders the short commit next to the version once the fetch resolves`, `renders the app name without a version or commit while the fetch is pending`, `renders the app name without a version or commit when the backend is unreachable` | the criterion itself names the component-test tier |

The E2E edge-case spec `shows the version alone when the backend reports an unknown commit` adds browser coverage of criterion 2's reachable "version alone" case.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 commit characters next to the version | Route `**/api/version` to fulfill `{"version":"0.1.0","commit":"0123456789ab"}`, go to `/`, expect `app-version` to have text `v0.1.0` and `app-commit` to have text `(0123456)`, footer text `Task Notes v0.1.0 (0123456)` | Given the backend reports commit `0123456789ab` When I open the landing page Then the footer reads `Task Notes v0.1.0 (0123456)` |
| 2 | Pending or failure shows no commit, never `undefined` or an error | covered at Unit, see Criterion coverage; edge spec: fulfill `{"version":"0.1.0","commit":"unknown"}`, expect footer text `Task Notes v0.1.0` and `app-commit` count 0 | Given the version request fails When I open the landing page Then the footer reads `Task Notes` with no `undefined` or error |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite When I run `AppFooter.test.tsx` Then the run passes |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
Prerequisites: from the repository root, the stack started with a known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up --build -d`.
1. Open `http://localhost:8010/api/version` in a browser → the body is `{"version":"0.1.0","commit":"0123456789ab"}`.
2. Open `http://localhost:5183/` → the landing page shows the `Task Notes` heading, the note form and, at the bottom, the footer.
3. Read the footer → it reads exactly `Task Notes v0.1.0 (0123456)`: seven commit characters, in brackets, directly after the version.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
Prerequisites: the stack from criterion 1 running.
1. Open `http://localhost:5183/` with DevTools open, Network tab, throttling set to `Slow 3G`, and reload → while `/api/version` is still pending, the footer reads `Task Notes` with no version, no brackets and no `undefined`.
2. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`; nothing reads `undefined`, `null`, `unknown` or an error message.
3. Run `docker compose up --build -d backend` with no `BUILD_COMMIT` in the shell (open a fresh terminal), wait until `http://localhost:8010/api/version` returns `{"version":"0.1.0","commit":"unknown"}`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`, the version alone, with no brackets.

### Criterion 3: A component test covers the success, pending and failure paths.
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run lists `renders the short commit next to the version once the fetch resolves`, `renders the app name without a version or commit while the fetch is pending` and `renders the app name without a version or commit when the backend is unreachable`; its summary line reports no failed or errored test and the command exits 0.
