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
- Comment (tracker): 24 comments on the ticket, all framework "PR opened" notes from earlier runs → Addressed by: not acted on because none carries feedback on scope, criteria or approach.
- Merged since the last plan: n/a (fresh plan; no previous TEST-10 plan existed). Both dependencies merged this run and are planned against as they stand on main 0515c74: TEST-09 (#547, `GET /api/version` returns `version` and `commit`, commit = first 12 chars of BUILD_COMMIT or `"unknown"`) and TEST-08 (#549, `AppFooter` fetches `/api/version` through `frontend/src/api/version.ts`).

## Plan Overview
Frontend-only change. The version API client (`frontend/src/api/version.ts`) currently returns only the version and explicitly ignores the `commit` field. It is changed to return both values, normalized, from the one request the footer already makes; `AppFooter` then renders the first 7 characters of the commit next to the version. No new request, no backend change, no new dependency.

Rendered result (success): `Task Notes v0.1.0 (0515c74)`, the commit in its own `<span data-testid="app-footer-commit">`, a sibling after the existing `app-footer-version` span.

Assumptions (ambiguities resolved without blocking, `user_story_alignment.md` Section 4):
1. Criterion 2 says "the version alone" while pending or failed, but the version comes from the same request, so while it is pending or failed there is no version either. The footer therefore keeps TEST-08's behaviour in those states, exactly `Task Notes`, and the commit is never rendered. "Version alone" is also the outcome whenever the request succeeds but the commit is unavailable: the backend's `"unknown"` sentinel (the default when BUILD_COMMIT is unset, i.e. local and CI), a blank string, a missing field or a non-string value. That case renders `Task Notes v0.1.0` with no commit and no empty parentheses.
2. The commit is shown only next to a version ("next to the version TEST-08 added"): if the version is unresolved (`"unknown"`/blank) but a commit is present, the footer shows `Task Notes` only.
3. Display format `v{version} ({first 7 chars})`, a parenthesized short hash, the conventional short-SHA length. A commit shorter than 7 characters is shown as is.
4. A missing or malformed `commit` field never makes the request count as failed: the version still shows (the client throws only on what it throws on today: a non-OK status or a body without a string `version`).
5. `frontend/src/components/LandingPage.test.tsx` must change: it mocks `../api/version` with a factory that provides only `getBackendVersion`, so once `AppFooter` calls the new client function the mocked module has no such export and every LandingPage test fails. The edit is limited to that mock (import line, the mock factory, the `BACKEND_VERSION` constant and the two `beforeEach` lines); no note-form or note-list test is touched. This is the one overlap with BUG-04 (see shared_risks.md).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: replace `getBackendVersion(): Promise<string | null>` with `getBackendBuildInfo(): Promise<BackendBuildInfo>`, exported type `BackendBuildInfo = { version: string | null; commit: string | null }`. Same single `fetch(VERSION_URL)`, same throws (non-OK status; body not an object with a string `version`). `version` normalization unchanged (trim; blank or `BACKEND_UNKNOWN_VERSION` gives null). `commit`: a string, trimmed, not blank and not `BACKEND_UNKNOWN_VERSION`, else null; returned unshortened (the backend sends 12 chars). The old `getBackendVersion` export is removed, as it would become dead code; update the module's doc comments (the "Other fields are ignored" line becomes false).
  - `frontend/src/components/AppFooter.tsx`: state becomes `BackendBuildInfo | null` (null = loading or failed, as today). Add `const SHORT_COMMIT_LENGTH = 7;`. Render the version span exactly as today when `version !== null`, and after it, only when both `version` and `commit` are non-null, `<span data-testid="app-footer-commit"> ({commit.slice(0, SHORT_COMMIT_LENGTH)})</span>`. Styling unchanged (inherits `footerStyle`).
- Routes: none.
- State management: local `useState` in `AppFooter`, unchanged pattern (mount-time effect with an `isMounted` guard).
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Consumed as merged by TEST-09; this item does not change it.
- Method: GET
- URL: `/api/version` (via `API_BASE_URL` from `frontend/src/api/apiBaseUrl.ts`)
- Request: none
- Response: 200, JSON with `version` (string) and `commit` (string, first 12 chars of BUILD_COMMIT, or `"unknown"`). Example: `{"version": "0.1.0", "commit": "0515c74d9e2f"}`
- Frontend client contract (new): `getBackendBuildInfo()` resolves `{ version: "0.1.0", commit: "0515c74d9e2f" }`; resolves `{ version: "0.1.0", commit: null }` for `"commit": "unknown"`, blank, missing or non-string; rejects on a non-OK status or a body with no string `version`.

## Technology Selection
- Commit shortening: chose `String.prototype.slice(0, 7)` (standard library) over any formatting helper or dependency; no alternative needed.
- Build info client: no net-new module; extends the existing `frontend/src/api/version.ts` client and the platform `fetch` it already uses, over a second request or a new client module.
- This feature introduces no net-new component and no dependency.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser specs for criterion 1 (short commit next to the version) and the edge case (commit `"unknown"` gives the version alone)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/version.ts: `getBackendVersion` replaced by `getBackendBuildInfo` returning normalized version and commit
- [A] frontend/src/api/version.test.ts: unit tests retargeted to `getBackendBuildInfo`, plus commit cases (present, `"unknown"`, blank, missing, non-string)
- [A] frontend/src/components/AppFooter.tsx: render the 7-character commit next to the version
- [A] frontend/src/components/AppFooter.test.tsx: component tests for success with commit, success without commit, pending and failure
- [A] frontend/src/components/LandingPage.test.tsx: version mock switched from `getBackendVersion` to `getBackendBuildInfo` (mock lines only)

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. `e2e/tests/TEST-08_footer_app_version.spec.ts` stays unchanged: its assertions (`toContainText` on the footer, `toHaveText` on the version span, exact `Task Notes` on abort) still hold with the commit span added.

## Testing Strategy
- Unit tests (Vitest, frontend): `version.test.ts` covers the client: version and commit returned; commit `"unknown"`, blank, missing and non-string give `commit: null` with the version intact; existing version, error and base-URL cases retargeted. `AppFooter.test.tsx` covers success with commit (`Task Notes v1.2.3 (abcdef1)` from `abcdef123456`), success with `commit: null` (version alone, no `app-footer-commit`), pending (exactly `Task Notes`), failure (exactly `Task Notes`, no `undefined|null|unknown`), and unresolved version with a commit present (exactly `Task Notes`).
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (project precedent; CLAUDE.md's unit directory is the backend's)
  - Naming: `{Module}.test.ts(x)`, existing files
- Integration tests: not warranted: no endpoint, repository or model changes; the `/api/version` contract is already covered by TEST-09's integration tests.
  - Directory: backend/tests/integration/
- E2E tests: one spec stubbing `/api/version` through `page.route(...).fulfill` with `{"version": "0.1.0", "commit": "0515c74d9e2f"}` and asserting the footer reads `Task Notes v0.1.0 (0515c74)` and `app-footer-commit` has text `(0515c74)`; one edge spec fulfilling `commit: "unknown"` and asserting the footer reads exactly `Task Notes v0.1.0` with `app-footer-commit` count 0 and no `unknown` text. Stubbed because BUILD_COMMIT is unset locally and in CI, so the real backend always answers `"unknown"`.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the `"unknown"` commit edge case
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: it is the footer's render for a pending, rejected or commit-less client result, fully controlled by mocking the client in the component test; TEST-08's E2E abort spec already covers the failed request in the browser |
| 3 | A component test covers the success, pending and failure paths | Unit | it is a statement about the component test itself, satisfied by `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-char commit next to the version | Fulfill `/api/version` with a fixed 12-char commit, open `/`, assert footer text `Task Notes v0.1.0 (0515c74)` | Given the backend reports commit 0515c74d9e2f When I open the landing page Then the footer reads "Task Notes v0.1.0 (0515c74)" |
| 2 | Pending or failed shows version alone, never undefined or an error | covered at Unit, see Criterion coverage | Given the version request fails When I open the landing page Then the footer reads "Task Notes" with no "undefined" or error |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter tests Then 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: Docker running; repository on this branch; `.env` copied from `.env.example`, with the line `BUILD_COMMIT=0515c74d9e2f1a3b` set in it.
1. From the repository root run `docker compose up --build` → the `db`, `backend` and `frontend` services start.
2. Open `http://localhost:8010/api/version` → the page shows `{"version":"0.1.0","commit":"0515c74d9e2f"}`.
3. Open `http://localhost:5183/` and read the footer at the bottom of the landing page → it reads `Task Notes v0.1.0 (0515c74)`: the version, then the first 7 characters of the commit from step 2.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack from Criterion 1 running.
1. On `http://localhost:5183/`, open dev tools, Network tab, set throttling to `Slow 3G`, reload, and watch the footer before the `/api/version` request completes → it reads exactly `Task Notes`; after the request completes it reads `Task Notes v0.1.0 (0515c74)`.
2. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no `v`, no parentheses, no `undefined`, no `null`, no `unknown` and no error text.
3. Run `docker compose start backend`; in `.env` empty the line to `BUILD_COMMIT=`; run `docker compose up -d backend`; open `http://localhost:8010/api/version` → it shows `"commit":"unknown"`.
4. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`: the version alone, no parentheses and no `unknown`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts src/components/LandingPage.test.tsx` → the run reports `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a test where the client resolves a version and commit and the footer shows the 7-character commit, a test where the client never settles and the footer reads `Task Notes`, and a test where the client rejects and the footer reads `Task Notes`.
