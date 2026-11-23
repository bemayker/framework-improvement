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
- Comment (tracker): 52 comments read, all framework PR-opened notices from earlier runs → not acted on because none carries feedback on the feature itself.
- Plan verdict (orchestrator, /deliver Section 6.2, re-plan 1): `frontend/src/components/LandingPage.test.tsx` mocks `fetchBackendVersion` (lines 13 to 19), resolves it with the bare string `"9.8.7"` (line 36) and asserts the footer reads `Task Notes v9.8.7` (lines 61 to 62). Once the client returns `{ version, commit }` that mock no longer type-checks, and the footer would read `.version` off a string and render `Task Notes`, failing the test gate. → acted on: added `[A] frontend/src/components/LandingPage.test.tsx` under Modified files (mock resolves `{ version: BACKEND_VERSION, commit: null }`, existing assertions kept unchanged) and mirrored it in `shared_risks.md`. A repository-wide search for `fetchBackendVersion` and `api/version` under `frontend/src` and `e2e` finds no other code importer; the remaining hits are earlier items' specs, scenarios and UAT scripts, which exercise the rendered text and not the client's return type. Nothing else in the plan changed.
- Assumption (criterion 2, recorded per `user_story_alignment.md` Section 4): the version and the commit arrive in the same `GET /api/version` response, so while that request is pending or after it fails no version is known either. "The version alone" is read as "the footer exactly as TEST-08 renders it, with no commit": `Task Notes v{version}` when a version is known, `Task Notes` when it is not (TEST-08's own pending and failure text, kept unchanged). No second request and no cached version are introduced.
- Assumption (criterion 1): TEST-09's backend answers `commit: "unknown"` when `BUILD_COMMIT` is unset (`backend/app/core/config.py`, `DEFAULT_BUILD_COMMIT`). `unknown` is exactly 7 characters, so a naive slice would print `(unknown)` in the footer. The client treats `unknown`, an empty string, a missing `commit` field and a non-string `commit` as "no commit", and the footer then shows the version alone, like criterion 2.
- Assumption (format): the commit is shown in parentheses after the version, `Task Notes v0.1.0 (0123456)`. The criterion says "next to the version" without a format; Design Reference mode is NONE.
- Assumption (no version): when the backend reports the `unknown` version sentinel (footer shows `Task Notes`), the commit is not shown either, because the criterion places it next to the version and there is none.

## Plan Overview
Frontend only. The version API client (`frontend/src/api/version.ts`) is extended to read `commit` from the response it already fetches and return both fields; `AppFooter` renders the first 7 characters of the commit in parentheses after the version when both are known, and keeps TEST-08's text otherwise. No backend, routing or dependency change. Tests: the client's unit tests and the footer's component tests (Vitest), the landing page test's client mock moved to the new return shape, one Playwright spec with mocked `/api/version` responses, and the UAT artifacts.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `fetchBackendVersion()` keeps its name, its single request, its 5 s timeout and every existing throw (network error, timeout, non-OK status, missing or empty `version`). Its return type changes from `string | null` to `BackendVersion = { version: string | null; commit: string | null }`. `version` keeps its current mapping (`unknown` to `null`). `commit` is the response's `commit` when it is a non-empty string other than `unknown`, otherwise `null`; a bad `commit` never throws, because the version in the same body is still valid (TEST-08's behaviour must not regress when an older backend omits `commit`).
  - `frontend/src/components/AppFooter.tsx`: holds the `BackendVersion` result in state. Renders `Task Notes v{version} ({commit.slice(0, 7)})` when both are non-null, `Task Notes v{version}` when only the version is known, and `Task Notes` while pending, on failure, or when the version is the unknown sentinel. The 7 is a named constant (`SHORT_COMMIT_LENGTH = 7`) in the component, since it is a display rule; the backend already truncates to 12 and that value is not reused. `data-testid="app-footer"`, the `<footer>` landmark and `footerStyle` are unchanged.
  - `frontend/src/components/LandingPage.test.tsx`: test-only follow-on of the return-type change. Its `fetchBackendVersion` mock resolves `{ version: BACKEND_VERSION, commit: null }` instead of the bare string `BACKEND_VERSION`; every existing test and assertion stays as it is, including `Task Notes v9.8.7` and the `not.toHaveTextContent(v{packageVersion})` check, which hold unchanged because a null commit renders the version alone. No new test is added here: the commit rendering is covered in `AppFooter.test.tsx`.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today; the unmount guard stays.
- Design reference notes: AI freestyle. The commit text reuses the footer's existing inline style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`); no new style values.

