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
- Comment (tracker): 31 comments on the item, all of them this framework's own PR-opened notes, none carrying stakeholder feedback → not acted on because none states a requirement, correction or amendment.
- Merged since the last plan: n/a (fresh plan, written against main at f07622b, which already contains TEST-08 and TEST-09).
- Assumption (criterion 2 against TEST-08's criteria 6 and 7): version and commit arrive in the same `GET /api/version` response, so while that request is pending, or when the whole request fails, there is no version to show either. In those states the footer keeps TEST-08's recorded answer, exactly `Task Notes`, which satisfies criterion 2's "never `undefined` or an error" and does not regress TEST-08. "The version alone" applies to the commit-specific failure: the request succeeds with a usable `version` but `commit` is missing, not a string, empty, or the backend's `unknown` sentinel (what TEST-09 returns when `BUILD_COMMIT` is unset); the footer then reads `Task Notes v{version}` with no commit, no brackets and no placeholder.
- Assumption (display format): the commit is shown as ` ({commit7})` after the version, so a full footer reads `Task Notes v0.1.0 (0123456)`. The version span (`app-footer-version`) keeps its exact text ` v{version}`; the commit is a sibling span `app-footer-commit`, so every TEST-04 and TEST-08 assertion on the version span and every `toContainText` on the footer stays true.
- Assumption (shortening): TEST-09 returns at most 12 characters; the frontend takes the first 7 (`slice(0, 7)`). A commit shorter than 7 characters is shown as it is. No hex validation: the criteria do not ask for it (`user_story_alignment.md` Section 3).
- Assumption (one request): the client module's single fetch returns both fields, replacing `fetchBackendVersion()` with `fetchBackendBuild()`, rather than adding a second request for the commit. Renaming means the two test files that mock `../api/version` change with it (`AppFooter.test.tsx`, `LandingPage.test.tsx`).
- TEST-08's Gherkin scenario "the footer reads Task Notes v0.1.0" stays true in the stack as configured (no `BUILD_COMMIT`, so `commit` is `unknown` and hidden), so TEST-08's and TEST-04's UAT artifacts and E2E specs are not modified.

## Plan Overview
Frontend only. The version client `frontend/src/api/version.ts` reads `commit` alongside `version` from the one `GET /api/version` call and returns `{ version, commit }` (commit already shortened to 7 characters, or `null` when unusable), or `null` when the version itself cannot be resolved. `AppFooter` stores that result and renders `Task Notes`, then ` v{version}` when resolved, then ` ({commit})` when the commit is present. Pending and whole-request failure keep TEST-08's `Task Notes`; a resolved version with an unusable commit shows the version alone. No backend change: TEST-09 already ships `commit` on main.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `VersionResponse` becomes `{ version: string; commit: string }`. Add exported type `BackendBuild = { version: string; commit: string | null }` and constant `SHORT_COMMIT_LENGTH = 7`. Replace `fetchBackendVersion()` with `fetchBackendBuild(): Promise<BackendBuild | null>`: the version rules are unchanged (not OK, network error, non-JSON body, missing, empty, non-string or `unknown` version all return `null`); with a usable version, `commit` is `body.commit.slice(0, SHORT_COMMIT_LENGTH)` when `body.commit` is a non-empty string other than `unknown`, and `null` otherwise. It never throws. The existing `UNKNOWN_VERSION` sentinel constant is reused for the commit check (TEST-09's commit default is the same literal `unknown`); rename it `UNKNOWN_SENTINEL` with a comment naming both fields.
  - `frontend/src/components/AppFooter.tsx`: state becomes `backendBuild: BackendBuild | null`, set from `fetchBackendBuild()` in the same mount-only `useEffect` with its `isMounted` guard. Render `Task Notes`; when `backendBuild` is non-null, `<span data-testid="app-footer-version"> v{backendBuild.version}</span>`; when `backendBuild?.commit` is non-null, a sibling `<span data-testid="app-footer-commit"> ({backendBuild.commit})</span>`. `data-testid="app-footer"`, the `<footer>` landmark and `footerStyle` are unchanged.
  - `frontend/src/components/LandingPage.tsx`: not modified.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit inherits the footer's existing style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem` on the footer); no new visual values.

## Backend Plan
No backend changes required. `GET /api/version` already returns `commit` (TEST-09: `backend/app/schemas/version.py`, `get_build_commit()` in `backend/app/services/version_service.py`, at most 12 characters, `unknown` when `BUILD_COMMIT` is unset or blank), and `docker-compose.yml` already forwards `BUILD_COMMIT` to the backend.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05 and TEST-09; consumed, not changed)
- Request: no body, no parameters
- Response: `200` with JSON `{"version": "0.1.0", "commit": "0123456789ab"}`, or `{"version": "0.1.0", "commit": "unknown"}` when `BUILD_COMMIT` is unset.
- Client contract: `fetchBackendBuild()` resolves to `{ version: "0.1.0", commit: "0123456" }`, to `{ version: "0.1.0", commit: null }` when the commit is unusable, or to `null` when the version cannot be resolved; it never rejects.

## Technology Selection
- Commit shortening: chose `String.prototype.slice(0, 7)` from the language over any helper or dependency; nothing else is needed.
- Reading `commit`: extends the existing native `fetch` call in `version.ts` over a second request or an HTTP library, because one response carries both fields.
- No net-new component, module or dependency: every change extends an existing file, so no lockfile changes.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec fulfilling GET /api/version with a 12-character commit and asserting the footer shows its first 7, plus the edge case where commit is unknown and the footer shows the version alone
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the unknown-commit edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: build-feature Section 14 step 3 copy of the manual UAT script

