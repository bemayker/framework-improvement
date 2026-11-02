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
- Comment (tracker): none actionable. The dispatch reports the item's tracker comments are framework notes from earlier runs, so none changes this plan.
- Assumption (criterion 2, "pending or fails"): version and commit arrive in one response from one request (`GET /api/version`, TEST-09), so there is no state in which the version is known and the commit request is still pending. "The version alone" is therefore read as "no commit part, and nothing else changes": while the request is pending or after it fails outright, the footer renders exactly what TEST-08 renders in those states, `Task Notes`. Where the response succeeds but carries no usable commit, the footer renders `Task Notes v{version}`. No second request is added to make a literal "version known, commit pending" state exist.
- Assumption (unusable commit): the backend reports the sentinel `unknown` when `BUILD_COMMIT` is unset or blank (`backend/app/core/config.py`), which is the default on every local run and in CI. `unknown` is exactly 7 characters, so a naive `slice(0, 7)` would render `(unknown)` as if it were a commit. The footer treats `unknown`, an empty string, a missing `commit` field (a backend older than TEST-09) and a non-string `commit` as "no commit" and renders the version alone. This mirrors TEST-08's handling of the version sentinel.
- Assumption (commit without a version): the commit is shown only next to a resolved version, because criterion 1 places it "next to the version". If the version is unresolved (`unknown` or empty), the footer stays `Task Notes`, as TEST-08 decided, and the commit is not shown.
- Assumption (display format): `Task Notes v0.1.0 (abc1234)`, the short commit in parentheses after the version, in its own element `data-testid="app-footer-commit"`. The description fixes no format; parentheses keep it visually subordinate to the version without adding styling.
- Assumption (no 7-character hex validation): the commit is truncated, not validated. Validating hex is not asked for and the backend already controls the value.
- Scheduling note: `frontend/src/components/LandingPage.tsx` is not modified. `frontend/src/components/LandingPage.test.tsx` is modified, because its `getBackendVersion` mock resolves a string and the client now resolves an object; this test file is the one overlap with BUG-04 (see shared_risks.md).

## Plan Overview
Frontend only. The version client `frontend/src/api/version.ts` returns the whole version response (`version` plus an optional `commit`) instead of the version string alone, tolerating a response without a usable commit. `AppFooter` keeps its single mount-time fetch and adds a short-commit element after the version when the response carries a real commit. The component tests, the version client tests and the LandingPage footer test are updated for the new return shape, one E2E spec is added for the landing page, the TEST-08 E2E spec's exact-text assertion against the real backend is widened to allow the commit suffix, and `docs/DEVELOPMENT.md`'s footer paragraph is updated to describe the commit.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): `VersionResponse` becomes `{ version: string; commit?: string }`. `getBackendVersion(): Promise<VersionResponse>` keeps its URL and its two error paths unchanged (non-OK status throws `Loading the version failed: {status} {statusText}`; a body without a string `version` throws `Loading the version failed: unexpected response body`). It returns `{ version: body.version, commit }` where `commit` is `body.commit` when that is a string and `undefined` otherwise, so an older backend or a malformed `commit` never turns a usable version into a failure.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `versionInfo: { version: string; commit: string | null } | null`, initial `null`. On resolve, set it only when `version` is non-empty and not `unknown` (TEST-08's rule, unchanged); compute `commit` with a module-level pure helper `toShortCommit(commit?: string): string | null` that returns `null` for `undefined`, an empty string or `unknown` (constant `UNRESOLVED_COMMIT = "unknown"`, the backend's own sentinel), and otherwise `commit.slice(0, SHORT_COMMIT_LENGTH)` with `SHORT_COMMIT_LENGTH = 7`. Rendering: `{APP_NAME}` always; when `versionInfo` is set, `<span data-testid="app-footer-version"> v{version}</span>`; when its `commit` is non-null as well, `<span data-testid="app-footer-commit"> ({commit})</span>` after the version span. Rejection still leaves state `null`. The footer keeps `data-testid="app-footer"`, its `contentinfo` role and its style.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local `useState` plus `useEffect` in `AppFooter`, as TEST-08 built it. No new request.
- Rendered states, exactly:
  - pending: `Task Notes`
  - request failed (network, non-OK, bad body): `Task Notes`
  - version `unknown` or empty: `Task Notes`
  - version resolved, commit missing, empty or `unknown`: `Task Notes v0.1.0`
  - version resolved, commit `abc1234def56`: `Task Notes v0.1.0 (abc1234)`
  - never `undefined`, `null`, `()`, `(unknown)` or an error message.