## Backend Plan
No backend changes required. TEST-09 already serves `{"version": "...", "commit": "..."}` from `GET /api/version`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05 and TEST-09; consumed, not changed)
- Request: no body
- Response: `200 {"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is `"unknown"` when `BUILD_COMMIT` is unset, and up to 12 characters otherwise. `version` is `"unknown"` when the package metadata is missing.
- Client contract (`fetchBackendVersion`): resolves `{ version: "0.1.0", commit: "0123456789ab" }`; `{ version: "0.1.0", commit: null }` for a commit of `"unknown"`, `""`, a missing or a non-string commit; `{ version: null, commit: ... }` for the unknown version sentinel; rejects exactly as it does today.

## Technology Selection
- Short commit (first 7 characters): chose `String.prototype.slice(0, 7)` from the standard library over any formatting helper or dependency, because a slice covers it fully.
- No net-new component, module or dependency otherwise: the existing `fetchBackendVersion` client and `AppFooter` component are extended in place rather than adding a second client or component.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright spec, footer shows the short commit next to the version, and the version alone for the unknown commit (both with a mocked `/api/version`)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }`, map the unknown, empty, missing and non-string commit to null
- [A] frontend/src/api/version.test.ts: update existing assertions to the new return shape, add commit cases (replaces the "ignores fields other than version" test)
- [A] frontend/src/components/AppFooter.tsx: render the 7-character commit next to the version
- [A] frontend/src/components/AppFooter.test.tsx: update mocks to the new shape, add the commit success and unknown-commit cases, keep pending and failure cases
- [A] frontend/src/components/LandingPage.test.tsx: update the `fetchBackendVersion` mock to the new shape, `{ version: BACKEND_VERSION, commit: null }`, and keep its existing assertions unchanged

No dependency is added or changed, so no lockfile changes; and no project structure, run configuration or test infrastructure changes, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: Vitest, frontend. `version.ts` client (commit mapping) and `AppFooter` component (success with commit, version without commit, pending, failure). `LandingPage.test.tsx` gets only its mock moved to the new return shape so its existing footer assertion keeps passing.
  - Directory: beside the module, `frontend/src/api/` and `frontend/src/components/` (project-standards Layout)
  - Naming: `{Module}.test.ts(x)`
- Backend unit and integration tests: not warranted, no backend code changes (`testing_standards.md` Section 6: no service, repository or router change).
- E2E tests: one spec, two tests, `/api/version` fulfilled through `page.route` so the commit is deterministic (the E2E backend runs with `BUILD_COMMIT` unset and would answer `unknown`).
  - Directory: `e2e/tests/`
  - File: `TEST-10_footer_build_commit.spec.ts`
- UAT scenarios: one per criterion plus the unknown-commit edge case.
  - Directory: `e2e/uat/scenarios/`
- Regression: TEST-08's `e2e/tests/TEST-08_footer_app_version.spec.ts` must keep passing unchanged; with `BUILD_COMMIT` unset the footer still reads `Task Notes v{version}`. `LandingPage.test.tsx`'s `shows the backend version, not the frontend package.json version` must keep passing with its assertion unchanged.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit next to the version | E2E | `shows the first 7 characters of the build commit next to the version`, `renders the short commit next to the version` | — |
| 2 | While pending or on failure, the footer shows the version alone, never `undefined` or an error | Unit | `shows only the app name while the version request is pending`, `shows only the app name when the version request fails`, `shows the version alone when the backend reports the unknown commit`, `returns a null commit when the backend reports the unknown commit` | verifying it needs no navigation or interaction: it is a render rule of one component over a mocked client, and the browser-level failure path is already covered by TEST-08's spec |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the short commit next to the version`, `shows only the app name while the version request is pending`, `shows only the app name when the version request fails` | the criterion is itself the existence of a component test, which is the unit tier |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | `page.route('**/api/version')` fulfils version `0.1.0`, commit `0123456789ab`; go to `/`; `app-footer` has text `Task Notes v0.1.0 (0123456)`. Edge test: commit `unknown` gives `Task Notes v0.1.0` | Given the backend reports version 0.1.0 and commit 0123456789ab, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (0123456)" |
| 2 | Pending or failed request shows the version alone | covered at Unit, see Criterion coverage | Given the version request fails, When I open the landing page, Then the footer reads "Task Notes" and contains no "undefined" |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the repository, When I run the AppFooter component tests, Then they pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: database running; backend started from the repository root with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d backend` (or `uv run` with that variable exported), listening on `http://localhost:8010`; frontend running on `http://localhost:5183`. Read `[project].version` in `backend/pyproject.toml`; this plan writes it as `0.1.0`.
1. Open `http://localhost:8010/api/version` in a browser tab → the body is `{"version":"0.1.0","commit":"0123456789ab"}`.
2. Open `http://localhost:5183/` and scroll to the footer → it reads exactly `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit in parentheses.
3. Recreate the backend with `BUILD_COMMIT=abc1234 docker compose up -d backend` and reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0 (abc1234)`.
4. Recreate the backend with `BUILD_COMMIT= docker compose up -d backend` (commit becomes `unknown`) and reload → the footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown`.

### Criterion 2: While pending or on failure, the footer shows the version alone
Prerequisites: as for Criterion 1, backend running with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`; Chrome with DevTools.
1. Open `http://localhost:5183/`, open DevTools → Network, set throttling to "Slow 3G", reload → while the `version` request is pending the footer reads exactly `Task Notes` (no version is known yet, since version and commit come from the same request); once it completes it reads `Task Notes v0.1.0 (0123456)`.
2. In DevTools → Network, right-click the `version` request, choose "Block request URL", reload → the footer reads exactly `Task Notes` and stays that way; it never shows `undefined`, `null`, `unknown` or an error message.
3. Unblock the URL, stop the backend (`docker compose stop backend`), reload → the page loads with the heading and note form, and the footer reads exactly `Task Notes`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run lists `renders the short commit next to the version`, `shows only the app name while the version request is pending` and `shows only the app name when the version request fails` as passing; its summary line reports no failed or errored test and the command exits 0.
2. Run `npm --prefix frontend test -- src/api/version.test.ts src/components/LandingPage.test.tsx` → its summary line reports no failed or errored test and the command exits 0.
