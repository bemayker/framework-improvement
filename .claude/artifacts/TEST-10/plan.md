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
- Comment (tracker): 12 comments read on the item, all framework PR notices from earlier runs → not acted on because none states a requirement or a correction to the feature text.
- Assumption (no comment, recorded per `user_story_alignment.md` Section 4): the version and the commit arrive in the same `GET /api/version` response, so "pending or failed" cannot show a version either. In that state the footer keeps TEST-08's behaviour exactly (`Task Notes` alone). "The version alone" is read as the state where the version resolved but no usable commit did.
- Assumption: the backend answers `commit: "unknown"` when `BUILD_COMMIT` is unset (`backend/app/core/config.py` `DEFAULT_BUILD_COMMIT`). That sentinel, a missing, non-string, empty or whitespace-only `commit` are all treated as "no usable commit", and the footer shows the version alone. This mirrors how `frontend/src/api/version.ts` already treats the version's `unknown` sentinel, and keeps the word `unknown` out of the footer (TEST-08's component test already asserts it never appears). Note for the scheduler: BUG-03 ("Footer sometimes shows 'unknown' instead of the build commit") depends on this item and may be moot after it.
- Assumption: the commit is rendered only when a version is also rendered, because the criterion places it "next to the version"; a commit without a version shows nothing extra.
- Docs: TEST-08's documentation check changed `docs/DEVELOPMENT.md` (the `BUILD_COMMIT` paragraph, line 665) to end with "Nothing in the frontend reads the commit yet." This item makes that sentence false, so the plan replaces it (see File Manifest, `[Docs]`).

