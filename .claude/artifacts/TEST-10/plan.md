# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> The landing page footer shows the short build commit next to the version.
>
> Acceptance criteria:
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> Notes: Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates. Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): only earlier runs' bot "PR opened" notes → not acted on because they carry no requirement.
- Interpretation (criterion 2, recorded per the dispatch and `user_story_alignment.md` Section 4): the version and the commit arrive in the SAME `GET /api/version` response (TEST-09), so while that request is pending or after it fails there is no version to show. "The version alone" is therefore read as "the footer without any commit", i.e. TEST-08's recorded loading and failure state, which reads exactly `Task Notes`. TEST-08's states are kept unchanged.
- Interpretation (commit sentinel): TEST-09 returns `commit: "unknown"` when `BUILD_COMMIT` is unset or blank. `"unknown"` is exactly 7 characters, so slicing it would render `Task Notes v0.1.0 (unknown)`. It is treated like a failed commit: the footer shows the version alone (`Task Notes v0.1.0`). A missing, non-string or blank `commit` field is treated the same way, and never fails the version (the version is still a valid answer).
- Interpretation (format): the commit is rendered in parentheses after the version, `Task Notes v{version} ({7 chars})`, e.g. `Task Notes v0.1.0 (abcdef1)`. The criteria fix only "next to the version"; parentheses keep TEST-04's `toContainText(version)` and TEST-08's version text intact.
- Interpretation (backend "unknown" version): TEST-08 maps an unknown version to the name-only footer; that stays, and a known commit with an unknown version is not shown (the commit is shown only next to a version).
- Merged since the last plan: n/a (fresh plan, read on main at c9764f34, which already contains TEST-09 #908 and TEST-08 #910).

## Plan Overview
Frontend only. The version client (`frontend/src/api/version.ts`) is widened to return the commit TEST-09 already serves alongside the version, normalizing the backend's `"unknown"` commit and any unusable commit value to `null`. `AppFooter` renders `Task Notes v{version} ({first 7 chars of commit})` when both are known, `Task Notes v{version}` when only the version is known, and keeps TEST-08's `Task Notes` for pending, failure and an unknown version. No backend change: `GET /api/version` already returns `{"version", "commit"}` with the commit cut to 12 characters (`backend/app/services/version_service.py`).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `fetchBackendVersion()` keeps its name and its error behaviour (rejects on network failure, non-OK status, unusable version; resolves `null` on the unknown version sentinel) and now resolves `BackendVersion = { version: string; commit: string | null }`. `VersionResponse` gains `commit: string`. The commit is trimmed; blank, non-string, missing or the `"unknown"` sentinel (mirroring `DEFAULT_BUILD_COMMIT` in `backend/app/core/config.py`, with a line comment saying so) becomes `null`. The client returns the commit as served (up to 12 chars); shortening is a display concern and lives in the component.
  - `frontend/src/components/AppFooter.tsx`: state becomes `BackendVersion | null`; a `SHORT_COMMIT_LENGTH = 7` constant; render `APP_NAME` when state is null, `${APP_NAME} v${version}` when commit is null, otherwise `${APP_NAME} v${version} (${commit.slice(0, SHORT_COMMIT_LENGTH)})`. `data-testid="app-footer"`, the `<footer>` landmark and `footerStyle` unchanged.
- Routes: none.
- State management: unchanged local `useState` + `useEffect` with the `isMounted` guard already in `AppFooter`.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-09; consumed unchanged)
- Request: none
- Response: `{"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is `BUILD_COMMIT` cut to 12 characters, or `"unknown"` when unset.
- Client contract (frontend): `fetchBackendVersion(): Promise<{ version: string; commit: string | null } | null>`.

## Technology Selection
- Commit shortening: chose the standard `String.prototype.slice(0, 7)` over any formatting helper or dependency, because the standard library covers it in one call.
- Commit field parsing: chose to extend the existing `frontend/src/api/version.ts` client over a second client or a second request, because the commit arrives in the same response the footer already fetches.
- No net-new component, module or dependency is introduced otherwise.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright spec for criterion 1 (short commit next to the version, `/api/version` fulfilled via `page.route`) plus the edge case (an `"unknown"` commit shows the version alone)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }`; normalize the `"unknown"`, blank, missing or non-string commit to `null`
- [A] frontend/src/api/version.test.ts: update the success assertion to the new shape; add commit-normalization cases
- [A] frontend/src/components/AppFooter.tsx: render the first 7 characters of the commit next to the version; keep TEST-08's pending, failure and unknown-version states
- [A] frontend/src/components/AppFooter.test.tsx: update the mock to the new shape; add success-with-commit and unknown-commit tests; keep the pending and failure tests
- [A] frontend/src/components/LandingPage.test.tsx: update only the `fetchBackendVersion` mock's resolved value to the new `{ version, commit }` shape (LandingPage.tsx itself is not touched)

