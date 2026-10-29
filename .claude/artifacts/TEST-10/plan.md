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
- Comment (tracker): 14 comments read on ClickUp task 123k99cwybm, all PR-opened notes from earlier runs → not acted on because none carries a correction or amendment to the feature text (recorded in `.claude/artifacts/TEST-10/decisions.md`).
- Merged since the last plan: n/a (fresh plan in the primary checkout, base 3761feee721597797dfabfd75a08d12e7aea4a23, which already contains TEST-08 #386 and TEST-09 #385).
- Assumption (ambiguity, no comment to resolve it): the version and the commit arrive in the same `GET /api/version` response, so "the version alone" while pending or on failure means exactly what TEST-08 renders in those states (the app name alone, since no version is known yet either). No commit fragment, no `undefined`, no error text is ever rendered.
- Assumption: the backend's `unknown` sentinel (`backend/app/core/config.py`, BUILD_COMMIT unset) and a missing, blank or non-string `commit` are not a commit, so the footer renders the version alone for them, never `(unknown)`. This mirrors TEST-08's existing handling of the `unknown` version sentinel in `frontend/src/api/version.ts`.
- Assumption: the commit renders only next to a version (the criterion says "next to the version"); with no usable version the footer shows the name alone even if a commit was returned.
- Assumption: the backend already truncates to 12 characters (`COMMIT_LENGTH = 12` in `backend/app/services/version_service.py`); the frontend takes the first 7 of whatever it receives, so a shorter value is shown whole.

## Plan Overview
Frontend-only change to the footer TEST-08 built. The version API client (`frontend/src/api/version.ts`) stops returning a bare version string and returns both fields TEST-09's endpoint now serves, `{ version, commit }`, each normalised to `string | null` with the same rules (trimmed, blank or `unknown` becomes null). `AppFooter.tsx` keeps one request on mount and renders, after the existing ` v{version}` span, a ` ({first 7 chars of commit})` span carrying `data-testid="app-footer-commit"` when both values are usable. Loading and failure keep TEST-08's rendering. No backend, no route, no dependency change.

Because the client's return shape changes, every `vi.mock("../api/version")` that resolves a bare string must resolve the new object: `AppFooter.test.tsx` (rewritten for the new paths anyway) and `frontend/src/components/LandingPage.test.tsx` (one mock value in its `beforeEach`). The latter is the file BUG-04 may also touch; see `shared_risks.md`. It is listed because it is genuinely needed: a vitest module mock that lacks a new export, or resolves the old string shape, fails that test, so neither a second exported function nor a second module avoids the edit.

## Frontend Plan
- Components to create/modify: `frontend/src/api/version.ts` (client return shape `BackendVersion = { version: string | null; commit: string | null }`; keeps the exported name `fetchBackendVersion` and its reject-on-network-error and reject-on-non-OK behaviour; a shared normaliser applies TEST-08's trim/blank/`unknown` rules to both fields). `frontend/src/components/AppFooter.tsx` (state becomes `BackendVersion | null`; renders `<span data-testid="app-footer-version"> v{version}</span>` as today, then `<span data-testid="app-footer-commit"> ({commit.slice(0, SHORT_COMMIT_LENGTH)})</span>` with `SHORT_COMMIT_LENGTH = 7` only when version and commit are both non-null).
- Routes: none.
- State management: local `useState` in `AppFooter`, unchanged pattern (mount effect, `isMounted` guard, catch sets null).
- Design reference notes: AI freestyle. The commit span inherits the footer's existing inline style (0.875rem, #5f5f5f); no new style values.

## Backend Plan
No backend changes required. TEST-09 already serves `commit` (12 characters, or `unknown`) on `GET /api/version`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (via `API_BASE_URL` from `frontend/src/api/config.ts`, unchanged)
- Request: none
- Response (existing, from TEST-09): `{"version": "0.1.0", "commit": "3761feee7215"}`; `commit` is `"unknown"` when BUILD_COMMIT is unset.
- Client result (new): `{ version: "0.1.0", commit: "3761feee7215" }`, either field null when missing, non-string, blank or `unknown`; a null body yields `{ version: null, commit: null }`. Rejects on network error and on non-OK status (message unchanged: `Loading the version failed: {status} {statusText}`).
- Rendered footer text on success: `Task Notes v0.1.0 (3761fee)`.

## Technology Selection
- Short commit: chose `String.prototype.slice(0, 7)` (standard library) over any formatting helper or dependency, because one call covers it.
- No net-new component, module or dependency: the change edits the existing client and footer, with the already-installed Vitest and Testing Library for tests.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (backend reports `unknown`)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }` normalised to `string | null` each
- [A] frontend/src/api/version.test.ts: assert the object shape; commit read, trimmed, and null for missing, blank, non-string, `unknown`, null body; existing reject cases kept
- [A] frontend/src/components/AppFooter.tsx: render the 7-character commit span next to the version
- [A] frontend/src/components/AppFooter.test.tsx: success (12-char commit renders 7), pending, failure, commit unknown/null, version null with commit present; mocks resolve the new shape
- [A] frontend/src/components/LandingPage.test.tsx: `beforeEach` mock of `fetchBackendVersion` resolves `{ version: BACKEND_VERSION, commit: null }` instead of the bare string; no other change

No dependency change, so no lockfile entry. No project structure, run configuration, dependency or test-infrastructure change, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: Vitest component and client tests (frontend). `AppFooter.test.tsx` covers success, pending, failure and the sentinel/null paths with `fetchBackendVersion` mocked; `version.test.ts` covers the client's parsing with `fetch` stubbed.
  - Directory: co-located with the code under `frontend/src/` (existing frontend convention; `backend/tests/unit/` is the backend's)
  - Naming: `{Module}.test.ts(x)` (existing frontend convention)
- Integration tests: not warranted. No repository, model, migration or endpoint changes (`GET /api/version` is TEST-09's and its integration tests stand).
  - Directory: backend/tests/integration/ (untouched)
- E2E tests: not warranted. No criterion requires navigation or interaction (see Criterion coverage). The existing `e2e/tests/TEST-08_footer_app_version.spec.ts` asserts the exact footer text `Task Notes v{version}`; it keeps passing because CI's stack leaves BUILD_COMMIT unset (backend answers `unknown`, footer renders the version alone). The build's Phase D smoke must run it with BUILD_COMMIT unset; see `shared_risks.md`.
  - Directory: e2e/tests/
  - File: none for TEST-10
- UAT scenarios: footer with commit, footer while pending/failed, footer when the backend reports `unknown`.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | Unit | Verifying it needs no navigation or interaction: it is a render of a fetched value, covered by `AppFooter.test.tsx` (mocked client) plus `version.test.ts` (client reads `commit` from the response body) |
| 2 | While pending or on failure, the footer shows the version alone, never `undefined` or an error | Unit | Pending and failure are only deterministic with a mocked client; no navigation or interaction is involved |
| 3 | A component test covers the success, pending and failure paths | Unit | The criterion is itself the component test in `frontend/src/components/AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows first 7 commit characters next to the version | covered at Unit, see Criterion coverage | Given the backend reports version 0.1.0 and commit 3761feee7215, When the landing page loads, Then the footer reads "Task Notes v0.1.0 (3761fee)" |
| 2 | Pending or failed: version alone, never undefined or an error | covered at Unit, see Criterion coverage | Given /api/version is unreachable, When the landing page loads, Then the footer reads "Task Notes" and contains no "undefined", "null", "unknown" or error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When AppFooter.test.tsx runs, Then 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: the stack started from the repo root with `BUILD_COMMIT=3761feee721597797dfabfd75a08d12e7aea4a23 docker compose up -d --build`; note the `[project] version` in `backend/pyproject.toml` (written `{V}` below).
1. Open `http://localhost:8010/api/version` in the browser → the JSON shows `"version": "{V}"` and `"commit": "3761feee7215"`.
2. Open `http://localhost:5183/` → the footer at the bottom of the landing page reads `Task Notes v{V} (3761fee)`: exactly 7 commit characters, in parentheses, after the version.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: same stack as Criterion 1, browser DevTools open on `http://localhost:5183/`.
1. In DevTools → Network, right-click the `version` request → Block request URL, then reload the page → the footer reads `Task Notes` only; no `undefined`, `null`, `unknown`, error message or empty parentheses appear.
2. Unblock the URL, set Network throttling to `Slow 3G`, reload and watch the footer before the `version` request completes → it reads `Task Notes` only, then changes to `Task Notes v{V} (3761fee)` when the request finishes.
3. Restart the stack without the variable: `docker compose down`, then `docker compose up -d --build` with BUILD_COMMIT unset; reload `http://localhost:5183/` → `/api/version` shows `"commit": "unknown"` and the footer reads `Task Notes v{V}`, with no `(unknown)`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repo root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` → `0 failed`, and the listed test names include a success case showing the 7-character commit, a pending case and a failure case.
2. Run `npm --prefix frontend test` → `0 failed` (covers `src/api/version.test.ts` and `src/components/LandingPage.test.tsx` with the new client shape).
