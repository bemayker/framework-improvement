# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, wave 2). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
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
- Comment (tracker): none from a human. All 18 comments on the oldest page (ids 1200230000070858 to 1200230000122219) and the 25 on the newest page are framework bot "mayker-dev: PR opened for TEST-10" notes from earlier sandbox runs → Addressed by: not acted on as feedback, because none is a stakeholder correction. Their recurring "interpretation recorded for criterion 2" matches the assumption below and is kept for consistency with the earlier runs.
- Feedback (orchestrator, /deliver 6.2 step 3 re-plan, run deliver-20261117T010850Z), item 1: add `e2e/tests/TEST-08_footer_app_version.spec.ts` to the File Manifest under Modified files, tagged `[D]` → Addressed by: added as a `[D]` entry under `### Modified files`.
- Feedback (orchestrator), item 2: change only the line 8 assertion so it holds with or without a commit, asserting the version span `getByTestId("app-footer-version")` has text ` v${readBackendVersion()}` instead of the whole `app-footer` text; the second test (503 gives `Task Notes`) stays as is → Addressed by: the manifest entry scopes the edit to line 8 only, and `## Frontend Plan` records the same; the 503 test is untouched.
- Feedback (orchestrator), item 3: in `shared_risks.md`, move that spec from "Not modified" to "Existing files this feature will modify" and drop the recorded-risk sentence → Addressed by: done in `shared_risks.md`.
- Feedback (orchestrator), item 4: widen nothing else, no new test id, Criterion coverage table unchanged → Addressed by: no other section changed; the `### Criterion coverage` table is byte-identical to the previous plan.
- Assumption (criterion 2, ambiguous): version and commit arrive in the same single `GET /api/version` response, so while that request is pending or after it fails there is no version to show. The footer then keeps TEST-08's existing states and reads exactly `Task Notes` (no version, no commit, never `undefined`, never an error text). "The version alone" (`Task Notes v{version}`) is what shows when the request succeeds but the commit is missing, not a string, blank, or the backend's `unknown` sentinel (TEST-09's default when `BUILD_COMMIT` is unset, `backend/app/core/config.py`). No second request and no frontend copy of the version is added to produce a version while pending: that would be scope beyond the criteria.
- Assumption (display format): the commit renders as ` (abc1234)` directly after ` v{version}`, in its own span `data-testid="app-footer-commit"`, inheriting the footer's existing style. Full footer text on success: `Task Notes v1.2.3 (abc1234)`.
- Merged since the last plan: n/a (no `[merged-since]` lines in this dispatch; plan based on main 126d2c21, which already holds TEST-08 #820 and TEST-09 #819).

## Plan Overview
Frontend only. The version API client (`frontend/src/api/version.ts`) is extended to read the `commit` field TEST-09 added to `GET /api/version` and to return both values from one request; `AppFooter` renders the 7-character commit next to the version. No backend, no new dependency, no new component. The client's exported function is renamed from `getBackendVersion` to `getBackendBuildInfo` because its return type changes; the two test files that mock it (`AppFooter.test.tsx`, `LandingPage.test.tsx`) update their mock accordingly. `LandingPage.tsx` itself is not touched. TEST-08's footer spec gets a one-line assertion change so it holds whether or not a commit renders.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: replace `getBackendVersion(): Promise<string | null>` with `getBackendBuildInfo(): Promise<BuildInfo | null>`, where `type BuildInfo = { version: string; commit: string | null }`. Same single `fetch` of `${API_BASE_URL}/api/version`, still never throws. Returns `null` exactly where `getBackendVersion` returned `null` today (non-OK response, rejected fetch, missing/non-string/blank/`unknown` version). `commit` is `body.commit.slice(0, 7)` when `body.commit` is a non-blank string other than `unknown`, otherwise `null`. `VersionResponse` type gains `commit: string`. Constant `SHORT_COMMIT_LENGTH = 7`, with a "why" comment (the backend reports 12 characters; the footer shows 7).
  - `frontend/src/components/AppFooter.tsx`: state becomes `BuildInfo | null`; renders `Task Notes`, then ` v{version}` in `app-footer-version` when build info resolved, then ` ({commit})` in a new `app-footer-commit` span only when `commit !== null`. Pending and failed requests render `Task Notes` only (unchanged from TEST-08). Keeps the `isMounted` guard.
  - `e2e/tests/TEST-08_footer_app_version.spec.ts`: line 8 only. Replace the `getByTestId("app-footer")` whole-text assertion with `getByTestId("app-footer-version")` having text ` v${readBackendVersion()}`, so the spec holds with or without a commit span. The second test (503 gives `Task Notes`) is unchanged.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span adds no style of its own and inherits `footerStyle` (`0.875rem`, `#5f5f5f`, `marginTop 1.5rem`) unchanged.

## Backend Plan
No backend changes required. `GET /api/version` already returns `{ "version": str, "commit": str }` with a 12-character commit or `unknown` (TEST-09, `backend/app/schemas/version.py`, `backend/app/services/version_service.py`).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-09; consumed, not changed)
- Request: none
- Response: `{"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is `"unknown"` when the backend has no `BUILD_COMMIT`.
- Frontend client contract: `getBackendBuildInfo()` resolves to `{"version": "0.1.0", "commit": "0123456"}`, or `{"version": "0.1.0", "commit": null}` when the commit is unavailable, or `null` when the version cannot be resolved. It never rejects.

## Technology Selection
- Commit shortening: chose `String.prototype.slice(0, 7)` (language standard library) over any helper or dependency; nothing else is needed.
- Fetching and component testing: the installed `fetch`, React `useState`/`useEffect`, Vitest and Testing Library already cover the need; no new dependency.
- No net-new component or module is introduced: both source changes extend existing files.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec, footer shows the 7-character commit next to the version (route-fulfilled `/api/version` with a known commit)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (commit `unknown`)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: `getBackendVersion` becomes `getBackendBuildInfo`, reads and shortens `commit`
- [A] frontend/src/api/version.test.ts: tests for the new return shape, commit shortening and the commit-unavailable cases; existing null-version tests kept against the renamed function
- [A] frontend/src/components/AppFooter.tsx: render the `app-footer-commit` span next to the version
- [A] frontend/src/components/AppFooter.test.tsx: mock `getBackendBuildInfo`; success, pending, failure and commit-unavailable component tests
- [A] frontend/src/components/LandingPage.test.tsx: mock `getBackendBuildInfo` instead of `getBackendVersion` (lines 5, 12 to 17, 33 to 34 only); its footer assertion stays as is
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: line 8 only, assert the `app-footer-version` span has text ` v${readBackendVersion()}` instead of the whole `app-footer` text, so it holds with or without a commit; the 503 test is unchanged
No dependency manifest changes, so no lockfile entry. No `README.md` or `docs/DEVELOPMENT.md` change: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: the version client (`frontend/src/api/version.test.ts`) and the footer component (`frontend/src/components/AppFooter.test.tsx`), Vitest with the client mocked in the component test and `fetch` stubbed in the client test.
  - Directory: co-located with the source under `frontend/src/` (project-standards Naming)
  - Naming: `{Name}.test.tsx` / `{module}.test.ts`
- Integration tests: not warranted, no backend code changes (the endpoint's integration tests are TEST-09's).
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 only, the visible footer text on the landing page with `/api/version` route-fulfilled to a known commit (the real backend reports `unknown` locally and in CI, where `BUILD_COMMIT` is unset). TEST-08's existing spec is adjusted on one line so it stays green whether or not a commit renders.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the commit-`unknown` edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | Footer shows the first 7 characters of the commit next to the version | E2E | `footer shows the short build commit next to the version`, `renders the short commit next to the version`, `returns the version and the first 7 characters of the commit` | — |
| 2 | Pending or failed request shows no commit, never `undefined` or an error | Unit | `renders only the app name while the build info is pending`, `renders only the app name when the build info request fails`, `renders the version alone when the commit is unavailable`, `returns a null commit when the backend reports the unknown sentinel` | verifying it needs no navigation or interaction: pending and failure are rendering branches of one component, driven deterministically by a mocked client (TEST-08's E2E failure spec already covers the failed-request footer in the browser) |
| 3 | A component test covers success, pending and failure | Unit | `renders the short commit next to the version`, `renders only the app name while the build info is pending`, `renders only the app name when the build info request fails` | the criterion is the component test itself |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | Route-fulfill `**/api/version` with `{"version": "<pyproject version>", "commit": "0123456789ab"}`, open `/`, expect `app-footer` text `Task Notes v<version> (0123456)` and `app-footer-commit` text ` (0123456)` | Given the backend reports commit `0123456789ab`, When I open the landing page, Then the footer reads `Task Notes v<version> (0123456)` |
| 2 | Pending or failed shows no commit and no error | covered at Unit, see Criterion coverage | Given `/api/version` fails, When I open the landing page, Then the footer reads `Task Notes` with no `undefined` |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then the run passes |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: stack started with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` from the repo root; frontend at http://localhost:5183.
1. Open http://localhost:5183/ in a browser → the landing page with the `Task Notes` heading loads.
2. Scroll to the footer at the bottom of the page → it reads `Task Notes v{version} (0123456)`, where `{version}` is `[project].version` in `backend/pyproject.toml`.
3. Open http://localhost:8010/api/version in a second tab → the JSON shows `"commit": "0123456789ab"`; the footer shows its first 7 characters only.

### Criterion 2: Pending or failed request shows the version alone, never `undefined` or an error
Prerequisites: stack started as for Criterion 1.
1. On http://localhost:5183/, open the browser devtools Network tab, right-click the `version` request and choose Block request URL, then reload → the footer reads exactly `Task Notes`; no `undefined`, no `v`, no error text.
2. Unblock the URL and stop the backend container only (`docker compose stop backend`), reload → the footer reads exactly `Task Notes`.
3. Restart the stack without a commit (`docker compose up -d --build` with `BUILD_COMMIT` unset), reload → the footer reads `Task Notes v{version}` with no parentheses and no `unknown`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repo root → the run passes: no failed or errored test on the summary line, exit code 0.
2. Read the test titles in the output → `renders the short commit next to the version`, `renders only the app name while the build info is pending` and `renders only the app name when the build info request fails` are listed as passed.