No dependency changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure (`BUILD_COMMIT` is already wired in docker-compose.yml by TEST-09).

## Testing Strategy
- Unit tests: Vitest, co-located with the frontend modules. `frontend/src/api/version.test.ts` (client parsing, real client body with `fetch` stubbed) and `frontend/src/components/AppFooter.test.tsx` (component, client mocked): success, pending, failure, unknown commit.
  - Directory: co-located under `frontend/src/` (project standards Layout; `backend/tests/unit/` is the backend's)
  - Naming: `{Module}.test.ts(x)` beside the module
- Integration tests: not warranted. No repository, model, migration or endpoint changes (`GET /api/version` is TEST-09's and already covered by `backend/tests/integration/`).
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one spec for criterion 1 and one edge-case spec, with `/api/version` fulfilled by `page.route` so the commit is deterministic (the E2E backend runs with `BUILD_COMMIT` unset, so its real commit is `"unknown"`).
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the unknown-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | `shows the short build commit next to the version`, `shows the first 7 characters of the backend commit next to the version`, `returns the version and the commit from the response` | — |
| 2 | While pending or on failure, the footer shows the version alone, never `undefined` or an error | Unit | `shows only the app name while the version request is pending`, `renders without a version when the version request fails`, `shows the version alone when the backend reports the commit as unknown`, `returns a null commit when the backend reports the commit as unknown`, `returns a null commit when the commit is missing or not a string` | verifying it needs no navigation or interaction: it is the component's render for a pending, rejected or sentinel client result, which the component test controls exactly |
| 3 | A component test covers the success, pending and failure paths | Unit | `shows the first 7 characters of the backend commit next to the version`, `shows only the app name while the version request is pending`, `renders without a version when the version request fails` | the criterion is itself a requirement on the component test tier |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Short commit next to the version | `page.route("**/api/version")` fulfils `{"version": "1.2.3", "commit": "abcdef123456"}`; `goto("/")`; expect `app-footer` to have text `Task Notes v1.2.3 (abcdef1)`. Edge: commit `"unknown"` gives exactly `Task Notes v1.2.3` | Given the backend reports commit abcdef123456 When I open the landing page Then the footer reads Task Notes v1.2.3 (abcdef1) |
| 2 | Version alone while pending or on failure | covered at Unit, see Criterion coverage | Given the version request fails When I open the landing page Then the footer reads Task Notes with no undefined or error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite When I run AppFooter.test.tsx Then the success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: the stack is started from the repo root with `BUILD_COMMIT=0123456789abcdef docker compose up -d --build`; backend/pyproject.toml declares version `0.1.0`.
1. Open `http://localhost:8010/api/version` in a browser → the body reads `{"version":"0.1.0","commit":"0123456789ab"}`.
2. Open `http://localhost:5183/` → the landing page shows the `Task Notes` heading.
3. Scroll to the footer at the bottom of the page → it reads exactly `Task Notes v0.1.0 (0123456)`: seven commit characters, in parentheses, after the version.

### Criterion 2: While pending or on failure, the footer shows the version alone
Prerequisites: the stack from Criterion 1 is running.
1. Open `http://localhost:5183/`, open the browser DevTools Network tab, right-click the `version` request and choose "Block request URL", then reload → the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text.
2. Remove the block in DevTools, set Network throttling to "Slow 3G" and reload → while the `version` request is still pending the footer reads `Task Notes`; once it completes it reads `Task Notes v0.1.0 (0123456)`.
3. Stop the stack, start it again without the variable (`docker compose up -d --build`), and reload `http://localhost:5183/` → `/api/version` returns `"commit":"unknown"` and the footer reads exactly `Task Notes v0.1.0`, with no `(unknown)`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repo root run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` → the run lists `shows the first 7 characters of the backend commit next to the version`, `shows only the app name while the version request is pending` and `renders without a version when the version request fails`; its summary line reports no failed test and the command exits 0.
