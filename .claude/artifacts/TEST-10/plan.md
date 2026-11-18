# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> The landing page footer shows the short build commit next to the version.
>
> Acceptance criteria (tracker text):
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> Notes (tracker text): Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates. Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 48 comments read at plan base c9f192a4, all framework PR notices from earlier runs (recorded in `.claude/artifacts/TEST-10/decisions.md`) → not acted on because none carries a requirement, correction or amendment to the feature text.
- Assumption (criterion 2, ambiguity in the feature text): the version and the commit arrive in ONE response from GET /api/version, so while that request is pending or after it fails there is no version to show either. TEST-08 already recorded those states as the footer reading exactly `Task Notes` (no version, no placeholder). This plan keeps TEST-08's recorded states unchanged and reads criterion 2 as "the commit adds nothing in those states": no commit, no `undefined`, no error text. The footer therefore shows the version alone in every state where the version is known and the commit is not (the commit field is missing, empty, not a string, or the backend's `unknown` sentinel), and `Task Notes` in every state where the version itself is unknown, exactly as TEST-08 decided. Replacing TEST-08's states with a second request or a cached version would be gold plating and would contradict a recorded decision.
- Assumption (display format, Design Reference mode NONE): the commit renders right after the version as ` (abcdef1)`, so a resolved footer reads `Task Notes v0.1.0 (abcdef1)`. It lives in its own `data-testid="app-commit"` span that is mounted only when a commit is shown, so "absent" is testable as an absent element, the same pattern TEST-08 used for `app-version`.
- Assumption (truncation): the backend already cuts BUILD_COMMIT to 12 characters (`COMMIT_LENGTH = 12` in `backend/app/services/version_service.py`); the frontend takes the first 7 of whatever it receives, and a commit shorter than 7 characters is shown as received. The backend is not changed (the item is frontend only).

