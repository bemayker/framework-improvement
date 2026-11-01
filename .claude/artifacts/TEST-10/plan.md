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
>
> (ClickUp task 123k99cwybm.)

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 19 comments on the item, all the framework's own "PR opened" notices from earlier runs whose product a reset removed from main (summarised in the dispatch, not quoted) → not acted on, because none carries a requirement or a correction to the description.
- Merged since the last plan: n/a (fresh plan, plan base 93b28d7 is current main, with TEST-08 (#457) and TEST-09 (#456) merged; no `[merged-since]` lines in the dispatch).
- Assumption (criterion 2, no comment): the version and the commit arrive in **one** response from `GET /api/version`, so while that request is pending or after it fails there is no version to show either. In those two states the footer keeps TEST-08's recorded behaviour and reads exactly `Task Notes`: no commit, no `undefined`, no `null`, no `unknown`, no error text. "The version alone" is then literally the state where the version resolved and the commit did not (missing field, non-string, blank, or the backend's `unknown` default from TEST-09): the footer reads `Task Notes v{version}`. A second request just for the commit was rejected: it would add a request the criteria do not ask for.
- Assumption (criterion 1, no comment): the backend's `unknown` default (BUILD_COMMIT unset, which is the case in local `docker compose` and in CI's E2E job) is treated as "no commit", never shown, consistent with TEST-08 treating the backend's `unknown` version as unresolved. The commit is shown only next to a resolved version, never on its own.
- Assumption (criterion 1, display format): the footer reads `Task Notes v0.1.0 (0123456)`: the short commit in parentheses after the version, in its own `<span data-testid="app-commit">`. The description says "next to the version" and fixes no separator; parentheses keep the version string itself unchanged for the existing `toContainText(version)` specs.
- Note: the description says "Frontend only", and it is: TEST-09 already serves `commit` (first 12 characters of `BUILD_COMMIT`, default `unknown`), so no backend file changes. The 7-character cut happens in the frontend client.

## Plan Overview
The footer gains the short build commit. One frontend client function changes shape, the footer renders one more span, and their tests are extended:

- `frontend/src/api/version.ts`: `getBackendVersion(): Promise<string | null>` is replaced by `getBackendBuild(): Promise<BackendBuild | null>`, which reads both `version` and `commit` from the same single `GET /api/version` call and returns the commit already cut to its first 7 characters (or `null` when unresolved).
- `frontend/src/components/AppFooter.tsx`: holds `BackendBuild | null` in state and renders `Task Notes`, `Task Notes v{version}` or `Task Notes v{version} ({shortCommit})`.
- Tests: the client test, the footer component test and `LandingPage.test.tsx` (which mocks the client by name) are updated; one new E2E spec, plus the UAT artifacts.

Backend: none. TEST-09's `GET /api/version` already returns `{"version": "...", "commit": "..."}`. `LandingPage.tsx` is **not** modified (it only renders `<AppFooter />`), which keeps this item off the `LandingPage.tsx` overlap flagged against BUG-04.

Existing specs and UAT artifacts stay valid without edits: CI's E2E job and local compose leave `BUILD_COMMIT` unset, the backend reports `commit: "unknown"`, and the footer then reads exactly what TEST-08's specs assert (`Task Notes v{version}`); TEST-08's route-fulfilled spec sends no `commit` field, which this client treats as "no commit" rather than an error. TEST-04's specs use `toContainText(version)`, which also still holds with a commit present.

