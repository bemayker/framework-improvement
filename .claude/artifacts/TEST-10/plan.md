# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> The landing page footer shows the short build commit next to the version.
>
> Acceptance criteria (tracker description):
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> Notes: Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates. Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added. Rendered as `Task Notes v{version} ({commit first 7})`, e.g. `Task Notes v0.1.0 (0123456)`.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. Interpreted below (Re-Plan Feedback, first line): the footer then renders exactly what TEST-08 renders for that state, and a successful response with no usable commit renders `Task Notes v{version}` with no commit fragment.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback (if applicable)
- Assumption (criterion 2, no comment asks for it; autonomous run, so recorded rather than asked): version and commit arrive in the same single `GET /api/version` response, so while that request is pending or after it fails there is no version to show either. "The version alone" is therefore read as "the footer TEST-08 shipped, with no commit fragment": exactly `Task Notes` while pending and on failure (TEST-08's recorded loading and failure states, decided in answer to a human correction comment, kept unchanged), and exactly `Task Notes v{version}` when the request succeeds but the commit is missing, not a string, blank, or the backend sentinel `unknown`. The footer never renders `undefined`, `null`, `()`, an error message or a dangling space. Rejected alternative: showing a build-time frontend version while pending, because TEST-08 removed the `package.json` source on a human correction and reintroducing it would contradict that decision. Also: when the version itself is the backend sentinel `unknown`, the footer stays `Task Notes` and shows no commit either, because criterion 1 places the commit next to a version and there is none.
- Assumption (format, the item does not specify one): commit rendered after the version in parentheses, `Task Notes v0.1.0 (0123456)`, as one text expression with single spaces. Chosen over a separator glyph to keep the string plain ASCII and the existing footer style untouched.
- Assumption (where the 7-character cut happens): in the frontend. TEST-09 serves up to 12 characters (`COMMIT_DISPLAY_LENGTH = 12` in `backend/app/services/version_service.py`), the criterion asks for 7 on the footer, so the footer slices; the backend is not changed (the item says frontend only).
- Comment (tracker, 2026-10-05, run deliver-20261005T151552Z): "mayker-dev: PR opened for TEST-10 — .../pull/101 ... Interpretation recorded for criterion 2: ... while pending the footer reads \"Task Notes\" and on failure \"Task Notes · version unavailable\" (TEST-08's approved states) ..." → not acted on as an instruction: a framework PR-link note from a reset run, and PR #101 is not on main (verified on 29374c2: `frontend/src/api/version.ts` reads `version` only and `AppFooter.tsx` has no commit handling). Its failure text `Task Notes · version unavailable` does not match TEST-08 as merged (#153 renders exactly `Task Notes` on failure), so this plan follows the merged TEST-08.
- Comment (tracker, 2026-10-02, run deliver-20261002T132208Z): "mayker-dev: PR opened for TEST-10 — .../pull/71 ... while pending or on failure the footer shows \"Task Notes\" (no version, no commit); \"version alone\" shows when the request succeeds but the commit is missing or \"unknown\"." → not acted on as an instruction (PR #71 is not on main, verified as above); this plan reached the same reading independently from the item text plus merged TEST-08, and adds the blank-commit case.
- Regression found while planning: `e2e/tests/TEST-08_footer_app_version.spec.ts` test 2 stubs `/api/version` with `commit: "abc1234"` and asserts the footer does not contain `abc1234`, and test 1 asserts the exact text `Task Notes v{version}` on the real stack, which fails whenever `BUILD_COMMIT` is set. Both are re-pointed in this manifest. TEST-08's Gherkin and manual UAT script stay correct as written: they run the default stack, where `BUILD_COMMIT` is unset, the backend reports `unknown` and the footer reads exactly `Task Notes v{version}`.
- Merged since the last plan: n/a (fresh plan, branched from current main 29374c2).

## Plan Overview
Extend TEST-08's version client to also return the commit when the `GET /api/version` body carries a non-empty string `commit`, and have `AppFooter` append ` ({first 7 chars})` after the version when it has one that is not the `unknown` sentinel. Pending, failure and sentinel-version states are TEST-08's, unchanged. Frontend only: no backend change, no new dependency, `LandingPage.tsx` untouched.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): `VersionInfo` becomes `{ version: string; commit?: string }`. `fetchVersion()` keeps every existing failure rule for `version`; it adds `commit` to the result only when the body's `commit` is a non-empty string, and otherwise omits it (never throws for a bad commit, because a missing commit must not hide the version). The doc comment drops "ignores ... commit". `commit` is optional so existing mocks returning `{ version }` (`LandingPage.test.tsx`) still type-check under `tsc -b`.
  - `frontend/src/components/AppFooter.tsx` (modify): state holds the resolved `VersionInfo | null` instead of a bare version string. Add `UNRESOLVED_COMMIT = "unknown"` and `SHORT_COMMIT_LENGTH = 7`. Render: `null` → `Task Notes`; version present and commit present and not `unknown` → `Task Notes v{version} ({commit.slice(0, 7)})`; otherwise `Task Notes v{version}`. Keep `data-testid="app-footer"`, the contentinfo landmark, `footerStyle`, the `isMounted` guard and the version sentinel rule exactly.
- Routes: none.
- State management: component-local state in `AppFooter`, as today.
- Design reference notes: AI freestyle (Design Reference mode NONE). The existing footer style is kept exactly (font-size 0.875rem, color #5f5f5f, margin-top 1.5rem); the commit is plain text in the same run, no new element or style.

## Backend Plan
No backend changes required. `GET /api/version` already returns `commit` (TEST-09, #150).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05 and TEST-09; consumed, not changed)
- Request: no body, no parameters
- Response: `200` with `{"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is the `BUILD_COMMIT` cut to 12 characters, or `"unknown"` when unset or blank. The client reads `version` (required) and `commit` (optional, non-empty string) and ignores any other field.

## Technology Selection
- Reading the commit: chose extending the existing `fetchVersion()` client (platform `fetch`, already used) over a second client or an HTTP library, because the commit arrives in the same response the footer already fetches.
- Shortening to 7 characters: chose the standard library `String.prototype.slice` over a helper module or dependency, because one call covers it.
- No net-new component, module or dependency is introduced; every change edits an existing file.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: footer shows version plus first 7 commit chars from a stubbed 12-char commit; edge cases: `unknown` commit shows version alone, aborted request shows exactly `Task Notes`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the no-commit edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: build-feature Section 14 step 3 copy of the manual UAT script

### Modified files
- [A] frontend/src/api/version.ts: `VersionInfo` gains optional `commit`; return it when the body carries a non-empty string commit
- [A] frontend/src/api/version.test.ts: replace the "ignores commit" case with: returns commit when present; omits it when missing, non-string or empty; version failure rules unchanged
- [A] frontend/src/components/AppFooter.tsx: render ` ({first 7 of commit})` after the version when a usable commit is present
- [A] frontend/src/components/AppFooter.test.tsx: success with commit, success without usable commit (missing, `unknown`), pending, failure, sentinel version with a commit
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: test 1 expects the commit fragment when the real response carries a usable commit; test 2 expects `(abc1234)` instead of asserting its absence

No dependency is added or changed, so no lockfile changes. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit. Not modified on purpose: frontend/src/components/LandingPage.tsx and LandingPage.test.tsx (its `{ version }` mock stays valid because `commit` is optional), every backend file, and TEST-08's Gherkin and UAT script (correct on the default stack, see Re-Plan Feedback).

## Testing Strategy
- Unit tests (Vitest, frontend): `version.test.ts` (fetch stubbed like today): `{ version: "0.1.0", commit: "0123456789ab" }` returns both; missing commit, `commit: 42`, `commit: ""` return `{ version }` only with no `commit` key; existing non-OK and bad-version cases keep passing. `AppFooter.test.tsx` mocks `../api/version`: success `{ version: "1.2.3", commit: "0123456789ab" }` gives exactly `Task Notes v1.2.3 (0123456)`; success with a 5-char commit `abcde` gives `Task Notes v1.2.3 (abcde)`; success with no commit and with commit `unknown` gives exactly `Task Notes v1.2.3`; pending (never-resolving promise) gives exactly `Task Notes`; failure (rejected) gives exactly `Task Notes` and contains neither `undefined`, `null`, `(` nor `Error`; version `unknown` with a commit gives exactly `Task Notes`; landmark test kept.
  - Directory: frontend/src/ (co-located `*.test.ts(x)`, the existing frontend convention)
  - Naming: `{module}.test.ts(x)`
- Integration tests: no new ones. No router, repository or migration change; the endpoint's `commit` field is covered by TEST-09's `backend/tests/integration/test_version_integration.py`.
  - Directory: backend/tests/integration/
- E2E tests: `TEST-10_footer_build_commit.spec.ts`, using `page.route` on the exact `/api/version` pathname (TEST-08's `isVersionApiUrl` pattern, with the `access-control-allow-origin` header): (1) fulfil `{"version": "9.9.9-backend", "commit": "0123456789ab"}` → footer has text `Task Notes v9.9.9-backend (0123456)` and does not contain `0123456789ab`; (2) edge: fulfil `{"version": "9.9.9-backend", "commit": "unknown"}` → exactly `Task Notes v9.9.9-backend`; (3) edge: abort the request → exactly `Task Notes`. TEST-08's spec re-pointed as listed in the manifest.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the no-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from GET /api/version, next to the version | E2E | — |
| 2 | While pending or on failure, the footer shows the version alone, never undefined or an error | Unit | verifying it needs no navigation or interaction: it is a render branch on a pending or rejected client promise, checked in jsdom; the E2E abort and `unknown`-commit cases are the feature's edge-case specs on top |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test, so it is satisfied and verified by `AppFooter.test.tsx` running |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows 7-char commit next to the version | Stub /api/version with a 12-char commit: footer reads `Task Notes v9.9.9-backend (0123456)` | Given the backend was built with BUILD_COMMIT 0123456789abcdef, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (0123456)" |
| 2 | Version alone while pending or on failure | covered at Unit, see Criterion coverage; E2E edge cases: aborted request gives `Task Notes`, `unknown` commit gives version alone | Given the backend is stopped, When I open the page, Then the footer reads "Task Notes" with no "undefined", "null" or error text |
| 3 | Component test, three paths | covered at Unit, see Criterion coverage | Given the frontend tests, When I run them, Then AppFooter's success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: from the repository root, run `BUILD_COMMIT=0123456789abcdef docker compose up --build -d` (frontend on http://localhost:5183, backend on http://localhost:8010).
1. Open `http://localhost:8010/api/version` → JSON with `"version": "0.1.0"` and `"commit": "0123456789ab"` (12 characters).
2. Open `http://localhost:5183/` → the landing page titled "Task Notes" loads.
3. Read the footer under the note list → it reads exactly `Task Notes v0.1.0 (0123456)`: the version, then the first 7 commit characters in parentheses, and not `0123456789ab`.

### Criterion 2: While pending or on failure, the footer shows the version alone
Prerequisites: as Criterion 1.
1. Run `docker compose stop backend` from the repository root, then reload `http://localhost:5183/` → the page loads and the footer reads exactly `Task Notes`, with no `undefined`, no `null`, no `()` and no error text.
2. Run `docker compose start backend`, wait for `http://localhost:8010/api/version` to answer, and reload → the footer reads `Task Notes v0.1.0 (0123456)` again.
3. Rebuild without a commit: `docker compose up --build -d` with `BUILD_COMMIT` unset in the shell, open `http://localhost:8010/api/version` → `"commit": "unknown"`; reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`, the version alone.
4. The pending state is too brief to see by hand; it is verified by the component test under Criterion 3.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the success-with-commit, pending and failure tests are listed, with `0 failed`.
2. Run `npm --prefix frontend test` → the full frontend suite, including `src/api/version.test.ts` and `src/components/LandingPage.test.tsx`, reports `0 failed`.
