# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What:** The landing page footer shows the short build commit next to the version.
>
> **Notes:** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): none. The dispatch reports the item's tracker comments as none actionable, so no comment changes this plan.
- Merged since the last plan: n/a (fresh plan, no earlier plan for TEST-10; planned against plan base 043121a, which already holds TEST-08 and TEST-09).
- Assumption (criterion 2, "the version alone" while pending or failed): version and commit arrive in one `GET /api/version` response, so while it is pending, or when the whole request fails, there is no version to show either. The footer then shows exactly what TEST-08 shows today, `Task Notes`, with no commit, no `undefined`, no `null` and no error text. Where the request succeeds with a usable version but no usable commit, the footer shows the version alone, `Task Notes v0.1.0`. The commit is never shown without a version.
- Assumption (what counts as "no commit"): `commit` missing, not a string, empty, or the backend sentinel `unknown` (TEST-09's default when `BUILD_COMMIT` is unset, `backend/app/core/config.py` `DEFAULT_BUILD_COMMIT`) are all treated as no commit. Without this, an unset `BUILD_COMMIT` would render `Task Notes v0.1.0 (unknown)`, because `unknown` happens to be 7 characters long. The sentinel is matched as a named constant in the client, as TEST-08 already does for the version.
- Assumption (format): `Task Notes v{version} ({first 7 chars of commit})`, for example `Task Notes v0.1.0 (3f9c2a1)`. This is the format `docs/DEVELOPMENT.md` already documents for the footer (the "page footer shows the backend's version" paragraph); the only doc change is adding the `unknown` case to it.
- Assumption (where the 7-character cut happens): the backend already shortens to 12 characters (TEST-09 `COMMIT_LENGTH`). The client returns the commit as the backend reported it, and `AppFooter` cuts it to 7 for display with a named constant, because 7 is a display choice of this footer.
- Assumption (TEST-08's E2E spec is left untouched): `e2e/tests/TEST-08_footer_app_version.spec.ts` asserts the exact text `Task Notes v{version}`. The E2E stack runs with `BUILD_COMMIT` unset (`docker-compose.yml` passes `${BUILD_COMMIT:-}`, and no CI workflow sets it), so the backend reports `unknown`, the footer shows the version alone, and that assertion stays true. `e2e/tests/TEST-04_page_footer.spec.ts` uses `toContainText(version)` and stays true with or without a commit. If a later change sets `BUILD_COMMIT` for the E2E stack, the TEST-08 spec will need its expectation widened; that is out of this item's minimal scope.

## Plan Overview
Frontend only. `frontend/src/api/version.ts`'s `fetchBackendVersion()` changes its result from `string | null` to `BackendVersion | null`, where `BackendVersion` is `{ version: string; commit: string | null }`: it still resolves to `null` on every failure TEST-08 handles (network error, 5 s timeout, non-2xx, malformed body, `version` missing, empty or `unknown`), and now also reads `commit`, setting it to `null` when it is missing, not a string, empty or `unknown`. `AppFooter` holds that result in its existing state and renders `Task Notes` (pending or failed), `Task Notes v{version}` (no usable commit), or `Task Notes v{version} ({commit first 7})`. No backend change: TEST-09 already returns `commit` from `GET /api/version`. `LandingPage.tsx` is not touched; only its test's mock of the client changes shape. One sentence in `docs/DEVELOPMENT.md` gains the `unknown` case.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): export `interface BackendVersion { version: string; commit: string | null }`. `fetchBackendVersion(): Promise<BackendVersion | null>`. Keep the URL, `AbortSignal.timeout(REQUEST_TIMEOUT_MS)`, the never-rejects contract and every existing `null` case unchanged. Add a commit read: `commit` is used only when it is a non-empty string other than the `UNKNOWN_COMMIT = "unknown"` constant, otherwise `null`. Update the doc comment.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `useState<BackendVersion | null>(null)`; the fetch-on-mount effect and `isMounted` guard stay. Add `SHORT_COMMIT_LENGTH = 7`. Render `APP_NAME` when the state is `null`; otherwise `${APP_NAME} v${version}`, followed by ` (${commit.slice(0, SHORT_COMMIT_LENGTH)})` only when `commit` is non-null. Keep the `<footer>` element, `data-testid="app-footer"` and `footerStyle` unchanged.
- Routes: none.
- State management: the existing local state in `AppFooter`, now holding the client's object instead of a string.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit is plain text inside the existing footer and inherits its existing style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`), unchanged; no new styled element.

## Backend Plan
No backend changes required. `GET /api/version` already returns `commit` (TEST-09: the first 12 characters of `BUILD_COMMIT`, `unknown` when unset or blank).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-05 and TEST-09; consumed, not changed)
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0", "commit": "3f9c2a1b7d4e"}`. `version` is `unknown` when the backend cannot read its package metadata; `commit` is `unknown` when `BUILD_COMMIT` is unset or blank, otherwise at most 12 characters.
- Client result (frontend-internal): `fetchBackendVersion()` resolves to `{ version: "0.1.0", commit: "3f9c2a1b7d4e" }`, to `{ version: "0.1.0", commit: null }` when the commit is missing, non-string, empty or `unknown`, and to `null` on any failure that leaves no usable version.

