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
- Comment (tracker): 37 comments read, all earlier runs' automated PR notes → Addressed by: not acted on because none carries feedback on this item's scope or criteria.
- Assumption (criterion 2, ambiguity): the version and the commit come from the same `GET /api/version` response, so while that request is pending or after it fails there is no version to show either. "Shows the version alone" is read as "shows no commit and keeps TEST-08's own pending/failure rendering", which is exactly the app name `Task Notes` with no version span, no commit span, and no `undefined`, `null`, `unknown` or error text. → Addressed by: AppFooter keeps TEST-08's pending/failure output unchanged and adds the commit only on a successful response.
- Assumption (no usable commit): when the response succeeds but `commit` is missing, not a string, blank, or the backend sentinel `unknown` (TEST-09's default when `BUILD_COMMIT` is unset), the footer shows the version alone (`Task Notes v0.1.0`). A missing `commit` field does not fail the request, because the version is still valid. → Addressed by: the client returns `commit: null` in those cases.
- Assumption (no version, commit present): the commit is shown only next to a displayed version, since criterion 1 places it "next to the version". When the version is null (backend sentinel or blank), the footer is `Task Notes` alone, as TEST-08 renders it today.
- Merged since the last plan: n/a (fresh plan, branched from current main f2499aa, which already contains TEST-08 and TEST-09).

## Plan Overview
Frontend-only change to the existing footer. The version API client (`frontend/src/api/version.ts`, TEST-08) is extended to read the `commit` field TEST-09 added to `GET /api/version` and to cut it to its first 7 characters; it returns both values in one object so the footer still makes exactly one request. `AppFooter.tsx` renders the short commit in its own span, after the version span: `Task Notes v0.1.0 (3f9c2a7)`. Pending, failure, unknown commit and unknown version all render without the commit span. No backend, route, schema or dependency change: the backend already serves `{"version", "commit"}` with the commit cut to 12 characters or `unknown`.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: rename `getBackendVersion(): Promise<string | null>` to `getBackendVersionInfo(): Promise<BackendVersionInfo>` where `type BackendVersionInfo = { version: string | null; commit: string | null }`. Extend `VersionResponse` to `{ version: string; commit?: string }`. Add `export const BACKEND_UNKNOWN_COMMIT = "unknown"` (mirrors `UNKNOWN_COMMIT` in `backend/app/services/version_service.py`) and `export const SHORT_COMMIT_LENGTH = 7`. Version handling is unchanged (throws on non-OK, on a body without a string `version`, and on a network error; null for blank or `unknown`). Commit handling: if `body.commit` is a string, trim it; blank or equal to `unknown` gives `null`; otherwise `commit.slice(0, SHORT_COMMIT_LENGTH)`. A missing or non-string `commit` gives `null` and never throws.
  - `frontend/src/components/AppFooter.tsx`: hold `const [info, setInfo] = useState<BackendVersionInfo | null>(null)`; on success set it, on failure set `null` (existing comment kept). Render `{APP_NAME}`, then `<span data-testid="app-version"> v{version}</span>` when `info?.version`, then `<span data-testid="app-commit"> ({commit})</span>` only when both `info?.version` and `info?.commit` are non-null. The existing `data-testid="app-footer"`, `contentinfo` landmark and `footerStyle` are untouched.
- Routes: none.
- State management: local component state in `AppFooter`, as TEST-08 already does; one fetch on mount with the existing `isMounted` guard.
- Design reference notes: AI freestyle. The commit span inherits the footer's existing style (`fontSize 0.875rem`, `color #5f5f5f`) with no new style values.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-09; unchanged)
- Request: no body, no parameters
- Response: 200 `{"version": "0.1.0", "commit": "3f9c2a71b0de"}`; `commit` is at most 12 characters, or `"unknown"` when `BUILD_COMMIT` is unset. The frontend displays `commit.slice(0, 7)`, here `3f9c2a7`.
- Client contract (`frontend/src/api/version.ts`): `getBackendVersionInfo()` resolves to `{"version": "0.1.0", "commit": "3f9c2a7"}`, or with `commit: null` when the commit is missing, blank or `unknown`, and with `version: null` when the version is blank or `unknown`; rejects on network error, non-OK status, or a body with no string `version`.

## Technology Selection
- Short-commit cut: chose the standard `String.prototype.slice(0, 7)` inside the existing client over any helper module or dependency, because the language covers it.
- Commit display: chose a plain `<span>` inside the existing footer over a new component, because one span needs no component of its own.
- No net-new module or dependency: the existing client (`frontend/src/api/version.ts`), React state and Vitest + Testing Library setup cover everything.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: read `commit`, cut it to 7 characters, return `{ version, commit }` from the renamed `getBackendVersionInfo`
- [A] frontend/src/api/version.test.ts: update existing cases to the new return shape and add the commit cases named under Criterion coverage
- [A] frontend/src/components/AppFooter.tsx: render the `app-commit` span after the version on success only
- [A] frontend/src/components/AppFooter.test.tsx: mock `getBackendVersionInfo`; add the commit success and no-commit cases; extend the pending and failure cases to assert no `app-commit` span
- [A] frontend/src/components/LandingPage.test.tsx: mock `getBackendVersionInfo` with `{ version: "4.5.6", commit: null }` instead of `getBackendVersion` with a string (otherwise its footer test breaks on the new shape)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: loosen the exact footer-text assertion `toHaveText("Task Notes v{version}")` to `toContainText`, so it still passes when the backend is built with `BUILD_COMMIT` set and the footer carries a commit suffix
No dependency manifest changes, so no lockfile entry.
No `README.md` or `docs/DEVELOPMENT.md` edit: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: Vitest + Testing Library, colocated with the source under `frontend/src/` (the project's existing frontend convention; CLAUDE.md's unit directory and naming are the backend's). Client parsing in `frontend/src/api/version.test.ts`; footer rendering for success, pending, failure and no-commit in `frontend/src/components/AppFooter.test.tsx`.
  - Directory: `frontend/src/api/`, `frontend/src/components/`
  - Naming: `{module}.test.ts(x)` beside the module
- Integration tests: none warranted (testing_standards.md Section 6): no repository, model, migration or endpoint changes; `GET /api/version` is already covered by TEST-09's integration test.
- E2E tests: no new spec, because no criterion's covering tier is E2E (table below). One existing assertion in `e2e/tests/TEST-08_footer_app_version.spec.ts` is loosened from exact text to contains-text so that spec stays correct when a commit is shown.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-08_footer_app_version.spec.ts` (modified only)
- UAT scenarios: one scenario per criterion plus an edge case (backend built without `BUILD_COMMIT` shows the version alone).
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added. | Unit | `renders the first 7 characters of the commit next to the version`, `returns the version and the commit cut to its first 7 characters` | verifying it needs no navigation or interaction: it is a render of the client's parsed response, and the CI backend runs without `BUILD_COMMIT` so a browser run would only ever see `unknown` |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. | Unit | `renders only the app name while the version request is pending`, `renders only the app name when the version request fails`, `renders the version alone when the backend reports no commit`, `returns a null commit when the backend reports the unknown commit sentinel` | verifying it needs no navigation or interaction: pending and failure are request states a mocked client reproduces deterministically; the unreachable-backend browser path is already TEST-08's E2E spec |
| 3 | A component test covers the success, pending and failure paths. | Unit | `renders the first 7 characters of the commit next to the version`, `renders only the app name while the version request is pending`, `renders only the app name when the version request fails` | the criterion asks for a component test, which is the unit tier by definition |

Other client cases the builder adds under the same file: `returns a null commit when the response has no commit field`, `returns a null commit when the backend reports a blank commit`.

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | covered at Unit, see Criterion coverage | Given the backend is built with BUILD_COMMIT 3f9c2a71b0de4c5e When I open the landing page Then the footer reads "Task Notes v0.1.0 (3f9c2a7)" |
| 2 | Pending or failed request shows the version alone, never undefined or an error | covered at Unit, see Criterion coverage | Given the backend is stopped When I open the landing page Then the footer reads "Task Notes" with no commit, "undefined" or error text |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter tests Then 0 failed |
| edge | Backend without BUILD_COMMIT | covered at Unit (`renders the version alone when the backend reports no commit`) | Given the backend is built with BUILD_COMMIT unset When I open the landing page Then the footer reads "Task Notes v0.1.0" |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
Prerequisites: Docker running, repository on branch `feature/TEST-10-footer-build-commit`, host ports 5183, 8010 and 5442 free, `.env` with no `BUILD_COMMIT` line.
1. From the repository root run `BUILD_COMMIT=3f9c2a71b0de4c5e8a9f00112233445566778899 docker compose up -d --build` → all three services start; `docker compose ps` shows `db` healthy and `backend` and `frontend` running.
2. Run `curl -s http://localhost:8010/api/version` → body is `{"version":"0.1.0","commit":"3f9c2a71b0de"}` (version as declared in `backend/pyproject.toml`).
3. Open `http://localhost:5183/` in a browser and look at the footer at the bottom of the landing page → it reads `Task Notes v0.1.0 (3f9c2a7)`: the first 7 characters of the commit, in parentheses, directly after the version.
4. Inspect the footer element in dev tools → a span with `data-testid="app-commit"` holds ` (3f9c2a7)` and follows the `data-testid="app-version"` span.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
Prerequisites: the stack from Criterion 1 running.
1. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`; no commit, no `undefined`, `null`, `unknown` or error text, and the rest of the page still renders.
2. In dev tools Network tab set throttling to `Slow 3G`, run `docker compose start backend`, and reload `http://localhost:5183/` → while the `/api/version` request is still in flight the footer reads `Task Notes` only; once it completes the footer reads `Task Notes v0.1.0 (3f9c2a7)`.
3. Edge, no commit configured: run `docker compose build backend` with `BUILD_COMMIT` unset in the shell, then `docker compose up -d backend`, and reload `http://localhost:5183/` → `curl -s http://localhost:8010/api/version` shows `"commit":"unknown"` and the footer reads `Task Notes v0.1.0`, the version alone with no parentheses.

### Criterion 3: A component test covers the success, pending and failure paths.
Not a UI behaviour: the observable check is the test run.
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → summary shows `0 failed`, and the output lists `renders the first 7 characters of the commit next to the version`, `renders only the app name while the version request is pending` and `renders only the app name when the version request fails`.