- Design reference notes: AI freestyle. The existing footer style is kept unchanged (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`); the commit span inherits it.

## Backend Plan
No backend changes required. `GET /api/version` already returns `{"version": ..., "commit": ...}` (TEST-09: `backend/app/schemas/version.py`, `backend/app/services/version_service.py`, `backend/app/routers/version.py`), with `commit` truncated to 12 characters and `unknown` when `BUILD_COMMIT` is unset or blank (`backend/app/core/config.py`).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version` (existing, TEST-05 and TEST-09)
- Request: none
- Response: 200, `{"version": "0.1.0", "commit": "abc1234def56"}`. `commit` is at most 12 characters, or `"unknown"` when the build commit is not set. A response without `commit` (a backend older than TEST-09) is still accepted by the client.
- Client return value: `{ version: "0.1.0", commit: "abc1234def56" }`, or `{ version: "0.1.0", commit: undefined }` when the field is absent or not a string.

## Technology Selection
- Short commit: chose `String.prototype.slice(0, 7)` (standard library) over any formatting dependency, because truncation is one call.
- Commit state in the footer: chose extending the existing `useState` in `AppFooter` (React, installed) over a second request or a data-fetching library, because the commit arrives in the response the footer already fetches.
- `e2e/tests/TEST-10_footer_build_commit.spec.ts`: chose Playwright's built-in `page.route(...).fulfill` (installed) over setting `BUILD_COMMIT` on the running stack, because the E2E stack and CI run with the commit unset and a stubbed response is deterministic.
- No new component, module or dependency is added beyond the spec file.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: with `**/api/version` fulfilled as version `9.9.9` and commit `abc1234def56`, the footer on `/` reads `Task Notes v9.9.9 (abc1234)`; edge case: with commit `unknown`, the footer reads `Task Notes v9.9.9` and `app-footer-commit` is absent
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the `unknown` commit edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: the copy of the manual UAT script build-feature writes

### Modified files
- [A] frontend/src/api/version.ts: `VersionResponse` gains optional `commit`; `getBackendVersion()` returns the response object, keeping `commit` only when it is a string
- [A] frontend/src/api/version.test.ts: assert the returned object with commit; commit `undefined` when the field is missing; commit `undefined` when it is not a string while the version still resolves; existing error and base-URL tests updated to the object return
- [A] frontend/src/components/AppFooter.tsx: add `toShortCommit` and the `app-footer-commit` span after the version, shown only with a resolved version and a usable commit
- [A] frontend/src/components/AppFooter.test.tsx: success with commit (`Task Notes v9.9.9 (abc1234)`), pending (`Task Notes`, no commit element), failure (`Task Notes`, no commit element), commit `unknown`, commit missing, version `unknown` with a real commit; keep the landmark test
- [A] frontend/src/components/LandingPage.test.tsx: the `getBackendVersion` mock resolves `{ version: "9.9.9", commit: "abc1234def56" }` and the footer assertion expects `Task Notes v9.9.9 (abc1234)`
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the first test's exact `Task Notes v{backendVersion}` against the real backend tolerates an optional ` (xxxxxxx)` suffix, so a stack started with `BUILD_COMMIT` set does not fail it
- [Docs] docs/DEVELOPMENT.md: the footer paragraph also describes the short commit, its format, and when it is omitted (unset `BUILD_COMMIT` reports `unknown`)

No dependency changes, so no lockfile is regenerated. `README.md` needs no edit: it carries no footer description, and this item changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: `version.ts` client with `fetch` stubbed (commit present, missing, non-string; existing errors); `AppFooter` with `../api/version` mocked for success with commit, pending, failure, commit `unknown`, commit missing and version `unknown`; `LandingPage` footer assertion with the client mocked.
  - Directory: colocated `frontend/src/**/*.test.ts(x)` (Vitest), the frontend's existing convention
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`
- Integration tests: no new ones. No backend file changes, and `GET /api/version`'s `commit` field is covered by TEST-09's integration tests.
  - Directory: backend/tests/integration/
- E2E tests: on `/` with `**/api/version` fulfilled (version `9.9.9`, commit `abc1234def56`, with `access-control-allow-origin: *` as TEST-08's spec does), the footer reads `Task Notes v9.9.9 (abc1234)`; edge case: commit `unknown` gives `Task Notes v9.9.9` with no `app-footer-commit`. TEST-08's real-backend assertion is widened to allow the suffix.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the `unknown` commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: it is component rendering under a pending, rejected, `unknown` or missing commit result, which `AppFooter.test.tsx` controls exactly and a browser cannot hold pending deterministically |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test in `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | Stub `**/api/version` with version `9.9.9` and commit `abc1234def56`, go to `/`, expect `app-footer` to read `Task Notes v9.9.9 (abc1234)` and `app-footer-commit` to read `(abc1234)` | Given the backend runs with BUILD_COMMIT abc1234def5678, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (abc1234)" |
| 2 | Pending or failed request shows the version alone | covered at Unit, see Criterion coverage (the edge-case E2E stubs commit `unknown`) | Given the backend runs without BUILD_COMMIT, When I open the landing page, Then the footer reads "Task Notes v0.1.0" with no commit |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: from the repository root, run `BUILD_COMMIT=abc1234def5678 docker compose up -d --build`; the db, backend and frontend services are up.
1. Open `http://localhost:8010/api/version` in a browser → the page shows `{"version":"0.1.0","commit":"abc1234def56"}`.
2. Open `http://localhost:5183/` → the landing page shows the heading "Task Notes".
3. Read the footer at the bottom of the page → it reads exactly `Task Notes v0.1.0 (abc1234)`: seven commit characters, in parentheses, after the version.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone
Prerequisites: the stack from Criterion 1 is running.
1. Run `docker compose up -d --build backend` without `BUILD_COMMIT` set, then open `http://localhost:8010/api/version` → it shows `"commit":"unknown"`.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`: no parentheses, no `unknown`, no `undefined`.
3. Open DevTools, Network tab, set throttling to "Offline", reload the page → the footer reads exactly `Task Notes`, with no error text, no `undefined` and no empty parentheses.
4. Set throttling back to "No throttling", run `docker compose stop backend`, reload the page → the footer reads exactly `Task Notes`.
5. Run `docker compose start backend` and reload → the footer reads `Task Notes v0.1.0` again.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run lists the success-with-commit, pending and failure tests and reports `0 failed`.
2. Run `npm --prefix frontend test -- src/api/version.test.ts src/components/LandingPage.test.tsx` → `0 failed`.