## Technology Selection
- Commit read in `frontend/src/api/version.ts`: chose extending the existing native `fetch` client and its single request over a second endpoint call or an HTTP library, because the commit arrives in the response the footer already fetches.
- Short commit display: chose the standard `String.prototype.slice(0, 7)` over a formatting dependency; nothing else is needed.
- No net-new component, module or dependency: this item modifies two existing modules and adds nothing to `package.json`.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-10_footer-build-commit.feature: Gherkin scenarios, one per criterion plus the edge case of a backend reporting commit `unknown`
- [G] e2e/uat/scripts/TEST-10_footer-build-commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }` or null; read `commit`, null when missing, non-string, empty or `unknown`
- [A] frontend/src/api/version.test.ts: update the existing cases to the object result; add commit present, commit missing, commit non-string, commit empty and commit `unknown` cases; replace "ignores fields it does not use" with a commit-present assertion
- [A] frontend/src/components/AppFooter.tsx: hold the client object, render the first 7 characters of the commit in parentheses after the version when present
- [A] frontend/src/components/AppFooter.test.tsx: success path (`Task Notes v0.1.0 (3f9c2a1)` from a 12-character commit), version without commit, pending path (`Task Notes`, no `undefined`), failure path (`Task Notes`, no `undefined`, `null` or error); landmark test kept with the new mock shape
- [A] frontend/src/components/LandingPage.test.tsx: change the `fetchBackendVersion` mock to resolve the object shape so its footer assertion keeps passing
- [Docs] docs/DEVELOPMENT.md: in the footer paragraph, add that a commit reported as `unknown` also leaves just the version

No dependency manifest changes, so no lockfile entry. `README.md` needs no edit: no project structure, run configuration, dependency or test infrastructure change.

## Testing Strategy
- Unit tests (frontend, Vitest): `fetchBackendVersion` (object result; every existing null case; commit present, missing, non-string, empty and `unknown`), and `AppFooter` with the client mocked (success, version without commit, pending, failure). `LandingPage.test.tsx` mock updated to the new shape.
  - Directory: next to the source, `frontend/src/api/` and `frontend/src/components/` (the existing frontend convention, `*.test.ts(x)`; CLAUDE.md's unit directory names the backend tests only)
  - Naming: `{module}.test.ts` and `{Component}.test.tsx`
- Integration tests: not warranted. No backend code changes; `GET /api/version`'s `commit` is already covered by TEST-09's `backend/tests/integration/test_version_integration.py`.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion needs navigation or interaction through the UI (see Criterion coverage); the footer's browser wiring to `GET /api/version` stays covered by the existing TEST-08 and TEST-04 specs, which this item leaves untouched (see Re-Plan Feedback).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: one scenario per criterion plus the commit-`unknown` edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from GET /api/version, next to the version | Unit | verifying it needs no navigation or interaction: it is a render rule asserted on exact footer text in AppFooter.test.tsx, plus the client reading `commit` in version.test.ts; the endpoint is already covered by TEST-09's integration test |
| 2 | While pending or failed, the footer shows the version alone, never undefined or an error | Unit | verifying it needs no navigation or interaction: pending and failure are client states (an unresolved promise, a null result) asserted on exact text in AppFooter.test.tsx |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test, AppFooter.test.tsx |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | covered at Unit, see Criterion coverage | Given the backend runs with BUILD_COMMIT 3f9c2a1b7d4e..., When I open the landing page, Then the footer reads "Task Notes v0.1.0 (3f9c2a1)" |
| 2 | Pending or failed request shows no commit, no undefined, no error | covered at Unit, see Criterion coverage | Given /api/version is unreachable, When I open the landing page, Then the footer reads exactly "Task Notes" |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend suite, When AppFooter.test.tsx runs, Then its success, pending and failure tests pass |
| edge | Backend reports commit `unknown` | covered at Unit (version.test.ts) | Given the backend runs without BUILD_COMMIT, When I open the landing page, Then the footer reads "Task Notes v0.1.0" with no parentheses |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: repository on branch `feature/TEST-10-footer-build-commit`; Docker running; nothing else bound to ports 8010 and 5183.
1. From the repo root, run `BUILD_COMMIT=3f9c2a1b7d4e5f60718293a4b5c6d7e8f9012345 docker compose up -d --build` → the backend and frontend containers report as started.
2. Open `http://localhost:8010/api/version` in the browser → the body reads `{"version":"0.1.0","commit":"3f9c2a1b7d4e"}` (version is whatever `[project].version` in `backend/pyproject.toml` says).
3. Open `http://localhost:5183/` and scroll to the bottom → the footer reads `Task Notes v0.1.0 (3f9c2a1)`: the version, a space, then the first 7 characters of the commit in parentheses.
4. Run `docker compose up -d backend` from a shell where `BUILD_COMMIT` is not exported and `.env` does not set it, then reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, with no `(unknown)` and no empty parentheses.

### Criterion 2: While the request is pending or fails, the footer shows no commit, never undefined or an error
Prerequisites: stack up as in Criterion 1 step 1; Chrome with DevTools.
1. Open DevTools → Network → throttling dropdown → Add custom profile with latency `4000` ms, select it, then reload `http://localhost:5183/` → for the first seconds the footer reads exactly `Task Notes`, with no `v`, no `undefined`, no `null` and no `(`.
2. Wait for the `api/version` request to finish → the footer changes to `Task Notes v0.1.0 (3f9c2a1)`. Set throttling back to `No throttling`.
3. Run `docker compose stop backend` (the backend service name in `docker-compose.yml`), reload `http://localhost:5183/` and wait up to 5 seconds → the footer reads exactly `Task Notes`, with no error text, no `undefined` and no commit.
4. Run `docker compose start backend` and reload → the footer reads `Task Notes v0.1.0 (3f9c2a1)` again.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → expected `0 failed`, and the output lists AppFooter tests for the success path (version with commit), the pending path and the failure path.
2. Open `frontend/src/components/AppFooter.test.tsx` → the success test asserts the text `Task Notes v0.1.0 (3f9c2a1)`, the pending test uses a never-resolving client promise, and the failure test uses a client resolving `null` and asserts the text is exactly `Task Notes`.
