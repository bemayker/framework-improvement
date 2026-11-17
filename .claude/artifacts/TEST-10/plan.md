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
- Comment (tracker): every comment on the task is a framework "PR opened" notice from earlier runs → not acted on because none carries feedback on the item's content (dispatch prompt: "none actionable").
- Merged since the last plan: n/a (fresh plan, no previous plan artifact; branched from current main at 82b14518, which already holds TEST-08 #830 and TEST-09 #829).
- Assumption (no comment, recorded per `user_story_alignment.md` Section 4): criterion 2's "the version alone" is read against the code as it stands. The version and the commit arrive in the SAME response (`GET /api/version` returns `{"version": ..., "commit": ...}`), so while that request is pending or after it fails there is no version either: the footer keeps TEST-08's exact text `Task Notes` (no `v`, no commit, no `undefined`, no error text). The literal "version alone" state is the case where the request succeeds but carries no usable commit (missing, non-string, empty, or the backend's `unknown` sentinel from `DEFAULT_BUILD_COMMIT`): the footer then reads `Task Notes v{version}` with no commit. Both are covered.
- Assumption: the backend already cuts the commit to 12 characters (`version_service.COMMIT_LENGTH`); the frontend cuts it to 7 for display. When the backend version is the `unknown` sentinel (client returns null today), no commit is shown either, since the criterion places the commit "next to the version".

## Plan Overview
Frontend-only change to two existing modules. The version API client `frontend/src/api/version.ts` reads the `commit` field TEST-09 added and returns `{ version, commit }`, where `commit` is the first 7 characters or `null` when the backend reports none (missing, non-string, empty, or `unknown`). A bad `commit` never throws: the version still displays. `AppFooter.tsx` renders the commit in a new sibling span after the existing version span, so the TEST-08 span and its `data-testid="app-footer-version"` text (` v{version}`) are unchanged and TEST-08's E2E spec keeps passing. Rendered text on success: `Task Notes v0.1.0 (abc1234)`. No backend, no new dependency, no new route.

## Frontend Plan
- Components to create/modify: `frontend/src/components/AppFooter.tsx`: state holds `VersionInfo | null` instead of `string | null`; renders `{APP_NAME}`, then `<span data-testid="app-footer-version"> v{info.version}</span>` exactly as today, then, only when `info.commit` is a string, `<span data-testid="app-footer-commit"> ({info.commit})</span>`. Pending, failure and the version-unknown sentinel render exactly `Task Notes`, as today.
- API client: `frontend/src/api/version.ts`: `VersionResponse` gains `commit: string`; new exported type `VersionInfo = { version: string; commit: string | null }`; `getVersion(): Promise<VersionInfo | null>`; new constants `SHORT_COMMIT_LENGTH = 7` and `UNRESOLVED_BACKEND_COMMIT = "unknown"` (the backend's `DEFAULT_BUILD_COMMIT`). Existing error behaviour for a non-OK status or a bad `version` is unchanged (throws); a bad or absent `commit` maps to `null`.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span inherits the footer's existing style (`fontSize 0.875rem`, `color #5f5f5f`); no new styling.

## Backend Plan
No backend changes required. `GET /api/version` already returns `commit` (TEST-09, `backend/app/routers/version.py`, `backend/app/schemas/version.py`).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (unchanged, consumed from `API_BASE_URL`)
- Request: none
- Response: `{"version": "0.1.0", "commit": "0123456789ab"}` (commit is up to 12 characters, or `"unknown"` when `BUILD_COMMIT` is unset)
- Client result (`getVersion`): `{ version: "0.1.0", commit: "0123456" }`; `{ version: "0.1.0", commit: null }` when commit is `unknown`, missing, non-string or empty; `null` when version is `unknown`; throws on a non-OK status or a missing/empty/non-string version (unchanged).

## Technology Selection
- Cutting the commit to 7 characters: chose `String.prototype.slice(0, 7)` (standard library) over any formatting helper or dependency; nothing else is needed.
- No net-new component, module or dependency otherwise: the change extends the existing `getVersion` client and `AppFooter` component.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright specs for the commit next to the version (route-fulfilled `/api/version` body) and the version-alone edge case
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script written by build-feature Section 14 step 3

### Modified files
- [A] frontend/src/api/version.ts: read `commit`, return `VersionInfo | null`, cut commit to 7 characters, map unusable commit to null
- [A] frontend/src/api/version.test.ts: update existing cases to the new return shape; add commit cases
- [A] frontend/src/components/AppFooter.tsx: render the short commit in a sibling span `app-footer-commit` after the version span
- [A] frontend/src/components/AppFooter.test.tsx: update mocks to the `VersionInfo` shape; add success, pending, failure and no-commit cases for the commit

No dependency is added, so no lockfile changes. README.md and docs/DEVELOPMENT.md need no edit: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: Vitest, frontend only. `version.test.ts` covers the client's commit parsing (7-character cut, `unknown`/missing/empty/non-string commit mapped to null, version still returned). `AppFooter.test.tsx` covers the success, pending and failure paths and the version-alone path.
  - Directory: co-located under `frontend/src/` (project-standards Layout; `backend/tests/unit/` is backend-only and unaffected)
  - Naming: `{Name}.test.tsx` / `{module}.test.ts`
- Integration tests: no new tests. No backend code changes; `GET /api/version`'s `commit` is already covered by TEST-09's `backend/tests/integration/test_version_integration.py`.
  - Directory: backend/tests/integration/
- E2E tests: one spec file, two tests. The success test fulfils `/api/version` (exact pathname match, as TEST-08's spec does) with `{"version": "0.1.0", "commit": "abc1234def56"}`, because the local stack runs with `BUILD_COMMIT` unset (commit `unknown`) and a seeded body is the only deterministic data. The edge-case test fulfils `{"version": "0.1.0", "commit": "unknown"}` and asserts the version alone.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (commit `unknown`).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added. | E2E | `shows the first 7 characters of the build commit next to the version`, `renders the first 7 characters of the commit next to the version`, `returns the version and the commit cut to 7 characters` | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. | Unit | `shows no commit while the version request is pending`, `shows no commit when the version request fails`, `shows the version alone when the backend reports no commit`, `returns a null commit when the backend reports the unknown sentinel` | verifying it needs no navigation or interaction: pending and failure are promise states a component test drives deterministically (the E2E edge spec `shows the version alone when the backend reports the unknown commit` adds browser evidence for the version-alone case) |
| 3 | A component test covers the success, pending and failure paths. | Unit | `renders the first 7 characters of the commit next to the version`, `shows no commit while the version request is pending`, `shows no commit when the version request fails` | the criterion is itself about component tests: it is satisfied by their existence and passing, not by a browser flow |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows first 7 commit characters next to the version | Fulfil `/api/version` with version `0.1.0` and commit `abc1234def56`, open `/`, assert `app-footer` text `Task Notes v0.1.0 (abc1234)` and `app-footer-commit` text ` (abc1234)` | Given the backend reports commit `abc1234def56` When I open the landing page Then the footer reads `Task Notes v0.1.0 (abc1234)` |
| 2 | Pending or failure shows no commit, never `undefined` or an error | covered at Unit, see Criterion coverage; E2E edge spec fulfils commit `unknown` and asserts `Task Notes v0.1.0` with no `app-footer-commit` | Given the backend is stopped When I open the landing page Then the footer reads `Task Notes` with no `undefined` or error text |
| 3 | A component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the repository When I run the AppFooter component tests Then they pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker running; repository on the TEST-10 branch (or `main` after merge); `.env` copied from `.env.example`; ports 5183 and 8010 free.
1. From the repository root run `BUILD_COMMIT=abc1234def567890abc1234def567890abc12345 docker compose up -d --build` → the db, backend and frontend containers start.
2. Run `curl -s http://localhost:8010/api/version` → the output is `{"version":"0.1.0","commit":"abc1234def56"}` (version is the current `[project].version` of `backend/pyproject.toml`).
3. Open `http://localhost:5183/` and scroll to the footer → it reads `Task Notes v0.1.0 (abc1234)`: exactly the first 7 characters of the commit, after the version.
4. In DevTools Elements, inspect the footer → the version span (`data-testid="app-footer-version"`) holds ` v0.1.0` and a separate span `data-testid="app-footer-commit"` holds ` (abc1234)`.

### Criterion 2: Pending or failed request shows no commit, never `undefined` or an error
Prerequisites: the stack from Criterion 1 is running with `BUILD_COMMIT=abc1234def567890abc1234def567890abc12345`.
1. In DevTools Network, set throttling to `Slow 3G` and reload `http://localhost:5183/` → while `/api/version` is pending, the footer reads exactly `Task Notes`: no commit, no `undefined`, no loading or error text.
2. Wait for the request to finish → the footer changes to `Task Notes v0.1.0 (abc1234)`. Set throttling back to `No throttling`.
3. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`: no `v`, no parentheses, no `undefined`, no `null`, no error text.
4. Run `docker compose start backend`, then rebuild without a commit: `docker compose up -d --build backend` with `BUILD_COMMIT` unset in the shell and `.env` → `curl -s http://localhost:8010/api/version` shows `"commit":"unknown"`.
5. Reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0`, the version alone: no parentheses, no `unknown`, no `undefined`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: no failed or errored test on its summary line, and it exits 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains the tests `renders the first 7 characters of the commit next to the version` (success), `shows no commit while the version request is pending` (pending) and `shows no commit when the version request fails` (failure).
