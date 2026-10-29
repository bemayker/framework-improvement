# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> The landing page footer shows the short build commit next to the version.
>
> Acceptance criteria:
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> Notes: Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates. Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 15 comments read by the dispatching session, all framework PR notices from earlier runs; none actionable → not acted on because none carries feature feedback.
- Assumption (criterion 2, "the request"): TEST-08's footer and this feature read the same single `GET /api/version` response, so there is one request, not a second one for the commit. Read that way: while it is pending the footer shows exactly what TEST-08 shows (`Task Notes`, no version yet, never `undefined`); when the whole request fails the footer shows `Task Notes` as TEST-08 does today; when the response carries a valid version but no usable commit (missing, non-string or empty `commit`) the footer shows the version alone, `Task Notes v0.1.0`. A second request just for the commit would double the calls for no criterion and is not planned.
- Assumption (the `unknown` commit): the backend answers `commit: "unknown"` when `BUILD_COMMIT` is unset (`backend/app/core/config.py` `DEFAULT_BUILD_COMMIT`). Criterion 1 says to show the first 7 characters of the commit as returned, so this plan does not special-case that value; tracker item BUG-03 ("Footer sometimes shows 'unknown' instead of the build commit", depends on TEST-10) owns that behaviour, and handling it here would pre-empt it.
- Merged since the last plan: n/a (fresh plan; TEST-08 #397 and TEST-09 #395 are both on main at 1ce28ff and this plan reads the code as it now stands).

## Plan Overview
Frontend only. The version API client (`frontend/src/api/version.ts`) returns the `commit` field alongside `version` instead of discarding it, and `AppFooter` renders the first 7 characters of that commit in its own span after the version: `Task Notes v0.1.0 (4f2a9c1)`. A missing or invalid commit is not a failure of the request: the client returns `commit: null` and the footer shows the version alone. The existing pending and failure behaviour of TEST-08 is unchanged. No backend change: TEST-09 already returns `commit` (truncated to 12 characters server-side by `version_service.COMMIT_LENGTH`).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: export a `BackendVersion` type `{ version: string; commit: string | null }`; `fetchBackendVersion()` now resolves to `BackendVersion`. Every existing rejection (non-OK status, bad shape, missing/empty/non-string version, `unknown` version sentinel, network error, 5 s timeout) is unchanged. `commit` is the body's `commit` when it is a non-empty string, otherwise `null` (a missing commit does not reject, because the version is still valid).
  - `frontend/src/components/AppFooter.tsx`: hold the resolved `BackendVersion | null` in state; render the existing `<span data-testid="app-footer-version"> v{version}</span>` and, only when `commit` is non-null, a sibling `<span data-testid="app-footer-commit"> ({commit.slice(0, SHORT_COMMIT_LENGTH)})</span>` with `const SHORT_COMMIT_LENGTH = 7`. Nothing else in the footer changes (`app-footer` test id, `contentinfo` landmark, style object, catch comment).
  - `frontend/src/components/LandingPage.test.tsx`: the `fetchBackendVersion` mock resolves to `{ version: "9.9.9-test", commit: null }` instead of the bare string, so its existing footer assertion keeps passing against the new return type. No other change.
- Routes: none (landing page `/`, unchanged).
- State management: local `useState` in `AppFooter`, as TEST-08 already does.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span inherits the footer's existing style (`fontSize 0.875rem`, `color #5f5f5f`); no new styling.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Consumed, unchanged (delivered by TEST-09):
- Method: GET
- URL: `/api/version`
- Request: none
- Response: `200 {"version": "0.1.0", "commit": "4f2a9c1e8b7d"}` (`commit` is at most 12 characters; `"unknown"` when `BUILD_COMMIT` is unset)

Frontend client contract (changed): `fetchBackendVersion(): Promise<BackendVersion>` where `BackendVersion = { version: string; commit: string | null }`.

## Technology Selection
- Short commit (first 7 characters): chose the standard `String.prototype.slice(0, 7)` over any helper module or dependency, because the language covers it.
- No net-new component, module or dependency otherwise: the change extends the existing client and footer, and every test uses the already-installed Vitest, Testing Library and Playwright.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec for criterion 1 (stubbed `/api/version` with a commit, footer shows the 7-character prefix next to the version) and the edge case (response without a commit shows the version alone)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }`, export `BackendVersion`
- [A] frontend/src/api/version.test.ts: assert the new return shape; add cases for a valid commit, a missing commit, an empty commit and a non-string commit (all resolve with `commit: null` except the valid one)
- [A] frontend/src/components/AppFooter.tsx: render the 7-character commit in `app-footer-commit` after the version
- [A] frontend/src/components/AppFooter.test.tsx: success (version and commit), success without commit (version alone), pending, failure paths
- [A] frontend/src/components/LandingPage.test.tsx: version mock resolves to the new object shape
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the live-backend test (criterion 1 of TEST-08) asserts the footer starts with `Task Notes v{version}` and, when the response carries a commit, shows its first 7 characters, instead of an exact `toHaveText` that the new commit span would break

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure change.

## Testing Strategy
- Unit tests: `fetchBackendVersion` return shape and commit validation (`frontend/src/api/version.test.ts`); `AppFooter` success with commit, success without commit, pending and failure (`frontend/src/components/AppFooter.test.tsx`), with the client mocked as TEST-08 does.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (Vitest; the backend unit directory `backend/tests/unit/` is not touched)
  - Naming: `{Module}.test.ts(x)`, matching the existing frontend tests
- Integration tests: not warranted; no backend, repository or endpoint change (TEST-09's endpoint tests already cover the `commit` field).
  - Directory: `backend/tests/integration/` (not touched)
- E2E tests: footer shows the commit prefix next to the version on `/` with a stubbed `/api/version`; edge case: a response without `commit` shows the version alone.
  - Directory: `e2e/tests/`
  - File: `TEST-10_footer_build_commit.spec.ts`
- UAT scenarios: one per criterion plus one edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Footer shows the first 7 characters of the commit next to the version | E2E | — |
| 2 | Pending or failed request shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: it is a render state of `AppFooter` under a pending or rejected client promise, which a component test controls exactly and a browser can only approximate |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test; it is satisfied by `AppFooter.test.tsx`, not by a browser run |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | Stub `**/api/version` with `{"version":"2.0.0-e2e","commit":"4f2a9c1e8b7d"}`, go to `/`, expect `app-footer` text `Task Notes v2.0.0-e2e (4f2a9c1)` and `app-footer-commit` visible; edge spec: stub without `commit`, expect `Task Notes v2.0.0-e2e` and `app-footer-commit` count 0 | Given the backend reports version 2.0.0 and commit 4f2a9c1e8b7d, When I open the landing page, Then the footer reads "Task Notes v2.0.0 (4f2a9c1)" |
| 2 | Pending or failed shows version alone | covered at Unit, see Criterion coverage | Given the version endpoint is unreachable, When I open the landing page, Then the footer reads "Task Notes" with no "undefined" or error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker running; from the repository root, the stack started with a known commit: export `BUILD_COMMIT=4f2a9c1e8b7d6a5f3e2d1c0b9a8f7e6d5c4b3a21` in your shell, then run `docker compose up -d --build`.
1. Open `http://localhost:8010/api/version` in a browser → the JSON shows `"commit": "4f2a9c1e8b7d"` and a `"version"` value (for example `0.1.0`); note the version.
2. Open `http://localhost:5183/` → the landing page loads with the "Task Notes" heading.
3. Scroll to the footer at the bottom of the page → it reads `Task Notes v0.1.0 (4f2a9c1)`, with the version you noted in step 1 and exactly 7 commit characters in the parentheses.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack from Criterion 1 is running.
1. With `http://localhost:5183/` open, run `docker compose stop backend` in a terminal → the backend container stops.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`: no version, no parentheses, and no `undefined`, `null`, `unknown` or error text anywhere in it; the rest of the page still renders.
3. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, and reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0 (4f2a9c1)` again.
4. The pending state is too brief to observe by hand; it is verified by the component test: run `npm --prefix frontend test -- AppFooter` → the `AppFooter.test.tsx` tests, including the pending and failure cases, report 0 failed.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Open `frontend/src/components/AppFooter.test.tsx` → it contains one test each for the success path (version and 7-character commit shown), the pending path (footer reads `Task Notes`) and the failure path (footer reads `Task Notes`, no `undefined`).
2. Run `npm --prefix frontend test -- AppFooter` → the tests in `AppFooter.test.tsx` run and report 0 failed.
