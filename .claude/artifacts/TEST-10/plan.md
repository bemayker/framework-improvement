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
- Comment (tracker): 56 comments scanned by the dispatching session, every one an automated `mayker-dev` bot note from earlier runs whose code was reset off main → not acted on because none is a stakeholder requirement; no human comment exists on the item.
- Orchestrator re-plan (deliver-20261125T133431Z, manifest gap): `frontend/src/components/LandingPage.test.tsx` mocks `fetchBackendVersion` with `mockResolvedValue("9.9.9")` (line 33) and asserts `app-version` reads `v9.9.9` (line 58); the widened client return shape breaks it → acted on: added to the File Manifest as `[A]`, the mock resolves `{ version: "9.9.9", commit: null }` and the existing assertion is kept unchanged; added to `shared_risks.md` under the modified files.
- Orchestrator re-plan (deliver-20261125T133431Z, TEST-08 spec): on a stack started with BUILD_COMMIT set, TEST-08's E2E spec is already false after this merge → acted on in `shared_risks.md` only (verified: `docker-compose.yml` line 25 passes `BUILD_COMMIT` as a backend build arg, and `e2e/tests/TEST-08_footer_app_version.spec.ts` line 33 asserts the footer text is exactly `Task Notes v${version}`); the spec is not edited in this item.
- Assumption (criterion 2, recorded instead of a blocking question): the version and the commit arrive in the same `GET /api/version` response, so while it is pending or after it fails no version is known either. The footer therefore keeps TEST-08's pending and failure rendering, exactly `Task Notes`, with no commit, no `undefined` and no error text. "The version alone" is applied to the one state where a version is known without a usable commit: the response has a version but its `commit` is `"unknown"` (TEST-09's sentinel, which every build reports today because no CI workflow sets BUILD_COMMIT), empty, missing or not a string. The footer then reads `Task Notes v{version}`, exactly as TEST-08 left it.
- Assumption (criterion 1, display format): the commit renders as ` ({7 chars})` in its own `data-testid="app-commit"` span, a sibling after TEST-08's `app-version` span, so the footer reads `Task Notes v0.1.0 (0123456)`. A sibling rather than a child keeps `app-version`'s text exactly `v{version}`, which TEST-08's spec asserts.
- Assumption (criterion 1, truncation): the backend already shortens the commit to 12 characters (TEST-09's COMMIT_LENGTH); the footer takes the first 7 of what it receives, and a value shorter than 7 is shown whole.
- Dispatch note (TEST-08 UAT script drift): steps 1 and 5 of `e2e/uat/scripts/TEST-08_footer_app_version_uat_script.md` quote the body as exactly `{"version":"0.1.0"}`, wrong since TEST-09 added `commit`. This item does not make those steps its own scope: its footer change leaves TEST-08's expected footer text true under the default stack (BUILD_COMMIT unset, commit `unknown`, no commit shown), but not on a stack started with BUILD_COMMIT set (see `shared_risks.md`), so the script is not touched and the follow-up the dispatch names fixes it.

## Plan Overview
Frontend only. The version API client (`frontend/src/api/version.ts`) is widened to return both fields of `GET /api/version`, normalising the commit to `null` when it is the backend's `"unknown"` sentinel or not a non-empty string. `AppFooter` renders the first 7 characters of a usable commit next to the version, and keeps every other state TEST-08 defined. Component tests (Vitest) cover success, pending and failure; one Playwright spec covers the rendered footer on the landing page. The existing `LandingPage` test's version mock moves to the new shape. No backend, no new dependency, no new route.

## Frontend Plan
- Components to create/modify: `frontend/src/components/AppFooter.tsx` (state holds the client's `{ version, commit }` result instead of a string; renders `<span data-testid="app-commit"> ({commit.slice(0, SHORT_COMMIT_LENGTH)})</span>` after the `app-version` span only when both version and commit are present; `SHORT_COMMIT_LENGTH = 7` as a named constant). `frontend/src/api/version.ts` (`fetchBackendVersion()` resolves `BackendVersion | null`, where `type BackendVersion = { version: string; commit: string | null }`; `null` stays the answer when the version is unusable, exactly as today; the commit gets the same sentinel and type check as the version, against the same `"unknown"` value, which is the backend's DEFAULT_BUILD_COMMIT in `backend/app/core/config.py` as well as UNKNOWN_VERSION, and the comment on the constant names both). `frontend/src/components/LandingPage.test.tsx` (test only: the `fetchBackendVersion` mock in `beforeEach` resolves `{ version: "9.9.9", commit: null }` instead of `"9.9.9"`; the `app-version` assertion `v9.9.9` is kept as is).
- Routes: none.
- State management: local `useState` in `AppFooter`, as today.
- Design reference notes: AI freestyle. The commit span inherits the existing footer style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem` on the footer); no new style values.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05 and TEST-09; consumed, not changed)
- Request: none
- Response: `{"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is the first 12 characters of BUILD_COMMIT, or `"unknown"` when it is unset or blank (the default for every build today)
- Client contract (`fetchBackendVersion()`): resolves `{ version: "0.1.0", commit: "0123456789ab" }`; resolves `{ version: "0.1.0", commit: null }` when `commit` is `"unknown"`, `""`, missing or not a string; resolves `null` when the version is unusable (unchanged); rejects on a non-OK status or a network failure (unchanged)

## Technology Selection
- Commit shortening: chose the standard `String.prototype.slice(0, 7)` over any helper or dependency, because the standard library covers it fully.
- No net-new component, module or dependency otherwise: the feature modifies the existing `AppFooter` component and `version.ts` client, and its tests use the Vitest, Testing Library and Playwright setups the project already installs.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright spec, the commit shown next to the version on the landing page, and the version alone for an unknown commit
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }`, commit normalised to null for the unknown sentinel or an unusable value
- [A] frontend/src/api/version.test.ts: existing cases updated to the object shape, new commit cases added
- [A] frontend/src/components/AppFooter.tsx: render the 7-character commit span next to the version
- [A] frontend/src/components/AppFooter.test.tsx: mocks return the object shape, success, pending, failure and unknown-commit cases assert the commit span
- [A] frontend/src/components/LandingPage.test.tsx: `fetchBackendVersion` mock resolves `{ version: "9.9.9", commit: null }` instead of `"9.9.9"`; the existing `app-version` assertion `v9.9.9` is kept

No dependency changes, so no lockfile is touched. No project structure, run configuration, dependency or test-infrastructure change, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: `fetchBackendVersion()` commit normalisation (usable commit, `"unknown"`, empty, missing, non-string) and `AppFooter` rendering (success with commit, version without usable commit, pending, failure), Vitest with Testing Library, the client mocked in the component test and `fetch` stubbed in the client test. `LandingPage.test.tsx` keeps its existing cases, with only its version mock moved to the new shape.
  - Directory: co-located `*.test.tsx` and `*.test.ts` under `frontend/src/` (project-standards Layout)
  - Naming: `{Module}.test.tsx`, `{module}.test.ts`
- Integration tests: not warranted. No backend, repository or endpoint changes; `GET /api/version` is already covered by TEST-09's `backend/tests/integration/test_version_integration.py`.
  - Directory: backend/tests/integration/
- E2E tests: the rendered footer on the landing page shows the 7-character commit next to the version (response fulfilled with a known commit through `page.route`, because the stack's real backend reports `unknown`), plus an edge-case spec for the unknown commit showing the version alone. Locators: `data-testid` `app-footer`, `app-version`, `app-commit`.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the unknown-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added. | E2E | `shows the first 7 characters of the build commit next to the version`, `renders the first 7 characters of the commit next to the version`, `returns the backend commit alongside the version` | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. | Unit | `renders the app name without a version or commit while the request is pending`, `renders the app name without a version or commit when the request fails`, `renders the version alone when the backend has no usable commit`, `returns a null commit when the backend reports the unknown sentinel` | verifying it needs no navigation or interaction: pending and failure are states of one component, deterministic only with the client mocked |
| 3 | A component test covers the success, pending and failure paths. | Unit | `renders the first 7 characters of the commit next to the version`, `renders the app name without a version or commit while the request is pending`, `renders the app name without a version or commit when the request fails` | verifying it needs no navigation or interaction: the criterion is the component test itself |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 commit characters next to the version | `page.route` fulfils `/api/version` with `{"version":"0.1.0","commit":"0123456789ab"}`, goto `/`, assert `app-footer` text `Task Notes v0.1.0 (0123456)` and `app-commit` text `(0123456)`; edge-case spec fulfils `commit` `unknown` and asserts `Task Notes v0.1.0` with no `app-commit` | Given the backend reports commit 0123456789ab, When I open the landing page, Then the footer reads Task Notes v0.1.0 (0123456) |
| 2 | Pending or failed request shows no commit, never undefined or an error | covered at Unit, see Criterion coverage | Given the backend is stopped, When I open the landing page, Then the footer reads Task Notes with no undefined or error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then the success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
Prerequisites: Docker running; repository checked out on `feature/TEST-10-footer-build-commit`; stack started with a known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` from the repository root (backend on `http://localhost:8010`, frontend on `http://localhost:5183`).
1. Run `curl -s http://localhost:8010/api/version` → it prints a body with `"version":"0.1.0"` and `"commit":"0123456789ab"`.
2. Open `http://localhost:5183/` in a browser → the landing page with the Task Notes heading is shown.
3. Scroll to the footer → it reads exactly `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit from step 1 in parentheses.
4. In DevTools Elements, inspect the footer → a span with `data-testid="app-commit"` holds ` (0123456)`, and the span with `data-testid="app-version"` still holds exactly ` v0.1.0`.
5. Run `docker compose up -d --build backend` without BUILD_COMMIT set, then reload `http://localhost:5183/` → `curl -s http://localhost:8010/api/version` shows `"commit":"unknown"`, and the footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown`.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
Prerequisites: stack running with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build`; browser open at `http://localhost:5183/`.
1. In DevTools Network set throttling to `Slow 3G` and reload the page → while `/api/version` is in flight the footer reads exactly `Task Notes`, with no `undefined`, no `(` and no error text; once it completes the footer reads `Task Notes v0.1.0 (0123456)`.
2. Set throttling back to `No throttling` → throttling is off.
3. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the page still renders and the footer reads exactly `Task Notes`, with no `v`, no `(`, no `undefined`, `null`, `unknown` or error text.
4. In DevTools Network, find the `/api/version` request → it failed (connection refused).
5. Run `docker compose start backend` and reload the page → the footer reads `Task Notes v0.1.0 (0123456)` again.

### Criterion 3: A component test covers the success, pending and failure paths.
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Open `frontend/src/components/AppFooter.test.tsx` → it contains the tests `renders the first 7 characters of the commit next to the version`, `renders the app name without a version or commit while the request is pending` and `renders the app name without a version or commit when the request fails`.
2. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts src/components/LandingPage.test.tsx` → the run passes: its summary line reports no failed or errored test and the command exits 0.
