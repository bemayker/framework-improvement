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
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 25 comments on the item, all framework "PR opened" notices from earlier runs whose code was reset off main → not acted on because none carries feedback on the feature; no comment amends the description.
- Merged since the last plan: n/a (fresh plan, no earlier plan for TEST-10; base main at 9dd8a9e6, which already contains TEST-08 as 24ace3c1 and TEST-09 as 9dd8a9e6).
- Assumption (criterion 2, "the version alone"): the version and the commit arrive in the same `GET /api/version` response, so while that request is pending, or when it fails outright, there is no version to show either. Those two states keep TEST-08's merged behaviour: the footer reads exactly `Task Notes` (TEST-08 criteria 3 and 5). "The version alone" is read as the state where the version resolved but the commit did not: the response carries a usable version and a commit that is missing, not a string, blank, or the backend's `unknown` sentinel (`DEFAULT_BUILD_COMMIT` in `backend/app/core/config.py`, reported whenever `BUILD_COMMIT` is unset). Then the footer reads `Task Notes v{version}`, exactly as TEST-08 left it. In no state does the footer show `undefined`, `null`, `unknown`, empty parentheses or an error.
- Assumption (format, design mode NONE): the commit is shown in parentheses after the version, `Task Notes v0.1.0 (0123456)`, in the same footer text and style.
- Assumption (commit without a version): when the version is unresolvable (TEST-08's rules) the commit is not shown either, because criterion 1 places it next to the version; the footer reads `Task Notes`.
- Assumption (shortening): the backend already cuts the commit to 12 characters; the frontend keeps the first 7 of whatever trimmed string it receives, so a commit shorter than 7 characters is shown unchanged.

## Plan Overview
Frontend-only change on TEST-08's footer, consuming TEST-09's `commit` field. The version client `frontend/src/api/version.ts` stops resolving to a bare string and resolves to `{ version, commit }` (or `null`), where `commit` is the first 7 characters of the backend's commit or `null` when unusable. `AppFooter.tsx` renders ` ({commit})` after the version when both are present. The two existing frontend test files that mock the client (`AppFooter.test.tsx`, `LandingPage.test.tsx`) follow the new return shape, and TEST-08's E2E spec, whose first test asserts the exact footer text, learns that the text now ends in the commit when the backend reports one. No backend change: the `commit` field is TEST-09's and is on main. `LandingPage.tsx` is not edited.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify):
    - Export `type BackendVersion = { version: string; commit: string | null }`.
    - `fetchBackendVersion(): Promise<BackendVersion | null>`. Every existing rule for the version is unchanged (rejected fetch, non-2xx, JSON parse failure, non-object body, missing or non-string `version`, blank `version`, `unknown` sentinel all resolve to `null`; it never rejects).
    - When the version is usable, read `commit` from the same body: a string that, trimmed, is non-empty and is not `UNKNOWN_BUILD_COMMIT` becomes `trimmed.slice(0, SHORT_COMMIT_LENGTH)`; anything else becomes `null`. A bad commit never turns a good version into `null`.
    - Export `SHORT_COMMIT_LENGTH = 7` and `UNKNOWN_BUILD_COMMIT = "unknown"`, the latter with a one-line comment that it mirrors `DEFAULT_BUILD_COMMIT` in `backend/app/core/config.py`, as `UNKNOWN_BACKEND_VERSION` already does for the version.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `useState<BackendVersion | null>(null)`; render `{APP_NAME}` always, ` v{version}` when the state is non-null, and ` ({commit})` only when the state is non-null and `commit` is non-null (conditional fragments, so no dangling space, `v` or parentheses). Keep `data-testid="app-footer"`, the `<footer>` element, the `isMounted` guard and `footerStyle` unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local component state in `AppFooter` (`BackendVersion | null`; `null` means pending or unresolved, both rendering `Task Notes`).
- Design reference notes: AI freestyle (Design Reference mode NONE). Existing footer values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem. Text: `Task Notes v{version} ({commit7})` when both resolve, `Task Notes v{version}` when the commit does not, `Task Notes` while pending or when the request fails.

## Backend Plan
No backend changes required.

`GET /api/version` already returns `commit` (TEST-09: `backend/app/routers/version.py`, `services/version_service.py` `get_build_commit()`, first 12 characters of `BUILD_COMMIT`, `unknown` when unset), with integration coverage in `backend/tests/integration/test_version_integration.py`. Nothing in this item edits, adds or tests backend code.

## API Integration Plan
No external API integration.

## API Contract
Consumed, unchanged, from TEST-05 and TEST-09:
- Method: GET
- URL: `/api/version` (base: `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters.
- Response: 200, `{"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is `"unknown"` when `BUILD_COMMIT` was not set at build time.
- Client contract: `fetchBackendVersion(): Promise<BackendVersion | null>`, never rejects. `null` means "render `Task Notes`"; `{ version: "0.1.0", commit: null }` means "render `Task Notes v0.1.0`"; `{ version: "0.1.0", commit: "0123456" }` means "render `Task Notes v0.1.0 (0123456)`".

## Technology Selection
- Commit shortening: chose `String.prototype.slice` over any helper or dependency; the standard library covers it.
- Commit and version together: chose extending the existing `fetchBackendVersion` (one request, browser `fetch`) over a second client function or second request to the same endpoint, because both values come from one response.
- No net-new component, module or dependency is introduced; no lockfile change.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright spec, footer shows the 7-character commit next to the version, and the version alone when the backend reports the unknown commit
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/version.ts: resolve to `{ version, commit }` or `null`; commit cut to 7 characters, `null` when missing, blank, non-string or `unknown`
- [A] frontend/src/api/version.test.ts: existing cases follow the new return shape; new cases for the 7-character commit and the unusable-commit paths
- [A] frontend/src/components/AppFooter.tsx: render ` ({commit})` after the version when the commit resolved
- [A] frontend/src/components/AppFooter.test.tsx: mocks return the new shape; new cases for commit present and version alone; pending and failure cases kept
- [A] frontend/src/components/LandingPage.test.tsx: the `fetchBackendVersion` mock resolves to `{ version, commit: null }` instead of a string, so the existing footer assertion stays valid
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the exact-text assertion in its first test appends ` ({first 7 of commit})` when the page's own `/api/version` response carries a usable commit

No dependency is added, so no lockfile changes. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the item changes no project structure, run configuration, dependency or test infrastructure (`BUILD_COMMIT` is already documented by TEST-09).

## Testing Strategy
- Unit tests: Vitest, beside the code. `api/version.test.ts` stubs `fetch` (`vi.stubGlobal`, the existing `stubFetchJson` helper) and covers the commit mapping: full commit cut to 7, short commit kept, missing, blank, non-string and `unknown` commit to `null` with the version still returned. Existing test titles are kept; `returns the version string from GET /api/version` now asserts `{ version: "0.1.0", commit: null }` for a body without a commit. `AppFooter.test.tsx` mocks `../api/version` and covers success with commit, version alone, pending and failure. `LandingPage.test.tsx` only adapts its mock value.
  - Directory: beside the component under `frontend/src/` (project convention; CLAUDE.md's unit directory `backend/tests/unit/` is the backend's)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: no new integration test. The item adds or modifies no router, service or repository; `GET /api/version`'s `commit` field is covered by TEST-09's `backend/tests/integration/test_version_integration.py`, unchanged.
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 in the browser. The commit the backend reports depends on how the stack was built (`unknown` without `BUILD_COMMIT`), so the spec fulfils `/api/version` with `page.route` and a fixed body `{"version": "0.1.0", "commit": "0123456789ab"}` and asserts the footer reads exactly `Task Notes v0.1.0 (0123456)`. Edge case: the same route answers `{"version": "0.1.0", "commit": "unknown"}` and the footer reads exactly `Task Notes v0.1.0`. TEST-08's spec is adjusted so its exact-text test holds whether or not the real backend reports a commit.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the unknown-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from GET /api/version, next to the version | E2E | `shows the first 7 characters of the commit from GET /api/version next to the version`, `renders the short commit next to the version`, `returns the commit cut to its first 7 characters` | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never undefined or an error | Unit | `renders the version alone when the commit is unavailable`, `renders exactly the app name while the version request is pending`, `renders exactly the app name when the backend is unreachable`, `returns a null commit when the backend reports the unknown commit sentinel`, `returns a null commit when the commit is missing, blank or not a string` | Verifying it needs no navigation or interaction: it is the component's rendering of pending, failed and commit-less states and the client's mapping, and a pending promise is only controllable deterministically in a component test (the E2E edge-case spec also exercises the version-alone state) |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the short commit next to the version`, `renders exactly the app name while the version request is pending`, `renders exactly the app name when the backend is unreachable` | The criterion is itself a component test |

Edge-case E2E spec (one per feature): `shows the version alone when GET /api/version reports the unknown commit`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | `page.route` fulfils `/api/version` with `{"version":"0.1.0","commit":"0123456789ab"}`, go to `/`, assert `app-footer` has text exactly `Task Notes v0.1.0 (0123456)` | Given the backend was built with BUILD_COMMIT 0123456789abcdef0123456789abcdef01234567, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (0123456)" |
| 2 | Pending or failing shows no commit and no error | covered at Unit, see Criterion coverage; edge-case spec fulfils `commit: "unknown"` and asserts exactly `Task Notes v0.1.0` | Given the backend was built without BUILD_COMMIT, When I open the landing page, Then the footer reads "Task Notes v0.1.0" with no parentheses |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then the success, pending and failure cases pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: from the repository root, the stack was started with `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build`; backend on http://localhost:8010, frontend on http://localhost:5183.
1. Open http://localhost:8010/api/version → the page shows `{"version":"0.1.0","commit":"0123456789ab"}`.
2. Open http://localhost:5183/ → the landing page shows the "Task Notes" heading, the note form and a footer at the bottom.
3. Read the footer → it reads exactly `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit from step 1 in parentheses.

### Criterion 2: While the request is pending or when it fails, no commit and no error is shown
Prerequisites: as Criterion 1; Chrome devtools.
1. From the repository root run `docker compose up -d --build backend` with `BUILD_COMMIT` not set in your shell → http://localhost:8010/api/version shows `{"version":"0.1.0","commit":"unknown"}`.
2. Reload http://localhost:5183/ → the footer reads exactly `Task Notes v0.1.0`: no parentheses, no `unknown`, no `undefined`.
3. In devtools, Network tab, set throttling to "Slow 3G" and reload http://localhost:5183/ → while `/api/version` is pending the footer reads `Task Notes`, with no `undefined`, no placeholder and no error text; once the request completes it reads `Task Notes v0.1.0`. Reset throttling to "No throttling".
4. Run `docker compose stop backend`, then hard-reload http://localhost:5183/ (Cmd+Shift+R) → the footer reads exactly `Task Notes`; the devtools Console shows no uncaught error from the footer.
5. Run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build backend`, wait until http://localhost:8010/api/version answers, and reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0 (0123456)` again.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: its summary line reports no failed or errored test, and the command exits 0.
2. Read the run's test list → it includes `renders the short commit next to the version`, `renders exactly the app name while the version request is pending` and `renders exactly the app name when the backend is unreachable`.