## Plan Overview
Frontend-only diff. `frontend/src/api/version.ts` `getVersion()` starts reading the `commit` field TEST-09 added and returns `{ version, commit }` (commit `null` when absent or not a non-empty string; a bad commit never fails the call, because the version in the same body is still good). `AppFooter.tsx` stores that object and renders a `data-testid="app-commit"` span with the first 7 characters next to TEST-08's `app-version` span, only when the version is shown and the commit is a real value (not the backend's `unknown` sentinel). Every TEST-08 state stays as recorded. The two component test files that mock `getVersion` change their mocked value to the new object shape, and TEST-08's E2E spec's exact-text footer assertion is loosened so it holds when the backend runs with BUILD_COMMIT set. `frontend/src/components/LandingPage.tsx` is not modified.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): export `type VersionInfo = { version: string; commit: string | null }`; `getVersion(): Promise<VersionInfo>`. Error handling unchanged (non-OK status throws `Loading the version failed: {status} {statusText}`; a body without a non-empty string `version` throws `Unexpected version response`). `commit` is `body.commit` when it is a non-empty string, otherwise `null`. Add `export const UNKNOWN_BACKEND_COMMIT = "unknown"` with a comment naming `UNKNOWN_COMMIT` in `backend/app/core/config.py` as the value it mirrors (same pattern as `UNKNOWN_BACKEND_VERSION`). The client returns the commit as sent; the component decides display.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `useState<VersionInfo | null>(null)`; on resolve, store the info unless `info.version === UNKNOWN_BACKEND_VERSION` (TEST-08's rule, unchanged); on reject keep `null` (unchanged). Derive `shortCommit = info.commit && info.commit !== UNKNOWN_BACKEND_COMMIT ? info.commit.slice(0, COMMIT_DISPLAY_LENGTH) : null` with `const COMMIT_DISPLAY_LENGTH = 7` and a why-comment. Render `{APP_NAME}{info && <span data-testid="app-version"> v{info.version}</span>}{info && shortCommit && <span data-testid="app-commit"> ({shortCommit})</span>}`. `APP_NAME`, `footerStyle`, `data-testid="app-footer"` and the mounted guard unchanged.
- Routes: none.
- State management: local component state in `AppFooter` (`VersionInfo | null`), no shared store.
- Design reference notes: AI freestyle (Design Reference mode NONE). Keep TEST-08's footer style unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the commit span inherits it, no extra styling.

Footer text per state (the record criterion 2 is verified against):
  pending: `Task Notes`;
  failure (network error, non-2xx, body without a non-empty string version): `Task Notes`;
  backend version `unknown`: `Task Notes` (no commit either: the commit sits next to the version);
  version known, commit `unknown`, missing, empty or not a string: `Task Notes v0.1.0`;
  version known, commit `abcdef123456`: `Task Notes v0.1.0 (abcdef1)`.

## Backend Plan
No backend changes required. GET /api/version already returns `{"version", "commit"}` on main c9f192a4 (TEST-09: `backend/app/routers/version.py`, `backend/app/services/version_service.py`, `backend/app/schemas/version.py`, `backend/app/core/config.py`); this item consumes it and changes none of it.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version (existing, TEST-05 and TEST-09; consumed, not changed)
- Request: no body, no parameters
- Response: 200 with `{"version": "0.1.0", "commit": "3f9c2a7b1d4e"}`; `commit` is the first 12 characters of BUILD_COMMIT, `"unknown"` when BUILD_COMMIT is unset or blank; `version` is `"unknown"` when the backend's package metadata is not installed.
- Frontend handling: see the per-state footer text in `## Frontend Plan`.

## Technology Selection
- Reading the commit field: extends the existing native `fetch` client `frontend/src/api/version.ts`, no new module and no HTTP library, because the field arrives in the response the client already fetches.
- Short commit: `String.prototype.slice(0, 7)` from the language's standard library, over any formatting helper or dependency.
- Footer state: React's built-in `useState` and `useEffect` (already installed and already used by `AppFooter`), over a data-fetching dependency.
- No net-new component, module or dependency: no new dependency is added, so no lockfile changes.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: footer shows the 7-character commit next to the version; footer shows the version alone when the backend reports an unknown commit
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }` (`VersionInfo`), commit `null` when absent or not a non-empty string; add `UNKNOWN_BACKEND_COMMIT`
- [A] frontend/src/api/version.test.ts: assert the returned object, plus the null-commit cases
- [A] frontend/src/components/AppFooter.tsx: render the first 7 characters of the commit in an `app-commit` span next to the version; keep every TEST-08 state
- [A] frontend/src/components/AppFooter.test.tsx: mocked `getVersion` resolves the object shape; add success, pending, failure and unknown-commit commit tests
- [A] frontend/src/components/LandingPage.test.tsx: mocked `getVersion` resolves `{ version: "9.9.9", commit: null }` instead of a string (test-only, required by the new return type)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the footer assertion becomes `toContainText` instead of exact `toHaveText`, so it holds when the backend runs with BUILD_COMMIT set and the footer also shows a commit
`frontend/src/components/LandingPage.tsx` is deliberately not modified: `AppFooter` owns its fetch, so the landing page's `<AppFooter />` render is unchanged, which keeps this item off the file BUG-04 may touch.
No dependency is added or changed, so no lockfile is regenerated.
Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes (BUILD_COMMIT is already documented by TEST-09).

## Testing Strategy
- Unit tests: frontend component and client tests (Vitest, the project's frontend unit tier). `AppFooter.test.tsx` with `../api/version` mocked covers success (commit shown, 7 characters), pending, failure, unknown-commit and missing-commit paths; `version.test.ts` with `fetch` stubbed covers the object returned and the null-commit cases. No backend tests: no backend code changes.
  - Directory: beside their module under `frontend/src/` (project standards: tests beside their module)
  - Naming: `{Module}.test.tsx` / `{module}.test.ts`
- Integration tests: no new integration tests. The endpoint consumed is unchanged and already covered by `backend/tests/integration/test_version_integration.py`.
  - Directory: backend/tests/integration/
- E2E tests: criterion 1 in the browser on the landing page. BUILD_COMMIT is not set in the CI or default local backend, so the real backend answers `commit: "unknown"`; the spec therefore fulfils `**/api/version` with `page.route` and a JSON body (`{"version":"0.1.0","commit":"abcdef123456"}`), with an `Access-Control-Allow-Origin: *` header because the page at :5183 calls the backend origin at :8010 cross-origin, then expects the footer to read exactly `Task Notes v0.1.0 (abcdef1)`. Edge-case spec: fulfil with `"commit":"unknown"` and expect `Task Notes v0.1.0` and no `app-commit` element.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the unknown-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from GET /api/version, next to the version | E2E | `shows the short build commit next to the version in the footer`, `renders the first 7 characters of the commit next to the version` | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | `renders no commit while the version request is pending`, `renders no commit when the version request fails`, `renders the version alone when the backend reports an unknown commit`, `renders the version alone when the backend sends no commit` | verifying it needs no navigation or interaction: a pending or rejected promise and a sentinel commit are render branches, deterministic only with the client mocked |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the first 7 characters of the commit next to the version`, `renders no commit while the version request is pending`, `renders no commit when the version request fails` | the criterion is itself a requirement for component tests |