## Frontend Plan
- Components to create or modify:
  - `frontend/src/api/version.ts` (modified):
    - export `interface BackendBuild { version: string; commit: string | null }` and `const SHORT_COMMIT_LENGTH = 7` (module constant, not exported unless the tests need it);
    - replace `getBackendVersion` with `getBackendBuild(): Promise<BackendBuild | null>`. The fetch, the non-OK error (`Loading the version failed: {status} {statusText}`) and the unexpected-shape error (body not an object, or `version` not a string) are unchanged;
    - version rule unchanged: trimmed, and blank or `unknown` resolves the whole call to `null` (the footer then shows no version and no commit);
    - commit rule (new): when `body.commit` is a string, trim it; blank or `unknown` gives `commit: null`; otherwise `commit` is its first 7 characters (`slice(0, SHORT_COMMIT_LENGTH)`). When `commit` is absent or not a string, `commit: null`, never a thrown error, so a backend without the field still shows its version.
  - `frontend/src/components/AppFooter.tsx` (modified):
    - state becomes `useState<BackendBuild | null>(null)`, filled by `getBackendBuild()` in the existing mount effect with the existing `isMounted` guard and silent `catch`;
    - render: `{APP_NAME}`, then when `build !== null` `<span data-testid="app-version"> v{build.version}</span>`, then when `build?.commit` is non-null `<span data-testid="app-commit"> ({build.commit})</span>`;
    - keep `<footer data-testid="app-footer">`, the contentinfo landmark and `footerStyle` unchanged; update the state comment so it names the commit rule.
- Routes: none (the footer is on `/`).
- State management: local component state in `AppFooter`, as today.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer values are kept unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the commit span inherits them and adds no style.

## Backend Plan
No backend changes required.

`GET /api/version` already returns `commit` (TEST-09, `backend/app/routers/version.py`, `backend/app/schemas/version.py`, `version_service.get_build_commit()` with `COMMIT_LENGTH = 12`, default `unknown` from `backend/app/core/config.py`). It is covered by `backend/tests/integration/test_version_integration.py`.

## API Integration Plan
No external API integration. The only API consumed is this project's own backend, through `frontend/src/api/version.ts`.

