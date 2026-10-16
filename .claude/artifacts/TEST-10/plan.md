# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> Footer shows the build commit. The footer shows the first 7 characters of the commit reported by `GET /api/version`, next to the version TEST-08 added. Frontend only, under `frontend/src/`. Modifies the footer TEST-08 created (`frontend/src/components/AppFooter.tsx`, `frontend/src/api/version.ts`). TEST-09's backend returns `commit` (the first 12 characters of BUILD_COMMIT, default "unknown"). Depends on TEST-08 and TEST-09 (both done).

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Re-plan (deliver 6.2 step 3, the single permitted re-plan, run deliver-20261016T043226Z), orchestrator feedback 1: `frontend/src/components/LandingPage.test.tsx` mocks `fetchVersion` to resolve the bare version string, so once `fetchVersion` resolves the version-and-commit object the footer would read the version off a string and its existing footer-version assertion would fail. → Addressed by: a new `[A]` entry under `### Modified files` switching that mock to the object result (version `TEST_VERSION` plus commit `null`), and the same path added to `shared_risks.md` under existing files this feature will modify. The test file assertion on `app-footer-version` is kept as it is.
- Orchestrator feedback 2: render the commit span only when the commit is a string. → Addressed by: the `AppFooter.tsx` entry in the Frontend Plan and the File Manifest now renders the `app-footer-commit` span only when `typeof info.commit === "string"`, so a partial result from any mock (a bare string, an object without `commit`) can never render `(undefined)`.
- Orchestrator feedback 3: nothing else changes. → Addressed by: every other section is carried over unchanged from the previous plan, apart from one Testing Strategy line naming the updated LandingPage test.
- Comment (tracker): 4 comments on the item, all bot notices about earlier unmerged PRs → not acted on because none states a requirement, a correction or an amendment to the criteria.
- Interpretation of criterion 2 (dispatch-flagged ambiguity, recorded instead of a blocking question per `user_story_alignment.md` Section 4) → Addressed by: TEST-08's footer receives the version AND the commit from the same single `GET /api/version` request, so while that request is pending or after it fails there is no fetched version to show "alone". The plan therefore reads "the version alone" in the only way the single request allows:
  - Request pending: the footer keeps TEST-08's pending state, the app name `Task Notes` with no version and no commit element.
  - Request failed (network error, non-OK status, unusable version): the footer keeps TEST-08's failure state, `Task Notes` alone, with no version and no commit element.
  - Request succeeded but the commit is missing, not a string, blank, or the backend sentinel `unknown`: the footer shows the version alone, `Task Notes v0.1.0`, with no commit element.
  - In none of these states does the footer text contain `undefined`, `null`, `unknown`, an empty pair of parentheses or an error message.
  Why: a second request for the commit, or caching the version across loads, would add behaviour no criterion asks for (`user_story_alignment.md` Section 3); treating `unknown` as "no commit" mirrors exactly how TEST-08 already treats the `unknown` version sentinel in `frontend/src/api/version.ts`, so the two fields share one absence rule.
- Note on BUG-03 ("Footer sometimes shows unknown instead of the build commit", depends on TEST-10): this plan hides the `unknown` sentinel by construction, so BUG-03 may be found already satisfied when it is picked up. Recorded so its planner checks before re-implementing; no scope from BUG-03 is pulled in beyond the sentinel rule above, which criterion 2 itself requires.
- Merged since the last plan: n/a (no `[merged-since]` lines in this dispatch; planned against main at 8a08aa2 with TEST-08 and TEST-09 merged).

## Plan Overview
Frontend-only change to the footer TEST-08 built. `fetchVersion()` in `frontend/src/api/version.ts` keeps its single request and its existing rejection rules for the version, and now resolves to an object carrying the version and the short commit (first 7 characters) or `null` when no usable commit was reported. `AppFooter` stores that object and renders a new `app-footer-commit` span right after the existing `app-footer-version` span only when the commit is a string. Pending and failed requests keep TEST-08's exact `Task Notes` output. No backend, API, dependency or configuration change. Tests: the API client unit test, the AppFooter component test and the LandingPage test mock are updated (criterion 3 in the AppFooter test), one new Playwright spec covers criterion 1 in the browser plus an edge case, and the UAT artifacts are generated.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): add an exported type `VersionInfo` with `version: string` and `commit: string | null`; extend `VersionResponse` with an optional `commit` field; add a constant `COMMIT_DISPLAY_LENGTH = 7`. `fetchVersion()` now returns `Promise<VersionInfo>`. Version handling is unchanged: it still rejects on a network error, a non-OK status, or a version that is missing, not a string, blank, or `unknown`. Commit handling never rejects: when `commit` is a string whose trimmed value is non-empty and not `unknown`, the result carries its first 7 characters (a shorter value is kept whole); in every other case the result carries `commit: null`. One request per call, as today.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `VersionInfo | null` (was `string | null`). Render order inside the `app-footer` footer element: the app name, then the existing `app-footer-version` span (unchanged text, a space, `v` and the version), then, only when the info is non-null AND `typeof info.commit === "string"`, a span with data-testid `app-footer-commit` holding a space and the commit in parentheses. The string check (rather than a non-null check) guarantees that no partial result, from any mock or an unexpected shape, can render `(undefined)`. Resulting text on success: `Task Notes v0.1.0 (0123456)`; commit absent: `Task Notes v0.1.0`; pending or failed: `Task Notes`. The existing mount guard and the silent catch stay as they are.
- Routes: none (the footer renders on the existing `/` landing page via `LandingPage.tsx`, which is not modified).
- State management: local `useState` in `AppFooter`, as TEST-08 built it; no new state library or context.
- Design reference notes: AI freestyle. The commit span inherits the footer's existing style (font-size 0.875rem, color #5f5f5f, from TEST-08's `footerStyle`); no new style values are introduced.

