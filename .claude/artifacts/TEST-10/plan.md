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
<!-- Criterion 2 carries the interpretation recorded under Re-Plan Feedback: version and commit come from one /api/version request. -->
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. Interpreted: the version and the commit come from the same single `/api/version` request, so while it is pending or when it fails no version is known either, and the footer reads exactly TEST-08's state `Task Notes`. When the request succeeds with a usable version but no usable commit (missing, empty, non-string, or the backend's `unknown` default), the footer shows the version alone: `Task Notes v{version}`, with no commit, no `undefined` and no error text.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 7 comments read, all earlier mayker-dev PR notes from previous runs → Addressed by: not acted on, because none states a requirement or a correction; none overrides the description.
- Interpretation (no comment; recorded instead of a blocking question, `user_story_alignment.md` Section 4): criterion 2 says pending and failure show "the version alone". TEST-08's footer and TEST-10's commit both come from one `GET /api/version` call (TEST-08 fetches once on mount, and this plan keeps one fetch rather than adding a second request), so in the pending and failed states there is no version to show alone. Those states therefore stay exactly TEST-08's: the footer reads `Task Notes`, no version, no commit, no placeholder, no `undefined`, no error text. "The version alone" is realised where it can be: a successful response whose `commit` is unusable (missing, empty, non-string, or the backend's `unknown` default from TEST-09 when `BUILD_COMMIT` is unset) shows `Task Notes v{version}` with no commit. The `unknown` sentinel is treated as unresolved for the same reason TEST-08 treats the version's `unknown` sentinel that way: it would read like a commit. A response with a usable commit but no usable version shows `Task Notes` only, because the commit is shown "next to the version" and has nothing to sit next to.
- Interpretation: "first 7 characters" is applied in the frontend. TEST-09's endpoint returns the first 12 characters of `BUILD_COMMIT`; the footer shows `commit.slice(0, 7)`, and a commit shorter than 7 characters is shown as is.
- Dispatch context: BUG-04 is in flight on `frontend/src/components/NoteForm.tsx` and `NoteForm.test.tsx` → Addressed by: this plan touches neither file, nor `LandingPage.tsx`. `LandingPage.test.tsx` is modified only for its version-client mock (see File Manifest); BUG-04's declared files exclude it.
- Merged since the last plan: n/a (fresh plan, base a1b831cbb52e04893cd87477a9e6f5a71e2c05f2, no `[merged-since]` lines in the dispatch).

## Plan Overview
Frontend-only change on top of TEST-08's footer and TEST-09's `commit` field. The existing client `fetchBackendVersion()` in `frontend/src/api/version.ts` is widened to return both fields from its one request: `{ version, commit } | null`, with `commit` set to `null` when unusable. `AppFooter` renders `Task Notes v{version} ({first 7 chars of commit})` on success, `Task Notes v{version}` when the commit is unusable, and `Task Notes` while pending or on failure (TEST-08's states, unchanged). Tests that mock the client (`AppFooter.test.tsx`, `LandingPage.test.tsx`) move to the new return shape. One new E2E spec. No backend change, no new dependency.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `VersionResponse` becomes `{ version: string; commit: string }` (TEST-09's response). New exported type `BackendVersion = { version: string; commit: string | null }`. `fetchBackendVersion(): Promise<BackendVersion | null>`: unchanged request, unchanged non-OK throw (`Loading the version failed: {status} {statusText}`), network failures still reject. Resolves to `null` when the version is unusable (missing, empty, non-string, `unknown`), exactly as today. Otherwise resolves to `{ version, commit }` where `commit` is the body's `commit` when it is a non-empty string other than `unknown`, else `null`. The client returns the commit as received (12 characters from TEST-09); it does not truncate. Update the header comment, which today says `commit` is ignored.
  - `frontend/src/components/AppFooter.tsx`: state becomes `BackendVersion | null` (initially `null`), same single fetch on mount with the `isMounted` guard and the swallowed rejection. Add `const SHORT_COMMIT_LENGTH = 7`. Render: `Task Notes`; when state is non-null, ` ` plus `<span data-testid="app-version">v{version}</span>` (unchanged from TEST-08); when `commit` is also non-null, ` ` plus `<span data-testid="app-commit">({commit.slice(0, SHORT_COMMIT_LENGTH)})</span>`. Footer `data-testid="app-footer"`, the contentinfo landmark and the style object are unchanged. Update the comment above the effect to name the commit.
- Routes: none (landing page `/` only).
- State management: local `useState` in `AppFooter`; no global state.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer style is kept unchanged (`fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`); the commit span inherits it, no new style. Rendered text on success: `Task Notes v0.1.0 (0123456)`.

## Backend Plan
No backend changes required. TEST-09 already returns `commit` (first 12 characters of `BUILD_COMMIT`, default `unknown`) on `GET /api/version`; this item only reads it.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05 and TEST-09), called as `{API_BASE_URL}/api/version`, default `http://localhost:8010/api/version`
- Request: no body, no parameters
- Response: `200`, JSON `{"version": "0.1.0", "commit": "0123456789ab"}`, or `{"version": "0.1.0", "commit": "unknown"}` when `BUILD_COMMIT` is unset. Client mapping: non-OK throws; network failure rejects; unusable `version` resolves `null`; usable `version` with usable `commit` resolves `{version: "0.1.0", commit: "0123456789ab"}`; usable `version` with missing, empty, non-string or `unknown` commit resolves `{version: "0.1.0", commit: null}`.