## API Contract
- Method: GET
- URL: `/api/version` (backend, base URL from `frontend/src/api/baseUrl.ts`, `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response (existing, TEST-09): 200, `{"version": "0.1.0", "commit": "0123456789ab"}`, or `{"version": "0.1.0", "commit": "unknown"}` with `BUILD_COMMIT` unset.
- Client result: `{ version: "0.1.0", commit: "0123456" }`; `{ version: "0.1.0", commit: null }` for `unknown`, blank, missing or non-string commit; `null` for an unresolved version; a thrown error for non-2xx, network failure, or a body that is not an object with a string `version`.

## Technology Selection
- Commit field in `frontend/src/api/version.ts`: chose a plain `String.prototype.trim` and `slice(0, 7)` inside the existing client over any helper module or dependency; no net-new module.
- Footer state: chose React's installed `useState`/`useEffect`, already used by `AppFooter`, over a data-fetching library.
- E2E route stubbing in the new spec: chose Playwright's installed `page.route` with an exact-pathname matcher (as TEST-08's spec does) over a mock server dependency.
- No net-new dependency, component or module is introduced beyond the test and UAT files listed.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser specs with `/api/version` route-fulfilled: commit shown as its first 7 characters next to the version; `unknown` commit shows the version alone (edge case); aborted request shows exactly `Task Notes`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the `unknown` commit edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: replace `getBackendVersion` with `getBackendBuild` returning `{ version, commit }`, commit cut to 7 characters and `null` when missing, non-string, blank or `unknown`
- [A] frontend/src/api/version.test.ts: retarget to `getBackendBuild`; add cases for a 12-character commit cut to 7, a commit of 7 or fewer kept, `unknown`, blank, missing and non-string commit giving `commit: null`
- [A] frontend/src/components/AppFooter.tsx: hold `BackendBuild | null`; render the `app-commit` span `({commit})` after the version when present
- [A] frontend/src/components/AppFooter.test.tsx: mock `getBackendBuild`; success with commit, version-only (commit null), pending, failure (rejected) and null-build cases, plus the landmark case
- [A] frontend/src/components/LandingPage.test.tsx: mock `getBackendBuild` instead of `getBackendVersion`; the footer assertion uses the mocked version and commit

No dependency manifest changes, so no lockfile is regenerated. README.md and docs/DEVELOPMENT.md need no edit: no project structure, run configuration, dependency or test infrastructure changes (`BUILD_COMMIT` is already documented by TEST-09).

## Testing Strategy
- Unit tests (Vitest, beside their modules under `frontend/src/`, the project's existing convention):
  - `frontend/src/api/version.test.ts`: the existing cases retargeted to `getBackendBuild` (trimmed version, `unknown` and blank version give `null`, non-OK throws, unexpected shape throws, rejected fetch propagates), plus: `commit: "0123456789ab"` gives `"0123456"`; `commit: "abc12"` gives `"abc12"`; `commit: "unknown"`, `"  "`, a missing field and `commit: 3` each give `commit: null` with the version kept.
  - `frontend/src/components/AppFooter.test.tsx`: success (`Task Notes v0.1.0 (0123456)`, `app-commit` present); commit null (`Task Notes v0.1.0`, `app-commit` absent); pending (exactly `Task Notes`, no `app-version`, no `app-commit`); failure (rejected: exactly `Task Notes`, no `undefined`, `null`, `unknown` or `Error` text); null build (exactly `Task Notes`); landmark and test id kept.
  - `frontend/src/components/LandingPage.test.tsx`: the footer shows the mocked version and commit.
  - Naming: `{module}.test.ts(x)`. `backend/tests/unit/` needs no change.
- Integration tests: no new test. The endpoint's `commit` is already covered by `backend/tests/integration/test_version_integration.py` (TEST-09); this item changes no backend code.
  - Directory: backend/tests/integration/
- E2E tests: `e2e/tests/TEST-10_footer_build_commit.spec.ts`, every case with `/api/version` fulfilled or aborted through `page.route` matched on the exact pathname `/api/version` (a glob also matches Vite's module URL for `src/api/version.ts`, as TEST-08's spec documents), and the fulfilled response carrying `access-control-allow-origin: *`:
  - fulfil `{"version": "9.9.9-e2e", "commit": "0123456789ab"}` → footer `toHaveText("Task Notes v9.9.9-e2e (0123456)")`, `app-commit` visible;
  - edge case: fulfil `{"version": "9.9.9-e2e", "commit": "unknown"}` → footer `toHaveText("Task Notes v9.9.9-e2e")`, `app-commit` count 0;
  - abort → footer `toHaveText("Task Notes")`.
  No spec depends on the real backend's `BUILD_COMMIT`, which CI leaves unset.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the `unknown` commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: pending, rejected and commit-null results are rendering branches of one component, asserted in AppFooter.test.tsx; the E2E abort and `unknown` cases are the feature's edge-case specs |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test (AppFooter.test.tsx) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | Fulfil /api/version with commit `0123456789ab`, open `/`, footer reads `Task Notes v9.9.9-e2e (0123456)` | Given the backend runs with BUILD_COMMIT 0123456789abcdef0123456789abcdef01234567, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (0123456)" |
| 2 | Pending or failed request: version alone, never undefined or an error | covered at Unit, see Criterion coverage (plus the E2E abort and `unknown` edge cases) | Given /api/version is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes"; Given BUILD_COMMIT is unset, Then the footer reads "Task Notes v0.1.0" |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When AppFooter.test.tsx runs, Then 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker running, repository root as the working directory, `backend/pyproject.toml` has `version = "0.1.0"`.
1. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` → the backend, frontend and database containers are running.
2. Run `curl -s http://localhost:8010/api/version` → `{"version":"0.1.0","commit":"0123456789ab"}`.
3. Open http://localhost:5183/ in Chrome and scroll to the bottom → the footer reads `Task Notes v0.1.0 (0123456)`: seven characters of the commit, in parentheses, after the version.
4. Restore the default afterwards: `docker compose up -d --force-recreate backend` → the backend restarts with `BUILD_COMMIT` unset.

### Criterion 2: Pending or failed request shows the version alone, never `undefined` or an error
Prerequisites: the stack running as in Criterion 1 step 1.
1. In Chrome DevTools, set Network throttling to "Slow 3G" and reload http://localhost:5183/ → while the `/api/version` request is pending, the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text; once it resolves it reads `Task Notes v0.1.0 (0123456)`. Set throttling back to "No throttling".
2. Run `docker compose stop backend`, then reload http://localhost:5183/ → the footer is visible and reads exactly `Task Notes`, with no error text.
3. Run `docker compose up -d --force-recreate backend` (no `BUILD_COMMIT`), wait until `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0","commit":"unknown"}`, then reload the page → the footer reads `Task Notes v0.1.0`: the version alone, no parentheses and no `unknown`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → 0 failed, and the AppFooter test names include a success case with the commit, a pending case and a failure case.