Client tests that support criteria 1 and 2 (also named so the builder writes them): `returns the version and commit the backend sent`, `returns a null commit when the body has no non-empty string commit`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | route-fulfil `/api/version` with commit `abcdef123456`, goto `/`, expect `app-commit` to have text ` (abcdef1)` and `app-footer` to have text `Task Notes v0.1.0 (abcdef1)` | Given the backend runs with BUILD_COMMIT `3f9c2a7b1d4e8f60a5b2c9d1e7f3a4b6c8d0e2f1`, When I open the landing page, Then the footer reads `Task Notes v0.1.0 (3f9c2a7)` |
| 2 | Pending or failed request: version alone, never `undefined` or an error | covered at Unit, see Criterion coverage; edge-case spec fulfils commit `unknown` and expects `Task Notes v0.1.0` | Given BUILD_COMMIT is unset, When I open the landing page, Then the footer reads `Task Notes v0.1.0` with no commit and no `undefined` |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then the success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker running; repository root as the terminal's working directory; `backend/pyproject.toml` `[project].version` is `0.1.0`.
1. Run `BUILD_COMMIT=3f9c2a7b1d4e8f60a5b2c9d1e7f3a4b6c8d0e2f1 docker compose up -d --build backend frontend` → the backend and frontend containers start.
2. Run `curl -s http://localhost:8010/api/version` → the body is `{"version":"0.1.0","commit":"3f9c2a7b1d4e"}`.
3. Open `http://localhost:5183/` in a browser and scroll to the footer → it reads exactly `Task Notes v0.1.0 (3f9c2a7)`: seven commit characters in parentheses, right after the version.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error
Prerequisites: as for Criterion 1, stack running with BUILD_COMMIT set.
1. In Chrome DevTools open the Network request blocking panel, add the pattern `*/api/version`, and reload `http://localhost:5183/` → the footer reads exactly `Task Notes` (TEST-08's failure state; there is no version to show because the single request failed): no commit, no `undefined`, no error text.
2. Remove the block, set Network throttling to `Slow 3G`, and reload → while `/api/version` is pending the footer reads `Task Notes` with no commit; once it completes it reads `Task Notes v0.1.0 (3f9c2a7)`. Reset throttling to `No throttling`.
3. Run `docker compose up -d backend` with BUILD_COMMIT unset (run `unset BUILD_COMMIT` first), then `curl -s http://localhost:8010/api/version` → `commit` is `"unknown"`.
4. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`: the version alone, no `(unknown)`, no `undefined`, no empty parentheses.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Check the run lists `renders the first 7 characters of the commit next to the version`, `renders no commit while the version request is pending` and `renders no commit when the version request fails` among the passed tests.