## Plan Overview
Frontend only. The version API client (`frontend/src/api/version.ts`) is extended to return both normalised fields from the single `GET /api/version` call: `version` (unchanged rules) and `commit` (first 7 characters, or `null` when unusable). `AppFooter` stores that pair and renders a commit span after the version span when both are present. No backend, no new route, no new dependency. The existing tests that mock `fetchBackendVersion` (AppFooter, LandingPage, the client's own test) are updated to the new return shape, and new component cases cover success, pending and failure.

## Frontend Plan
- Components to create/modify:
  `frontend/src/api/version.ts`: `fetchBackendVersion()` changes its return type from `Promise<string | null>` to `Promise<BackendVersion>`, with `export type BackendVersion = { version: string | null; commit: string | null }`. Version normalisation is unchanged (trim; empty or `unknown` gives `null`). Commit normalisation: a string, trimmed, not empty and not equal to `unknown` (new constant `BACKEND_UNKNOWN_COMMIT = "unknown"`, commented as mirroring `DEFAULT_BUILD_COMMIT` in `backend/app/core/config.py`), shortened with `.slice(0, SHORT_COMMIT_LENGTH)` where `SHORT_COMMIT_LENGTH = 7`; anything else gives `null`. A null body gives `{ version: null, commit: null }`. Non-2xx and network errors still reject, exactly as now.
  `frontend/src/components/AppFooter.tsx`: state becomes `BackendVersion | null` (null while pending and after a failure). Render: `Task Notes`, then `<span data-testid="app-footer-version"> v{version}</span>` when version is non-null (unchanged), then `<span data-testid="app-footer-commit"> ({commit})</span>` when both version and commit are non-null. Resulting text on success: `Task Notes v0.1.0 (abc1234)`. The silent catch and the unmount guard stay.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today.
- Design reference notes: AI freestyle. The commit span inherits the footer's existing inline style (font size 0.875rem, color #5f5f5f, margin-top 1.5rem on the footer); no new style values are introduced.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version (existing, from TEST-08 and TEST-09; consumed, not changed)
- Request: none
- Response: `{"version": "0.1.0", "commit": "0f0e7a668920"}`. `commit` is at most 12 characters (backend `COMMIT_LENGTH`), or `"unknown"` when `BUILD_COMMIT` is unset or blank. The frontend shows its first 7 characters: `0f0e7a6`.

## Technology Selection
- Commit shortening and sentinel handling in `frontend/src/api/version.ts`: chose the standard library (`String.prototype.trim` and `String.prototype.slice`) inside the existing client over a new helper module or a dependency, because a few lines in the module that already normalises the version cover it.
- No net-new component, module or dependency is introduced: `AppFooter` and the version client are existing files, and the commit is one more `<span>` in the existing footer.

## File Manifest
<!-- Phase tags: see the plan-feature template; only [A], [G] and [Docs] apply here. -->
### New files
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (commit reported as unknown)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }`, add commit normalisation (trim, unknown sentinel, first 7 characters)
- [A] frontend/src/api/version.test.ts: assert the new return shape; add commit cases (12-char commit shortened to 7, `unknown`, missing, non-string, empty or whitespace, null body)
- [A] frontend/src/components/AppFooter.tsx: hold the `BackendVersion` pair and render the `app-footer-commit` span next to the version
- [A] frontend/src/components/AppFooter.test.tsx: mocks return `BackendVersion`; add success-with-commit, pending, failure and version-without-commit cases
- [A] frontend/src/components/LandingPage.test.tsx: update the `fetchBackendVersion` mock value to the `{ version, commit }` shape so the existing footer assertion keeps working
- [Docs] docs/DEVELOPMENT.md: replace "Nothing in the frontend reads the commit yet." in the `BUILD_COMMIT` paragraph with a sentence saying the landing page footer shows the first 7 characters next to the version and shows the version alone when the commit is `unknown`

No dependency changes, so no lockfile is regenerated. `README.md` needs no edit: its only mention is `.env.example`'s optional `BUILD_COMMIT`, which this item does not change.

## Testing Strategy
- Unit tests: Vitest component and client tests (the frontend's unit tier).
  - `frontend/src/api/version.test.ts`: commit normalisation and the unchanged version rules, against a stubbed `fetch`.
  - `frontend/src/components/AppFooter.test.tsx`: success (`Task Notes v9.9.9 (abc1234)` from a 12-character commit), pending (never-resolving promise: `Task Notes` alone, no version or commit span), failure (rejected promise: `Task Notes` alone), version with no usable commit (`Task Notes v9.9.9`, no commit span, no `undefined`, `null` or `unknown` in the text).
  - `frontend/src/components/LandingPage.test.tsx`: existing footer assertion kept, mock reshaped.
  - Directory: next to the source under `frontend/src/` (existing frontend convention; `CLAUDE.md` unit directory and `test_{module}_unit.py` naming are the backend's)
  - Naming: `{Module}.test.ts(x)` (existing frontend convention)
- Integration tests: none warranted. No repository, model, migration or endpoint changes (`testing_standards.md` Section 6, second and third questions).
  - Directory: backend/tests/integration/ (unused by this item)
- E2E tests: no new spec. No criterion requires navigation or interaction (the footer renders on load), so every criterion is covered at the unit tier per the table below. The existing `e2e/tests/TEST-08_footer_app_version.spec.ts` and `e2e/tests/TEST-04_page_footer.spec.ts` must still pass unchanged: CI does not set `BUILD_COMMIT`, so the backend reports `unknown` and the footer text stays `Task Notes v{version}`.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus the `unknown` commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit next to the version | Unit (Vitest: `AppFooter.test.tsx` success case, `version.test.ts` shortening case) | Verifying it needs no navigation or interaction: it is the render of a resolved response and a string rule, both fully observable with a mocked client |
| 2 | While pending or on failure, the footer shows the version alone, never `undefined` or an error | Unit (Vitest: `AppFooter.test.tsx` pending, failure and no-usable-commit cases) | Verifying it needs no navigation or interaction: pending and failure are mocked promise states, which a component test controls deterministically |
| 3 | A component test covers the success, pending and failure paths | Unit (the `AppFooter.test.tsx` cases themselves) | The criterion is the component test; executing it is the coverage |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | covered at Unit, see Criterion coverage | Given the backend reports commit `0f0e7a668920`, When the landing page loads, Then the footer reads `Task Notes v{version} (0f0e7a6)` |
| 2 | Pending or failed request shows no commit and no error text | covered at Unit, see Criterion coverage | Given the version request fails, When the landing page loads, Then the footer reads `Task Notes` with no `undefined` or error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When `AppFooter.test.tsx` runs, Then it reports 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: the stack is started with `BUILD_COMMIT=0f0e7a668920851ba8199ffa6ae2252197be5956` in `.env` (then `docker compose up -d --build`), frontend reachable at http://localhost:5183.
1. Open http://localhost:5183/ → the landing page loads with the notes form and the footer at the bottom.
2. Read the footer → it reads exactly `Task Notes v0.1.0 (0f0e7a6)` (the version is the one in `backend/pyproject.toml`); the commit shows 7 characters, not 12 or 40.
3. Open http://localhost:8010/api/version in a new tab → the JSON shows `"commit": "0f0e7a668920"`, whose first 7 characters match the footer.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: same stack as Criterion 1, browser devtools open on the Network tab.
1. In devtools, right-click the `/api/version` request and choose "Block request URL", then reload http://localhost:5183/ → the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error message.
2. Unblock the URL, set Network throttling to "Slow 3G" and reload → while the request is in flight the footer reads `Task Notes` only; once it completes it reads `Task Notes v0.1.0 (0f0e7a6)`.
3. Remove the `BUILD_COMMIT` line from `.env`, run `docker compose up -d --build`, reload http://localhost:5183/ → the footer reads `Task Notes v0.1.0` (version alone, no `(unknown)`).

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → expected `0 failed`, with test names for the success-with-commit, pending and failure cases listed.
2. Run `npm --prefix frontend test -- src/api/version.test.ts src/components/LandingPage.test.tsx` → expected `0 failed`.
