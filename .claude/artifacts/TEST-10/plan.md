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
- [ ] The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): all 33 comments on the item are the framework's own "PR opened" notices from earlier runs → Addressed by: not acted on because none carries feedback on scope or behaviour.
- Assumption (criterion 2, "the version alone"): `GET /api/version` returns the version and the commit in one response, so while that request is pending or after it fails the version is not known either. The footer then shows exactly what TEST-08 shows in those states, the app name `Task Notes` with no version, no commit, no `undefined`, no error text. "The version alone" is read as "nothing commit-related is added": the commit part is never rendered unless the version part is.
- Assumption (commit absent): when the response carries a version but the commit is the backend's `unknown` sentinel (TEST-09's `UNKNOWN_COMMIT`, the value whenever `BUILD_COMMIT` is unset, which is the case in CI and in a plain `docker compose up`), or is missing, empty or not a string, the footer shows the version alone (`Task Notes v0.1.0`). A malformed commit never rejects the request, because the version in the same body is still valid.
- Assumption (display format): the short commit is rendered in parentheses after the version, `Task Notes v0.1.0 (0123456)`. The item says only "next to the version"; Design Reference mode is NONE.
- Assumption (shortening): the backend already shortens to 12 characters (`COMMIT_LENGTH` in `backend/app/services/version_service.py`); the frontend takes the first 7 characters of whatever it receives, and a commit shorter than 7 characters is shown as is.
- Assumption (version unknown): when the backend reports `version: "unknown"` the client still resolves to no version (TEST-08 behaviour, unchanged), and the commit is not shown either, since it is defined as sitting next to the version.

## Plan Overview
Frontend-only change. The existing version API client (`frontend/src/api/version.ts`, TEST-08) is extended to read the `commit` field TEST-09 added to `GET /api/version`, and to return the version together with the 7-character short commit. `AppFooter` renders ` (shortCommit)` after ` v{version}` when both are present. No backend, no new dependency, no new route, no new component.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `fetchBackendVersion()` keeps its name, URL and its rejection rules (non-OK status, network error, missing or non-string or empty `version`), and changes its resolved value from `string | null` to `BackendVersion | null`, where `type BackendVersion = { version: string; shortCommit: string | null }`. It resolves `null` when `version` is the `unknown` sentinel (unchanged). `shortCommit` is `commit.slice(0, 7)` when `commit` is a non-empty string other than the backend's `unknown` sentinel, else `null`. Add `const BACKEND_UNKNOWN_COMMIT = "unknown"` with a comment naming its counterpart `UNKNOWN_COMMIT` in `backend/app/services/version_service.py`, and `const SHORT_COMMIT_LENGTH = 7`. Update the `VersionResponse` type to `{ version: string; commit?: unknown }` (the commit is validated, not trusted) and the doc comment.
  - `frontend/src/components/AppFooter.tsx`: hold `BackendVersion | null` in state instead of a string; render `Task Notes`, then ` v{version}` when a version is known, then ` ({shortCommit})` when `shortCommit` is non-null. Keep the `data-testid="app-footer"`, the `<footer>` landmark, the existing `footerStyle`, the mount-once fetch, the `isMounted` guard and the silent catch.
  - `frontend/src/components/LandingPage.test.tsx`: the module mock's resolved value changes from `"9.9.9"` to `{ version: "9.9.9", shortCommit: null }` so its existing footer assertion keeps passing against the new return shape. No new test cases there.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (unchanged, delivered by TEST-09, read from `${API_BASE_URL}/api/version` as today)
