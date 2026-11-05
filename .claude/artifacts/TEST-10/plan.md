# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What.** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes.** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.
>
> (Source: ClickUp task 123k99cwybm, workspace 30307190.)

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 27 comments read on the item, all mayker-dev PR notices from earlier runs → not acted on because none carries a correction or amendment to the feature text.
- Assumption (ambiguity, recorded rather than asked), criterion 2's "the version alone": while the request is pending, or when it fails (network error, non-OK status, unexpected `version` shape), no version is known yet, so the footer keeps TEST-08's exact behaviour and reads `Task Notes`. "The version alone" is read as "the footer as TEST-08 renders it, with no commit part": the commit is never shown on its own, and nothing in the commit's place ever reads `undefined`, `null`, `unknown`, an error message or an empty `()`.
- Assumption, commit display format: `Task Notes v{version} ({first 7 characters of commit})`, e.g. `Task Notes v0.1.0 (abc1234)`. Chosen because `docs/DEVELOPMENT.md` (the paragraph beginning "The page footer shows the backend's version and build commit") already describes exactly this format and its fallbacks, so the build matches the documented behaviour and the docs need no edit.
- Assumption, commit not resolvable: when the response's `commit` is missing (a backend older than TEST-09), not a string, empty after trimming, or the backend's sentinel `unknown` (what TEST-09 returns when `BUILD_COMMIT` is unset or blank, the default locally and in CI), the footer shows the version alone: `Task Notes v0.1.0`. A bad `commit` never discards a good `version`, so the client does not reject on it.
- Assumption, version `unknown` with a real commit: the footer reads `Task Notes` (TEST-08's rule for the version sentinel is unchanged), and the commit is not shown, because criterion 1 places the commit next to the version and there is no version to place it next to.
- Assumption, truncation: the backend already returns 12 characters (TEST-09); the frontend takes the first 7 of whatever it receives, so a commit shorter than 7 characters is shown whole.

## Plan Overview
Frontend-only change (in the diff; at runtime it reads the existing TEST-09 endpoint). The typed client `frontend/src/api/version.ts` starts returning the response's optional `commit` alongside `version`; `frontend/src/components/AppFooter.tsx` renders ` ({first 7 characters})` after the version when a usable commit is present. The pending and failure paths are TEST-08's and stay unchanged. Tests: client unit tests for the new field, component tests for success, commit-absent, pending and failure paths, a new E2E spec with a deterministic `/api/version` response, and a one-line robustness fix to TEST-08's E2E spec, whose exact-text assertion would otherwise fail on any backend that has `BUILD_COMMIT` set. No backend, no `LandingPage.tsx` change (it already renders `<AppFooter />`), no new dependency.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): `VersionResponse` becomes `{ version: string; commit?: string }`. `getVersion()` keeps every existing failure rule for `version` (non-OK status throws `Loading the version failed: {status} {statusText}`; a missing, non-string or blank `version` throws `Loading the version failed: unexpected response shape`). It additionally reads `commit`: when it is a string that is non-empty after trimming, it returns `{ version, commit }`; otherwise it returns `{ version }` with no `commit` key, and never throws on account of `commit`. Other extra fields stay ignored.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes the whole `VersionResponse | null` (initially `null`) instead of the version string. Keep `UNKNOWN_BACKEND_VERSION = "unknown"` and reuse it for the commit sentinel (the backend uses the same literal for both, per `backend/app/core/config.py` `UNKNOWN_BUILD_COMMIT` and `version_service.py` `UNKNOWN_VERSION`; extend the existing "why" comment to say so). Add `const COMMIT_DISPLAY_LENGTH = 7`. On success, store the response unless its `version` equals the sentinel; on rejection keep `null`. Derive `shortCommit = commit && commit !== UNKNOWN_BACKEND_VERSION ? commit.slice(0, COMMIT_DISPLAY_LENGTH) : null`. Render `{APP_NAME}`, then ` v{version}` when a response is stored, then ` ({shortCommit})` when `shortCommit` is non-null, so the text is exactly `Task Notes`, `Task Notes v0.1.0` or `Task Notes v0.1.0 (abc1234)`. Keep the `isMounted` guard, `data-testid="app-footer"`, the `<footer>` element and `footerStyle` unchanged.
- Routes: none (landing page `/` only).
- State management: local `useState` in `AppFooter`; no shared state.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.
<!-- GET /api/version already returns `commit` (TEST-09, #582): first 12 characters of BUILD_COMMIT, `unknown` when unset or blank (backend/app/core/config.py, backend/app/services/version_service.py, backend/app/schemas/version.py). -->

## API Integration Plan
No external API integration.

## API Contract
Consumed, not created (existing TEST-05 and TEST-09 endpoint):
- Method: GET
- URL: `/api/version` on `API_BASE_URL` (from `frontend/src/api/baseUrl.ts`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: 200, e.g. `{"version": "0.1.0", "commit": "abc1234def56"}` with `BUILD_COMMIT` set, or `{"version": "0.1.0", "commit": "unknown"}` without it.
- Client result: `{ version: "0.1.0", commit: "abc1234def56" }`, or `{ version: "0.1.0" }` when `commit` is missing, not a string or blank. The `unknown` commit is passed through by the client and suppressed by the footer (the same split TEST-08 uses for the version sentinel).
- Footer text: `Task Notes v0.1.0 (abc1234)`; `Task Notes v0.1.0` when no usable commit; `Task Notes` while pending, on any client rejection, or when `version` is `unknown`.

## Technology Selection
- Commit shortening: chose the built-in `String.prototype.slice(0, 7)` over a helper module or library, because one standard-library call covers it.
- Reading the optional `commit` field: chose a hand-written `typeof` check in the existing client over a schema library (zod), because one optional string field is two lines and no such dependency is installed.
- Deterministic E2E commit: chose Playwright's installed `page.route(...).fulfill` over setting `BUILD_COMMIT` on the test backend, because CI does not set it (`.github` has no `BUILD_COMMIT`), and the spec must not depend on how the backend was started.
- No net-new component, module or dependency otherwise: every change extends an existing file. No lockfile changes.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: E2E, footer shows `Task Notes v0.1.0 (abc1234)` for a fulfilled `/api/version` response carrying a 12-character commit; edge specs: commit `unknown` gives `Task Notes v0.1.0`, aborted request gives exactly `Task Notes`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the commit-unknown edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: `VersionResponse` gains optional `commit`; `getVersion()` returns a trimmed-non-empty string `commit` and omits it otherwise, without throwing
- [A] frontend/src/api/version.test.ts: the "ignores extra fields" test now expects `commit` returned and uses another extra field to prove the rest are ignored; new cases for `commit` missing, non-string and blank (each resolves to `{ version }` only)
- [A] frontend/src/components/AppFooter.tsx: store the whole response; render ` ({first 7 characters of commit})` after the version when the commit is usable; pending, failure and version-`unknown` paths unchanged
- [A] frontend/src/components/AppFooter.test.tsx: success with a 12-character commit (exact `Task Notes v9.9.9 (abc1234)`), commit missing and commit `unknown` (exact `Task Notes v9.9.9`), pending and rejected (exact `Task Notes`, no `undefined`, `null`, `Error` or `()`), version `unknown` with a real commit (exact `Task Notes`); keep the landmark test
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the first test's exact `toHaveText(`Task Notes v${version}`)` becomes `toContainText(`Task Notes v${version}`)`, so it stays true when a backend with `BUILD_COMMIT` set adds the commit part; the aborted-request test is unchanged

No dependency is added or changed, so no lockfile is produced. Neither README.md nor docs/DEVELOPMENT.md needs an edit: no structure, run configuration, dependency or test-infrastructure change, and docs/DEVELOPMENT.md already documents the footer format `Task Notes v0.1.0 (abc1234)` and its fallbacks. backend/, frontend/src/components/LandingPage.tsx and frontend/src/components/LandingPage.test.tsx are untouched (its mock returns no commit and its footer assertion is a substring match, so it keeps passing).

## Testing Strategy
- Unit tests: (Vitest, frontend) `frontend/src/api/version.test.ts` with `fetch` stubbed via `vi.stubGlobal` (existing pattern): commit returned, commit omitted when missing, non-string or blank, extra fields still ignored, all existing failure cases unchanged. `frontend/src/components/AppFooter.test.tsx` with `../api/version` mocked: success with commit, commit absent, commit `unknown`, pending, rejected, version `unknown`, landmark. No backend unit tests: no backend change.
  - Directory: colocated `frontend/src/**` `*.test.ts(x)` (the project's existing Vitest layout; `backend/tests/unit/` is unchanged)
  - Naming: `{Module}.test.tsx` / `{module}.test.ts`, matching the existing frontend tests
- Integration tests: no new ones. The `commit` field's router behaviour is covered by TEST-09's existing backend integration tests, and this item changes no router, repository or model.
  - Directory: backend/tests/integration/
- E2E tests: the footer showing the shortened commit next to the version on `/`, with the commit-`unknown` and aborted-request edge cases; TEST-08's spec relaxed to a substring match.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the commit-unknown edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While pending or on failure, the footer shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: pending, rejected, commit-absent and sentinel cases are mocked-client states of one component, asserted on exact text; the E2E edge specs (commit `unknown`, aborted request) are the feature's required edge-case specs on top |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test, which is the unit tier |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | `page.route("**/api/version", (r) => r.fulfill({ json: { version: "0.1.0", commit: "abc1234def56" } }))`, `page.goto("/")`, expect `getByTestId("app-footer")` to have text `Task Notes v0.1.0 (abc1234)` | Given the backend reports commit "abc1234def56" and version "0.1.0", When I open the landing page, Then the footer reads "Task Notes v0.1.0 (abc1234)" |
| 2 | Pending or failed shows the version alone | covered at Unit, see Criterion coverage; edge specs: fulfilled commit `unknown` gives exact `Task Notes v0.1.0`, aborted request gives exact `Task Notes` | Given the backend reports commit "unknown", When I open the landing page, Then the footer reads "Task Notes v0.1.0" with no parentheses |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter component tests, Then the success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: on branch `feature/TEST-10-footer-build-commit`; from the repository root, start the stack with the commit set: `BUILD_COMMIT=abc1234def567890abc1234def567890abc12345 docker compose up --build` (frontend on `http://localhost:5183`, backend on `http://localhost:8010`).
1. Open `http://localhost:8010/api/version` in a browser tab → the JSON shows `"version": "0.1.0"` and `"commit": "abc1234def56"` (12 characters).
2. Open `http://localhost:5183/` → the landing page loads with the "Task Notes" heading.
3. Scroll to the bottom of the page → the footer reads exactly `Task Notes v0.1.0 (abc1234)`: the version, a space, then the first 7 characters of the commit in parentheses.

### Criterion 2: While pending or on failure, the footer shows the version alone
Prerequisites: as Criterion 1.
1. On `http://localhost:5183/`, open DevTools, Network tab, set throttling to "Slow 3G" and reload; watch the footer before the `version` request completes → it reads exactly `Task Notes`, then changes to `Task Notes v0.1.0 (abc1234)` once the request finishes. At no point does it show `undefined`, `null` or `()`.
2. Set throttling back to "No throttling", right-click the `version` request, choose "Block request URL", and reload → the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown`, error text or `()`.
3. Unblock the URL. In a terminal, stop the stack with `docker compose down`, then start it without the commit: `docker compose up --build`. Open `http://localhost:8010/api/version` → `"commit": "unknown"`.
4. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → there is a test where the mocked `getVersion` resolves with a commit and the footer text is exactly `Task Notes v9.9.9 (abc1234)`, a pending test and a rejected test where the footer text is exactly `Task Notes`, and a commit-absent test where it is exactly `Task Notes v9.9.9`.