## Technology Selection
- No net-new component, module or dependency: the commit is read by the existing client (native `fetch`), held in the existing `useState`, and shortened with the standard `String.prototype.slice`; chosen over a second request or a new helper module, because one field and one slice need neither.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright spec: with `/api/version` fulfilled via `page.route` as `{"version":"0.1.0","commit":"0123456789ab"}`, the footer shows `app-version` `v0.1.0` and `app-commit` `(0123456)`; edge case fulfilled with `commit` `unknown` shows `Task Notes v0.1.0` and no `app-commit`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the `unknown` commit edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: read `commit` from the same response; return `BackendVersion | null`; unusable commit becomes `null`
- [A] frontend/src/api/version.test.ts: assert the resolved object (`{version, commit}`); commit missing, empty, non-string and `unknown` give `commit: null`; unusable version still gives `null`; replace the "ignores extra fields such as commit" test; URL and non-OK tests kept
- [A] frontend/src/components/AppFooter.tsx: render the first 7 characters of the commit in an `app-commit` span next to the version
- [A] frontend/src/components/AppFooter.test.tsx: mock resolves `{version, commit}`; success (`Task Notes v1.2.3 (0123456)` from a 12-character commit), pending (name only), rejected (name only), `null` (name only), unusable commit (`Task Notes v1.2.3`, no `app-commit`, no `undefined`, `null`, `unknown`); landmark test kept
- [A] frontend/src/components/LandingPage.test.tsx: version-client mock resolves `{ version: "9.8.7", commit: null }` instead of the string `"9.8.7"`, so its footer assertion keeps passing; no other change

No dependency is added or changed, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes (`BUILD_COMMIT` is already documented by TEST-09). `e2e/tests/TEST-08_footer_app_version.spec.ts` and `e2e/tests/TEST-04_page_footer.spec.ts` are not modified: their assertions (`app-version` text, footer containing the version, `Task Notes` on an aborted request) still hold because the commit is a separate span.

## Testing Strategy
- Unit tests: Vitest, frontend. `version.test.ts` covers the client mapping (happy path, unusable commit and version edge cases, non-OK error). `AppFooter.test.tsx` covers success, pending, failure, unusable version and unusable commit. No backend unit test: no backend code changes.
  - Directory: `frontend/src/` beside the module (the project's existing Vitest convention; `backend/tests/unit/` does not apply to frontend code)
  - Naming: `{Module}.test.ts(x)`, as the existing frontend tests
- Integration tests: not warranted: no router, repository or model change; TEST-09's `backend/tests/integration/test_version_integration.py` already covers the `commit` field.
  - Directory: backend/tests/integration/
- E2E tests: the footer showing version and short commit on the landing page in a real browser, with `/api/version` fulfilled by `page.route` for deterministic data (the local and CI backends report `unknown` unless `BUILD_COMMIT` is set); edge-case spec with commit `unknown`.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the `unknown` commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While pending or on failure, the footer shows no `undefined` or error (name only; version alone when only the commit is unusable) | Unit | verifying it needs no navigation or interaction: each state is a rendered-output assertion on `AppFooter` with the client mocked to pend, reject, return null or return a null commit, plus the client's mapping test; the E2E edge-case spec additionally covers the `unknown` commit |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test: `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | `page.route("**/api/version")` fulfils `{"version":"0.1.0","commit":"0123456789ab"}`; `page.goto("/")`; assert `app-version` is `v0.1.0`, `app-commit` is `(0123456)`, footer text is `Task Notes v0.1.0 (0123456)` | Given the backend reports commit 0123456789ab When I open the landing page Then the footer shows `Task Notes v0.1.0 (0123456)` |
| 2 | Pending or failure shows no `undefined` or error | covered at Unit, see Criterion coverage; edge-case spec fulfils commit `unknown` and asserts footer text `Task Notes v0.1.0` and no `app-commit` | Given the backend runs without BUILD_COMMIT When I open the landing page Then the footer shows `Task Notes v0.1.0` with no commit, `undefined` or `unknown` |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter tests Then they report 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: from the repo root, start the stack with `BUILD_COMMIT=0123456789abcdef docker compose up -d --build` (db, backend on port 8010, frontend on port 5183).
1. In a browser, open `http://localhost:8010/api/version` → the page shows `{"version":"0.1.0","commit":"0123456789ab"}`.
2. Open `http://localhost:5183/` and scroll to the footer → it reads `Task Notes v0.1.0 (0123456)`: the commit's first 7 characters, in parentheses, after the version.

### Criterion 2: While the request is pending or fails, no `undefined` or error is shown
Prerequisites: the stack is running as above.
1. From the repo root, run `docker compose stop backend`, then hard-reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no version, no commit, no `undefined`, no `null` and no error text (pending and failure share TEST-08's state, because one request supplies both values).
2. Run `docker compose up -d backend` (no `BUILD_COMMIT` set in the shell, so the backend reports `unknown`), wait until `http://localhost:8010/api/version` shows `{"version":"0.1.0","commit":"unknown"}`, then reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, the version alone, with no `(unknown)` and no `undefined`.
3. Optional pending check: in the developer tools Network tab set throttling to `Slow 3G` and reload → until the `/api/version` request completes the footer reads `Task Notes` only, then the version appears.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → both files run and the summary reports `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a success test (footer `Task Notes v1.2.3 (0123456)` from a 12-character commit), a pending test, a rejected-request test and an unusable-commit test, each asserting no `undefined`, `null` or `unknown`.
