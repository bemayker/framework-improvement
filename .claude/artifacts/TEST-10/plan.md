# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> TEST-10: Footer shows the build commit
>
> What: The landing page footer shows the short build commit next to the version.
>
> Acceptance criteria:
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> Notes: Frontend only, under frontend/src/. Modifies the footer TEST-08 creates. Depends on: TEST-08, TEST-09 (both done).

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback (if applicable)
- Plan-review verdict (orchestrator, run deliver-20261005T151552Z, VERDICT revise, one change): "File Manifest is not exact: `frontend/src/components/LandingPage.test.tsx` is missing. It imports `getBackendVersion`, mocks the module with a factory exporting only `getBackendVersion: vi.fn()`, and seeds it with `mockResolvedValue("9.8.7")`. After the rename, AppFooter (rendered inside LandingPage) calls `getBackendBuildInfo`, which that factory does not export, so every LandingPage test errors under Vitest, and the stale import/string-typed mock fail `tsc -b`." → Addressed by: ADOPTED. Added `- [A] frontend/src/components/LandingPage.test.tsx` to Modified files (retarget the import, the `vi.mock` factory and the `beforeEach` seed to `getBackendBuildInfo` resolving `{ version: "9.8.7", commit: null }`), and added the same path to shared_risks.md. A `null` commit is chosen so the LandingPage tests stay independent of the commit rendering, which AppFooter.test.tsx owns. Every other section is carried unchanged from the approved plan.
- Re-plan sweep for other callers: `git grep getBackendVersion origin/main -- frontend/src e2e` at 9d8aee3 finds four files: `frontend/src/api/version.ts`, `frontend/src/api/version.test.ts`, `frontend/src/components/AppFooter.tsx`, `frontend/src/components/AppFooter.test.tsx` (all already in the manifest) and `frontend/src/components/LandingPage.test.tsx` (added above). No reference under `e2e/`. No other file is affected by the rename.
- Comment (tracker): framework PR-link notice from run deliver-20261002T132208Z (PR #71, whose code was reset off main), carrying a prior interpretation of criterion 2: "version and commit come from one /api/version request, so while pending or on failure the footer shows "Task Notes" (no version, no commit); "version alone" shows when the request succeeds but the commit is missing or "unknown"." → Addressed by: ADOPTED for the pending state and for the meaning of "version alone"; DEVIATED on the failure text. Version and commit arrive in one response, so while the request is pending there is no version to show either: the footer keeps TEST-08's approved loading state, exactly `Task Notes`. On failure (network error, non-OK status, or a version the backend cannot resolve) the footer keeps TEST-08's approved unavailable state, exactly `Task Notes · version unavailable`, not bare `Task Notes` as the prior art says, because the dispatch requires TEST-08's behaviour to stay intact and that text is TEST-08's approved, E2E-covered failure state. In neither state does `undefined`, `null`, `unknown` or an error message appear, which is the part of criterion 2 that is checkable. "The version alone" (`Task Notes v{version}`, no commit, no separator) is what shows when the request succeeds with a usable version but the commit is missing, non-string, blank or the backend's `unknown` sentinel.
- Assumption (no comment, recorded so it is reviewable): the rendered shape is `Task Notes v{version} · {commit7}`, e.g. `Task Notes v0.1.0 · 0123456`, reusing the footer's existing ` · ` separator. The ticket says only "next to the version"; no design reference exists (mode NONE).
- Assumption: the commit is trimmed before use, and a usable commit shorter than 7 characters is shown whole (the first 7 characters of a shorter string are the string). The backend already truncates to 12 (TEST-09); the frontend truncates to 7.
- Assumption: `getBackendVersion()` in `frontend/src/api/version.ts` is renamed to `getBackendBuildInfo()` and returns both fields, so the footer still makes exactly one `/api/version` request. Its only production caller on main is `AppFooter.tsx`; its test-side references are listed in the sweep line above. Its existing null/throw contract for the version is kept unchanged.
- Assumption: TEST-08's E2E spec `e2e/tests/TEST-08_footer_app_version.spec.ts` asserts the commit is NOT shown (`shows the backend's version, ignoring any other field in the response` fulfils `commit: "abc123def456"` and expects exactly `Task Notes v9.9.9`). That assertion is superseded by criterion 1, so this plan edits that one test (drops the `commit` field from its routed body and retitles it) and loosens the live-backend test from an exact match to `toContainText`, so it holds whether or not the CI image carries a BUILD_COMMIT. TEST-08's unavailable-state test is untouched.
- Merged since the last plan: none. The previous plan was written against d0bcde8; `git log d0bcde8..origin/main -- frontend e2e` at 9d8aee3 lists 0 commits, so no planned path changed on main.

## Plan Overview
Frontend-only change to the existing footer. The version API client returns the backend's commit alongside the version from the same single `GET /api/version` request; `AppFooter` renders the first 7 characters of a usable commit after the version. Loading and unavailable states stay exactly as TEST-08 defined them. No backend, no new dependency, no new route.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: rename `getBackendVersion` to `getBackendBuildInfo`, returning `Promise<BackendBuildInfo | null>` with `export type BackendBuildInfo = { version: string; commit: string | null }`. Version rules unchanged (trimmed; null result when missing, non-string, blank or `unknown`; throws on a non-OK response). Commit rules: trimmed string, or `null` when missing, non-string, blank or the `unknown` sentinel (reuse the existing `UNKNOWN_BACKEND_VERSION` constant, renamed `UNKNOWN_SENTINEL` since both fields share it per backend `DEFAULT_BUILD_COMMIT = "unknown"`). Update the doc comment.
  - `frontend/src/components/AppFooter.tsx`: `ready` state becomes `{ kind: "ready"; version: string; commit: string | null }`. Add `const SHORT_COMMIT_LENGTH = 7`. When `commit` is non-null, render after the version span: the existing `SEPARATOR` then `<span data-testid="app-footer-commit">{commit.slice(0, SHORT_COMMIT_LENGTH)}</span>`. When null, render nothing after the version. Loading and unavailable branches unchanged.
  - `frontend/src/components/LandingPage.test.tsx`: test-only follow-through of the rename. Its `vi.mock("../api/version", ...)` factory, import and `beforeEach` seed move from `getBackendVersion` resolving `"9.8.7"` to `getBackendBuildInfo` resolving `{ version: "9.8.7", commit: null }`. No assertion changes.
- Routes: none.
- State management: unchanged local `useState`/`useEffect` with the existing `isMounted` guard.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit inherits the footer's existing inline style (`fontSize 0.875rem, color #5f5f5f`); no new style values.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Consumed, unchanged (TEST-09):
- Method: GET
- URL: `/api/version` on `API_BASE_URL` (`frontend/src/api/config.ts`)
- Request: none
- Response 200: `{"version": "0.1.0", "commit": "0123456789ab"}` where `commit` is the first 12 characters of BUILD_COMMIT or `"unknown"`.
- Frontend client contract after this change: `getBackendBuildInfo()` resolves `{"version": "0.1.0", "commit": "0123456789ab"}`, or `{"version": "0.1.0", "commit": null}` when the commit is unusable, or `null` when the version is unusable; it rejects on a network error or non-OK status.

## Technology Selection
- Short commit (first 7 characters): chose the standard `String.prototype.slice(0, 7)` over any formatting helper or dependency; the standard library covers it.
- Commit parsing: chose extending the existing `version.ts` client (same request, same `fetch`) over a second client module or a second request; an installed in-repo module covers it.
- No net-new component, module or dependency: the only new file is the E2E spec, and Vitest, Testing Library and Playwright are already installed.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec for criterion 1 (routed commit shows its first 7 characters after the version) plus the edge case (routed `unknown` commit shows the version alone)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: rename `getBackendVersion` to `getBackendBuildInfo`, return `{ version, commit }` (commit trimmed or null for missing, non-string, blank or `unknown`)
- [A] frontend/src/api/version.test.ts: unit tests for the commit field (12-char commit returned, trimmed, null for missing, blank, non-string and `unknown`); keep the existing version, URL and non-OK cases against the renamed function
- [A] frontend/src/components/AppFooter.tsx: render ` · {first 7 chars of commit}` in a `app-footer-commit` span after the version when the commit is usable
- [A] frontend/src/components/AppFooter.test.tsx: component tests for success with commit, success without a usable commit, pending and failure paths, mocking `getBackendBuildInfo`
- [A] frontend/src/components/LandingPage.test.tsx: retarget the import, the vi.mock factory and the beforeEach seed to getBackendBuildInfo resolving { version: "9.8.7", commit: null }
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: drop the `commit` field from the routed body in the "ignoring any other field" test and retitle it; loosen the live-backend test to `toContainText` so a CI image with a BUILD_COMMIT does not break it

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit.

## Testing Strategy
- Unit tests: `version.ts` client parsing of `commit` (Vitest, `fetch` stubbed) and `AppFooter` render states (Vitest + Testing Library, client mocked). Frontend unit tests live beside the source per the existing convention. `LandingPage.test.tsx` gets only the mock retarget so its existing cases keep running against the renamed client.
  - Directory: `frontend/src/` (co-located `*.test.ts(x)`, matching TEST-08); `backend/tests/unit/` is the backend convention and is untouched
  - Naming: `{Module}.test.ts(x)`, matching the existing frontend files
- Integration tests: not warranted. No repository, model, migration or endpoint changes (`testing_standards.md` Section 6); `GET /api/version` is unchanged and already covered by `backend/tests/integration/test_version_integration.py`.
- E2E tests: one spec for criterion 1 and its edge case, routing `/api/version` with `page.route` so the commit value is deterministic (the CI compose build sets no BUILD_COMMIT, so the live backend reports `unknown`). Plus the TEST-08 spec adjustment above.
  - Directory: `e2e/tests/`
  - File: `TEST-10_footer_build_commit.spec.ts`
- UAT scenarios: one scenario per criterion plus the `unknown` commit edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E (plus Unit in `AppFooter.test.tsx`) | — |
| 2 | While pending or on failure, footer shows no commit and never `undefined` or an error | Unit (`AppFooter.test.tsx`) | verifying it needs no navigation or interaction: it is a render state of one component driven by the client's promise; a pending state cannot be held open in a browser without a hard wait, and the failure path's browser coverage already exists in TEST-08's abort spec, which this plan keeps unchanged |
| 3 | A component test covers the success, pending and failure paths | Unit (`AppFooter.test.tsx`) | the criterion is itself a component test; the observable check is the Vitest run |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Short commit next to the version | Route `/api/version` to `{"version": "9.9.9", "commit": "abc123def456"}`, go to `/`, expect `app-footer` to have text `Task Notes v9.9.9 · abc123d` and `app-footer-commit` to have text `abc123d`, and the footer not to contain `abc123def456`. Edge: route `{"version": "9.9.9", "commit": "unknown"}`, expect exactly `Task Notes v9.9.9` and `app-footer-commit` count 0 | Given the backend reports commit `abc123def456` When I open the landing page Then the footer reads `Task Notes v9.9.9 · abc123d` |
| 2 | Pending / failure show no commit, no error text | covered at Unit, see Criterion coverage | Given `/api/version` cannot be reached When I open the landing page Then the footer reads `Task Notes · version unavailable` and shows no `undefined` |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter tests Then success, pending and failure cases pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: Docker running; from the repository root, the stack built with a known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` (frontend `http://localhost:5183`, backend `http://localhost:8010`).
1. Open `http://localhost:8010/api/version` in a browser tab → JSON reading `"version": "0.1.0"` and `"commit": "0123456789ab"` (12 characters).
2. Open `http://localhost:5183/` and scroll to the footer → it reads exactly `Task Notes v0.1.0 · 0123456`: the version, a middle dot, then the first 7 characters of the commit.
3. Inspect the footer in DevTools Elements → a `span` with `data-testid="app-footer-commit"` containing `0123456`, and nowhere the full `0123456789ab`.
4. Rebuild without a commit: `docker compose up -d --build backend` with BUILD_COMMIT unset, wait until `http://localhost:8010/api/version` shows `"commit": "unknown"`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0` (version alone), with no `unknown`, no trailing middle dot.

### Criterion 2: While the request is pending or when it fails, the footer shows no commit, never `undefined` or an error
Prerequisites: the stack from Criterion 1's prerequisites (commit `0123456789ab`) running.
1. In DevTools Network set throttling to "Slow 3G", then reload `http://localhost:5183/` and watch the footer → it first reads exactly `Task Notes` (no version, no commit, no separator), then changes to `Task Notes v0.1.0 · 0123456` when the request completes.
2. Set throttling back to "No throttling" → throttling is off.
3. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes · version unavailable`, with no `undefined`, no `null`, no `unknown`, no error text and no commit.
4. Run `docker compose start backend`, wait until `http://localhost:8010/api/version` answers, reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0 · 0123456` again.

### Criterion 3: A component test covers the success, pending and failure paths
This criterion is a test, not UI behaviour; the observable check is the test run.
1. Run `npm --prefix frontend test -- AppFooter` from the repository root → the run passes and lists a success case showing `Task Notes v9.8.7 · abc123d`, a success case with an unusable commit showing `Task Notes v9.8.7`, a pending case showing `Task Notes`, and failure cases (rejected request, unresolvable version) showing `Task Notes · version unavailable`.
2. Run `npm --prefix frontend test -- LandingPage` from the repository root → the existing LandingPage cases pass against the renamed client mock, with no "is not a function" or missing-export error.