- Request: none
- Response: `{"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is `"unknown"` when `BUILD_COMMIT` is unset, and `version` is `"unknown"` when package metadata is missing.
- Frontend client contract: `fetchBackendVersion(): Promise<BackendVersion | null>`; for the body above it resolves `{ version: "0.1.0", shortCommit: "0123456" }`; for `{"version": "0.1.0", "commit": "unknown"}` it resolves `{ version: "0.1.0", shortCommit: null }`; for `{"version": "unknown", "commit": "0123456789ab"}` it resolves `null`.

## Technology Selection
- Short-commit derivation: chose the standard `String.prototype.slice(0, 7)` over any formatting helper or dependency, because the standard library covers it fully.
- No net-new component, module or dependency otherwise: the feature extends the existing `version.ts` client and `AppFooter` component.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec for criterion 1 plus the commit-absent edge case
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/version.ts: read and shorten `commit`, return `BackendVersion | null`
- [A] frontend/src/api/version.test.ts: cover shortCommit derivation, the commit sentinel, missing and malformed commit, and the unchanged rejection paths
- [A] frontend/src/components/AppFooter.tsx: render the short commit after the version
- [A] frontend/src/components/AppFooter.test.tsx: success, pending and failure paths with the new shape, plus commit-absent
- [A] frontend/src/components/LandingPage.test.tsx: update the mocked resolved value to the new return shape
No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes (`BUILD_COMMIT` is already documented by TEST-09).

## Testing Strategy
- Unit tests: Vitest, frontend.
  - `frontend/src/api/version.test.ts`: resolves `{version, shortCommit}` with a 12-char commit shortened to 7; `shortCommit` null for `commit: "unknown"`, for a missing commit, for an empty commit and for a non-string commit; a commit shorter than 7 characters returned whole; `null` when `version` is `"unknown"` even with a commit; the existing non-OK, network-error, malformed-version and `VITE_API_BASE_URL` cases kept (the "ignores additional fields" case is rewritten, since `commit` is no longer ignored).
  - `frontend/src/components/AppFooter.test.tsx` (the component test criterion 3 asks for): success renders exactly `Task Notes v9.9.9 (0123456)`; pending (never-settling promise) renders exactly `Task Notes`; failure (rejected promise) renders exactly `Task Notes`; version known with `shortCommit: null` renders exactly `Task Notes v9.9.9`; client resolving `null` renders exactly `Task Notes`; every non-success case asserts no `undefined`, `null`, `unknown`, `(`, or `Error` text. Existing landmark and call-once tests kept with the new shape.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (the frontend's existing convention; CLAUDE.md's unit directory and naming are the backend's)
  - Naming: `{Module}.test.ts(x)`, as the existing files
- Integration tests: not warranted. No repository, model, migration or endpoint changes (`testing_standards.md` Section 6); TEST-09 already covers `GET /api/version` at integration level.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one spec. Test 1 loads `/` with `page.route("**/api/version", ...)` forwarding the request to the real backend through `route.fetch()` and fulfilling with the real body whose `commit` is replaced by `0123456789ab`, then asserts the footer reads exactly `Task Notes v{real version} (0123456)`; this keeps the real browser-to-backend path (base URL, CORS) while making the commit deterministic, since CI starts the stack without `BUILD_COMMIT`. Test 2 (edge case) does the same with `commit: "unknown"` and asserts `Task Notes v{real version}` with no parentheses.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the commit-unknown edge case.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added. | E2E (plus Unit in `version.test.ts` and `AppFooter.test.tsx`) | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. | Unit (`AppFooter.test.tsx`) | verifying it needs no navigation or interaction: the pending and failed states are deterministic only with a controlled client promise, and TEST-08's E2E spec already covers the unreachable-endpoint footer in the browser |
| 3 | A component test covers the success, pending and failure paths. | Unit (`AppFooter.test.tsx`) | the criterion is the component test itself, so the unit tier is its only possible tier |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-char commit next to the version | Load `/`, fulfill `/api/version` with the real body and `commit` `0123456789ab`, assert footer text `Task Notes v{version} (0123456)` | Given the backend reports commit `0123456789ab` When I open the landing page Then the footer reads `Task Notes v0.1.0 (0123456)` |
| 2 | Pending or failed request shows no commit and no error | covered at Unit, see Criterion coverage | Given the version endpoint is unreachable When I open the landing page Then the footer reads `Task Notes` with no `undefined` or error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter component test Then it reports 0 failed and lists the success, pending and failure cases |
| edge | Commit unknown shows version alone | Fulfill with `commit` `unknown`, assert `Task Notes v{version}` | Given the backend has no build commit When I open the landing page Then the footer reads `Task Notes v0.1.0` |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
Prerequisites: Docker running; from the repository root the stack is started with a known build commit, `BUILD_COMMIT=0123456789abcdef docker compose up -d --build`; frontend on `http://localhost:5183`, backend on `http://localhost:8010`.
1. Open `http://localhost:8010/api/version` in a browser → the body reads `{"version":"0.1.0","commit":"0123456789ab"}` (the version is whatever `backend/pyproject.toml` declares).
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading, the note form and the footer at the bottom.
3. Read the footer text → it reads exactly `Task Notes v0.1.0 (0123456)`: the version from step 1 followed by the first 7 characters of its commit in parentheses.
4. Run `docker compose up -d backend` from the repository root without `BUILD_COMMIT` set, wait until `http://localhost:8010/api/version` shows `"commit":"unknown"`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown`.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
Prerequisites: the stack from Criterion 1 is running with `BUILD_COMMIT=0123456789abcdef`.
1. Open `http://localhost:5183/`, open devtools Network, set throttling to "Slow 3G" and reload → while `GET /api/version` is still pending the footer reads exactly `Task Notes`, with no `undefined`, no `(`, no spinner and no error text.
2. Wait for the request to finish → the footer changes to `Task Notes v0.1.0 (0123456)`.
3. Remove the throttling, then in devtools Network right-click the `/api/version` request and choose "Block request URL", and reload → the footer reads exactly `Task Notes`, with no `undefined`, no `null`, no `(` and no error message anywhere on the page.
4. Unblock the URL and reload → the footer reads `Task Notes v0.1.0 (0123456)` again.

### Criterion 3: A component test covers the success, pending and failure paths.
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → `0 failed`.
2. Read the AppFooter test names in the output → there is a success case showing the short commit, a pending case and a failure case, each passing.