### Modified files
- [A] frontend/src/api/version.ts: replace fetchBackendVersion with fetchBackendBuild returning version and the 7-character commit or null
- [A] frontend/src/api/version.test.ts: retarget to fetchBackendBuild; add commit cases (12-character commit shortened to 7, short commit kept, missing, empty, non-string and unknown commit give commit null with the version kept)
- [A] frontend/src/components/AppFooter.tsx: hold the BackendBuild result and render the commit span after the version span when present
- [A] frontend/src/components/AppFooter.test.tsx: mock fetchBackendBuild; cover success with commit, pending (Task Notes only), whole-request failure (Task Notes only), and version with an unusable commit (version alone, no commit span, no undefined)
- [A] frontend/src/components/LandingPage.test.tsx: mock fetchBackendBuild instead of fetchBackendVersion, resolving to a version and commit

No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests (Vitest, co-located): `version.test.ts` stubs `fetch` with `vi.stubGlobal` as today and keeps every existing version case retargeted to `fetchBackendBuild` (each now expecting `null`), plus commit cases: `{"version":"0.1.0","commit":"0123456789ab"}` gives `{version:"0.1.0",commit:"0123456"}`; `"abc12"` is kept as is; missing, `""`, `1` and `"unknown"` commit give `commit: null` with `version: "0.1.0"`. `AppFooter.test.tsx` mocks `../api/version`: success (`app-footer` text exactly `Task Notes v0.1.0 (0123456)`, `app-footer-commit` text ` (0123456)`); pending (never-resolving promise: text exactly `Task Notes`, no commit span); failure (`null`: text exactly `Task Notes`, no version or commit span); version with `commit: null` (text exactly `Task Notes v0.1.0`, no commit span, no `undefined`, `null` or `()`); the existing bundle-version and landmark cases kept.
  - Directory: `frontend/src/` co-located `*.test.ts(x)` (existing frontend convention; CLAUDE.md's `backend/tests/unit/` is the backend's)
  - Naming: `{module}.test.ts` and `{Component}.test.tsx`
- Integration tests: none added. No router, repository or migration changes; the commit field is already covered by `backend/tests/integration/test_version_integration.py` (TEST-09).
  - Directory: `backend/tests/integration/`
- E2E tests (Playwright): criterion 1 plus the feature's edge case. (a) `page.route("**/api/version", ...)` fulfills `{"version":"0.1.0","commit":"0123456789ab"}`, load `/`, assert `app-footer-commit` has text ` (0123456)` and `app-footer` contains `Task Notes v0.1.0 (0123456)`. Fulfilling the route is needed because the stack under test has no `BUILD_COMMIT`, so the real answer is `unknown`. (b) Edge case: fulfill `{"version":"0.1.0","commit":"unknown"}`, assert the footer reads exactly `Task Notes v0.1.0` and `app-footer-commit` has count 0. Locators: `data-testid`.
  - Directory: `e2e/tests/`
  - File: `TEST-10_footer_build_commit.spec.ts`
- UAT scenarios: one per criterion plus the unknown-commit edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit next to the version | E2E | — |
| 2 | Pending or failed: the version alone (or Task Notes when no version), never undefined or an error | Unit | verifying it needs no navigation or interaction: pending is held deterministically by a never-resolving mock and each failure path is a client parsing rule; the E2E edge case also covers the unknown commit |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | First 7 characters of the commit next to the version | Fulfill GET /api/version with a 12-character commit, load `/`, assert `app-footer-commit` reads ` (0123456)` | Given the backend reports commit 0123456789ab and version 0.1.0, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (0123456)" |
| 2 | Pending or failed shows the version alone, never undefined | covered at Unit, see Criterion coverage (E2E edge case covers the unknown commit) | Given the backend reports commit unknown, When I open the landing page, Then the footer reads "Task Notes v0.1.0" with no commit |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter tests, Then the success, pending and failure cases pass with 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: from the repository root, start the stack with a commit set: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` (frontend at http://localhost:5183, backend at http://localhost:8010).
1. Run `curl -s http://localhost:8010/api/version` → the output is `{"version":"0.1.0","commit":"0123456789ab"}`.
2. Open http://localhost:5183/ in a browser → the landing page with the heading "Task Notes" is shown.
3. Read the footer at the bottom of the page → it reads `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit step 1 printed.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error
Prerequisites: the stack running as in criterion 1; Chrome DevTools open.
1. In the DevTools Network tab set throttling to a custom profile with 10000 ms latency and reload http://localhost:5183/ → while `api/version` is pending, the footer reads exactly `Task Notes` (no version is known yet, TEST-08's loading answer), with no `undefined`, no `()` and no error text.
2. Wait for the request to finish → the footer changes to `Task Notes v0.1.0 (0123456)`. Set throttling back to "No throttling".
3. Right-click the `api/version` request, choose "Block request URL", and reload → the footer reads exactly `Task Notes`, visible, with no `undefined` and no error. Unblock the URL.
4. Restart the backend without a commit: `docker compose up -d backend` from a shell where `echo $BUILD_COMMIT` prints an empty line, then run `curl -s http://localhost:8010/api/version` → `"commit":"unknown"`.
5. Reload http://localhost:5183/ → the footer reads exactly `Task Notes v0.1.0`: the version alone, no `unknown`, no brackets, no `undefined`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`, and the AppFooter test names include a success case with the commit, a pending case and a failure case.