## Backend Plan
No backend changes required. TEST-09 already serves `commit` on `GET /api/version`.

## API Integration Plan
No external API integration.

## API Contract
Existing internal endpoint, consumed unchanged (owned by TEST-05 and TEST-09):
- Method: GET
- URL: `/api/version` (resolved against `API_BASE_URL` from `frontend/src/api/baseUrl.ts`)
- Request: no body, no parameters.
- Response: 200 with a JSON object of two string fields, `version` (for example 0.1.0, or the sentinel `unknown`) and `commit` (the first 12 characters of BUILD_COMMIT, for example 0123456789ab, or the sentinel `unknown` when BUILD_COMMIT is unset).
- Frontend contract after this change: `fetchVersion(): Promise<VersionInfo>`, where `VersionInfo` holds `version` (a usable, trimmed version string) and `commit` (the first 7 characters of a usable commit, or `null`). It rejects only for the version failures TEST-08 defined.

## Technology Selection
- Commit shortening and the absence rule: chose `String.prototype.trim` and `String.prototype.slice` from the language standard library over any helper dependency, because two built-in calls cover it.
- Commit display: chose a plain `<span>` inside the existing semantic `<footer>` over a new component, because a single inline text node needs no component of its own.
- No new dependency is added: React, Vitest, Testing Library and Playwright, all already installed, cover the rendering and every test tier.

## File Manifest

### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec; criterion 1 on the landing page with `/api/version` fulfilled with a known 12-character commit, plus the edge case where the commit is the `unknown` sentinel and the footer shows the version alone
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge-case scenario
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: the artifact copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/version.ts: add `VersionInfo`, the optional `commit` field on `VersionResponse`, `COMMIT_DISPLAY_LENGTH`, and resolve the short commit or null
- [A] frontend/src/api/version.test.ts: update the existing assertions to the object result, replace the "ignores extra fields such as commit" case, and add the commit cases (12-character commit cut to 7, short commit kept whole, missing, non-string, blank, and `unknown` all give null, while the version is still returned)
- [A] frontend/src/components/AppFooter.tsx: hold `VersionInfo | null` and render the `app-footer-commit` span after the version only when `typeof info.commit === "string"`, so no partial result from any mock can render `(undefined)`
- [A] frontend/src/components/AppFooter.test.tsx: switch the mock to the object result and add the criterion 3 component tests (success with commit, success without commit, pending, failure)
- [A] frontend/src/components/LandingPage.test.tsx: switch the fetchVersion mock to the object result (version plus a commit or null) so the existing footer-version assertion keeps passing

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure. TEST-08's spec `e2e/tests/TEST-08_footer_app_version.spec.ts` is deliberately not modified: its assertions target `app-footer-version` and the whole-footer text on the failure path, both of which this plan leaves unchanged.

## Testing Strategy
- Unit tests (Vitest with Testing Library, frontend): `fetchVersion` commit normalisation and the unchanged version rejections; `AppFooter` render states.
  - Directory: co-located with the source under `frontend/src/` (the existing frontend convention: `frontend/src/api/version.test.ts`, `frontend/src/components/AppFooter.test.tsx`); the backend directories in CLAUDE.md do not apply because no backend code changes.
  - Naming: `{module}.test.ts` and `{Component}.test.tsx`, matching the files being extended.
  - AppFooter cases (criterion 3): success with commit `0123456789ab` renders `app-footer-commit` with text ` (0123456)` and the footer reads `Task Notes v9.9.9-test (0123456)`; success with commit null renders the version and no `app-footer-commit`; pending (a never-settling promise) renders exactly `Task Notes` with neither span; failure (rejected promise) renders exactly `Task Notes` with neither span; every case asserts the footer text matches none of `undefined`, `null`, `unknown`, `()`.
  - `frontend/src/components/LandingPage.test.tsx`: its `fetchVersion` mock resolves the object result (version `TEST_VERSION`, commit `null`) instead of the bare string; its existing footer-version assertion is unchanged and keeps passing.
