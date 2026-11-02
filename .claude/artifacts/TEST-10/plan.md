# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What:** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria:**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes:** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 20 comments read, all mayker-dev notices from earlier runs → not acted on because none carries a requirement or a correction to the description; nothing overrides the ticket text.
- Assumption (criterion 2, recorded rather than blocking): version and commit arrive in the **same** `GET /api/version` response (TEST-09), so when that request is pending or fails there is no version to show either. TEST-08's merged contract for that state is exactly `Task Notes`. This plan reads "the version alone" as "everything TEST-08 already shows, with no commit suffix": pending or failed request → `Task Notes`; request succeeds with a version but no usable commit (`unknown`, empty, missing, not a string) → `Task Notes v0.1.0`. Never `undefined`, `null`, `unknown`, an error text, empty parentheses or a trailing space. A second, separate request was rejected: it would add a request and a state machine for no criterion.
- Assumption (display format): `Task Notes v{version} ({commit7})`, for example `Task Notes v0.1.0 (a1b2c3d)`. Chosen because `docs/DEVELOPMENT.md` line 668 on main already documents exactly this format and these fallbacks; matching it keeps that paragraph true without an edit.
- Assumption (truncation): the backend already returns at most 12 characters (TEST-09, `SHORT_COMMIT_LENGTH = 12`); the frontend takes the first 7 of the trimmed value. A commit shorter than 7 characters is shown as it is.
- Assumption (backend `unknown` sentinel for commit): `DEFAULT_BUILD_COMMIT = "unknown"` in `backend/app/core/config.py` means "no commit known", so it is treated like a missing commit (version alone), the same rule TEST-08 applied to the version's sentinel.
- Merged since the last plan: n/a (fresh plan, branched from current main 4564310, which already contains TEST-08 #487 and TEST-09 #486).

## Plan Overview
Frontend-only change. `frontend/src/api/version.ts` keeps its single request to `GET /api/version` but now returns both fields: `fetchAppVersion()` resolves to `{ version, commit }` (commit already cut to 7 characters, or `null` when unusable) or to `null` when the version itself is unresolved, exactly as today. `AppFooter.tsx` stores that object and appends ` ({commit})` after ` v{version}` only when both are present. Tests that mock the client's old `string | null` return shape (`AppFooter.test.tsx`, `LandingPage.test.tsx`) are updated, and TEST-08's first E2E test, which asserts the footer's exact text against the live response, is made to expect the commit suffix when the live response carries one. No backend file changes: TEST-09 already returns `commit`. `LandingPage.tsx` is not modified.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): `VersionResponse` becomes `{ version: string; commit: string }` (the backend schema). Add exported type `AppVersion = { version: string; commit: string | null }` and constants `SHORT_COMMIT_LENGTH = 7` and reuse `UNRESOLVED_VERSION = "unknown"` for the commit sentinel too. `fetchAppVersion(): Promise<AppVersion | null>`: non-OK response throws as today; version unresolved (not a string, empty after trim, or `unknown`) returns `null` as today; otherwise returns `{ version, commit }` where `commit` is the trimmed `body.commit` cut to its first 7 characters, or `null` when `body.commit` is not a string, empty after trim, or `unknown`. No `any`; still one request.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `AppVersion | null` (still `null` for loading and failure); render `{APP_NAME}`, then ` v{appVersion.version}` when `appVersion` is non-null, then ` ({appVersion.commit})` when `appVersion.commit` is non-null. Keep `data-testid="app-footer"`, the `<footer>` element, `footerStyle` and the `isMounted` guard unchanged. The commit sits in the same text node flow as the version (no new element), so the footer's text content is exactly `Task Notes v0.1.0 (a1b2c3d)`.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local component state in `AppFooter` only, unchanged in shape apart from the value type.
- Design reference notes: AI freestyle (Design Reference mode NONE); the existing footer style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`) is kept unchanged and the commit uses the same style.

## Backend Plan
No backend changes required. `GET /api/version` already returns `{"version": ..., "commit": ...}` from TEST-09 (`backend/app/routers/version.py`, `backend/app/schemas/version.py`, `get_build_commit()` in `backend/app/services/version_service.py`, at most 12 characters, `unknown` when `BUILD_COMMIT` is unset or blank per `backend/app/core/config.py`). This item consumes it unchanged.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200 `{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}`; `commit` is `"unknown"` when `BUILD_COMMIT` is unset or blank. Existing contract from TEST-05 and TEST-09, unchanged. Frontend mapping: `{ version: "0.1.0", commit: "a1b2c3d" }`, or `{ version: "0.1.0", commit: null }` for an unusable commit, or `null` for an unresolved version.

## Technology Selection
- No net-new component, module or dependency: the commit is read from the existing `fetch`-based client in `frontend/src/api/version.ts` and rendered by the existing `AppFooter`; truncation is the standard `String.prototype.slice`. Nothing is installed, so no lockfile changes.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: E2E spec: stubbed response with a 12-character commit shows `Task Notes v0.1.0 (a1b2c3d)`; stubbed `unknown` commit shows `Task Notes v0.1.0`; aborted request shows `Task Notes`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the unknown-commit edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `AppVersion | null` with the commit cut to 7 characters or null when unusable
- [A] frontend/src/api/version.test.ts: assert the `{ version, commit }` shape, the 7-character cut from a 12-character commit, a short commit kept whole, and null commit for `unknown`, empty, missing and non-string values; existing version and non-OK cases updated to the new shape
- [A] frontend/src/components/AppFooter.tsx: append ` ({commit})` after the version when both are present
- [A] frontend/src/components/AppFooter.test.tsx: success path with commit, success path without commit, pending path and failure path, all asserting exact text content
- [A] frontend/src/components/LandingPage.test.tsx: mock `fetchAppVersion` with the new `{ version, commit }` shape
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the live-response test expects the commit suffix when the live response carries a usable commit, so it stays true when `BUILD_COMMIT` is set

No dependency is added or changed, so no lockfile is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure, and `docs/DEVELOPMENT.md` line 668 already describes the footer this plan builds (format `Task Notes v0.1.0 (a1b2c3d)`, version alone for a missing, empty or `unknown` commit, `Task Notes` on failure). If the build changes that behaviour, that line is the one to correct.

## Testing Strategy
- Unit tests: `frontend/src/api/version.test.ts` (fetch stubbed, as today): `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}` resolves to `{ version: "0.1.0", commit: "a1b2c3d" }`; `"abc12"` stays `"abc12"`; `"unknown"`, `""`, missing and numeric commit resolve to `commit: null`; unresolved version still resolves to `null`; non-OK still throws. `frontend/src/components/AppFooter.test.tsx` (client mocked): success with commit has text content exactly `Task Notes v9.9.9 (a1b2c3d)`; success with `commit: null` exactly `Task Notes v9.9.9`; pending (never-settling promise) exactly `Task Notes`; rejected exactly `Task Notes`; null exactly `Task Notes`; none contains `undefined`, `null`, `unknown`, `Error` or `()`. `LandingPage.test.tsx` mock updated.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (the frontend's established Vitest convention; `CLAUDE.md`'s `backend/tests/unit/` applies to backend tests, and no backend test is added)
  - Naming: `{module}.test.ts(x)`, test names describe the scenario
- Integration tests: none added. The endpoint is unchanged; its `commit` field is already covered by TEST-09's backend integration tests.
  - Directory: `backend/tests/integration/`
- E2E tests: `e2e/tests/TEST-10_footer_build_commit.spec.ts`, routes matched on exact pathname `/api/version` (TEST-08's pitfall with Vite serving `src/api/version.ts`): (a) `page.route` fulfils `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}`, footer text is exactly `Task Notes v0.1.0 (a1b2c3d)`; (b) edge case: fulfils `{"version":"0.1.0","commit":"unknown"}`, footer is exactly `Task Notes v0.1.0`; (c) `page.route` aborts, footer is exactly `Task Notes`. TEST-08's live-response test builds its expected text from the response's `version` and, when present and not `unknown`, the first 7 characters of `commit`.
  - Directory: `e2e/tests/`
  - File: `TEST-10_footer_build_commit.spec.ts`
- UAT scenarios: one Gherkin scenario per criterion plus the unknown-commit edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit next to the version | E2E | — |
| 2 | Pending or failed request shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: pending, rejected and unusable-commit are client and component states driven by mocks (the E2E abort and unknown-commit tests are the feature's edge-case specs) |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit | Stub `/api/version` with a 12-character commit, load `/`, assert exact text `Task Notes v0.1.0 (a1b2c3d)` | Given the backend reports commit a1b2c3d4e5f6 When I open the landing page Then the footer reads "Task Notes v0.1.0 (a1b2c3d)" |
| 2 | Pending or failed shows no commit and no error | covered at Unit, see Criterion coverage; E2E aborts the request and stubs an `unknown` commit | Given the backend reports no commit When I open the landing page Then the footer reads "Task Notes v0.1.0" with no parentheses, "undefined" or error text |
| 3 | Component test covers three paths | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter tests Then the success, pending and failure cases pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: from the repository root, start the stack with the commit set: `BUILD_COMMIT=a1b2c3d4e5f60718293a4b5c6d7e8f9012345678 docker compose up -d --build` in your own terminal (frontend on `http://localhost:5183`, backend on `http://localhost:8010`).
1. Open `http://localhost:8010/api/version` in the browser → the page shows `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}`.
2. Open `http://localhost:5183/` → the landing page with the "Task Notes" heading loads.
3. Scroll to the footer → it reads exactly `Task Notes v0.1.0 (a1b2c3d)`: the version, then the first 7 characters of the commit in parentheses.

### Criterion 2: While the request is pending or fails, the footer shows no commit and no error
Prerequisites: as Criterion 1.
1. In the browser's developer tools, Network tab, set throttling to "Slow 3G" and reload `http://localhost:5183/` → while the `/api/version` request is still pending, the footer reads exactly `Task Notes`, with no `undefined`, no `()` and no error text; once it completes it reads `Task Notes v0.1.0 (a1b2c3d)`. Set throttling back to "No throttling".
2. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no `undefined`, no `null`, no `unknown` and no error text.
3. Run `docker compose up -d backend` without `BUILD_COMMIT` set (unset it first in your terminal), wait until `http://localhost:8010/api/version` shows `{"version":"0.1.0","commit":"unknown"}`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` → the run lists the success-with-commit, success-without-commit, pending, rejected and null cases of `AppFooter.test.tsx` and the commit cases of `version.test.ts`, and reports `0 failed`.