- Integration tests: not warranted. Enabled per CLAUDE.md, but no repository, model, migration or endpoint changes; TEST-09 already covers `commit` on `GET /api/version` in `backend/tests/integration/test_version_integration.py`.
- E2E tests: one spec for criterion 1 and one edge-case test.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-10_footer_build_commit.spec.ts`
  - Both tests intercept only the exact pathname `/api/version` (the pathname-equality matcher TEST-08 uses, because Vite serves `src/api/version.ts` from a URL containing that substring) and fulfill it with status 200 and a JSON body built in the spec. Test 1: version `0.1.0`, commit `0123456789ab`; open `/`; `app-footer-version` has text ` v0.1.0`, `app-footer-commit` has text ` (0123456)`, the footer contains `Task Notes v0.1.0 (0123456)` and does not contain `0123456789ab`. Edge test: commit `unknown`; the footer has text `Task Notes v0.1.0` and `app-footer-commit` has count 0. Fulfilling the response is deliberate: the local and CI stacks build the backend with BUILD_COMMIT defaulting to `unknown`, so the real backend cannot be relied on to report a real commit.
- UAT scenarios: one scenario per criterion plus an edge case (commit reported as `unknown`).
  - Directory: `e2e/uat/scenarios/` and `e2e/uat/scripts/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit (AppFooter component test, plus the `fetchVersion` unit cases for an unusable commit) | verifying it needs no navigation or interaction: the pending and failed states are render states of one component driven by a mocked fetch, and pending is not deterministically observable in a browser |
| 3 | A component test covers the success, pending and failure paths | Unit (`frontend/src/components/AppFooter.test.tsx`) | the criterion is itself a requirement on the component test, so the component test tier is the covering tier by definition |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 commit characters next to the version | Fulfill `/api/version` with version 0.1.0 and commit 0123456789ab, open `/`, assert `app-footer-commit` reads ` (0123456)` right after ` v0.1.0` | Given the backend reports commit 0123456789ab, When I open the landing page, Then the footer reads Task Notes v0.1.0 (0123456) |
| 2 | Pending or failure shows no commit and never undefined or an error | covered at Unit, see Criterion coverage; the edge-case E2E test checks the unknown-commit variant | Given `/api/version` is unreachable, When I open the landing page, Then the footer reads exactly Task Notes and contains no undefined or error text |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter component tests, Then the success, pending and failure tests run and 0 failed |

## Manual verification plan

### Criterion 1: The footer shows the first 7 characters of the commit from GET /api/version, next to the version
Prerequisites: the repository root `.env` file contains the line `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567`, and the stack was rebuilt with `docker compose up --build -d` from the repository root so the backend image carries that commit.
1. Open `http://localhost:8010/api/version` in a browser → the JSON shows version `0.1.0` and commit `0123456789ab` (12 characters).
2. Open `http://localhost:5183/` → the landing page shows the title Task Notes and, at the bottom, the footer.
3. Read the footer → it reads exactly `Task Notes v0.1.0 (0123456)`: the 7-character commit `0123456` sits directly after the version, and the 12-character `0123456789ab` does not appear anywhere in the footer.
4. Open the browser DevTools Elements panel and inspect the footer → it holds a span with data-testid `app-footer-version` followed by a span with data-testid `app-footer-commit`.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error
Prerequisites: the stack from Criterion 1 is running and `http://localhost:5183/` is open with DevTools available.
1. In DevTools Network, set throttling to Slow 3G and reload `http://localhost:5183/` → while the `/api/version` request is still in flight the footer reads exactly `Task Notes`, with no version, no commit, no `undefined` and no error text; once the request completes it reads `Task Notes v0.1.0 (0123456)`.
2. Set throttling back to No throttling, then in the Network panel right-click the `/api/version` request, choose Block request URL, and reload the page → the footer reads exactly `Task Notes`; it contains no `undefined`, `null`, `unknown`, empty parentheses or error message.
3. Unblock the URL, then remove the `BUILD_COMMIT` line from `.env` and run `docker compose up --build -d` again from the repository root → `http://localhost:8010/api/version` now shows commit `unknown`.
4. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`: the version alone, with no commit, no `unknown` and no empty parentheses.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` from the repository root → the run lists the AppFooter tests for success with a commit, success without a commit, pending and failure, and reports 0 failed.
2. Run `npm --prefix frontend test -- src/api/version.test.ts` from the repository root → the `fetchVersion` tests, including the commit cases, report 0 failed.
