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
- Comment (tracker): 57 comments read on the ClickUp task, all framework PR notices from earlier runs → Addressed by: not acted on because none states a requirement or a correction to the feature text.
- Assumption (criterion 2, recorded per `user_story_alignment.md` Section 4): version and commit arrive in the one `GET /api/version` response, so while that request is pending or after it fails no version is known either. TEST-08 defined those two states as the app name alone (`Task Notes`), and that stays. "The version alone" is read as: the footer never shows a commit it does not have, and it never shows `undefined`, `null`, `unknown` or an error message. Concretely: pending or failed request gives `Task Notes`; a successful response whose commit is missing, not a string, blank, or the backend's `unknown` sentinel gives `Task Notes v{version}` with no commit; only a usable commit gives `Task Notes v{version} ({first 7 chars})`.
- Assumption (display format): "next to the version" is rendered as the version span followed by ` (abc1234)` in its own span with `data-testid="app-footer-commit"`. The existing `app-footer-version` span keeps its exact text `v{version}`, so TEST-08's E2E spec (`toHaveText` on that span) and TEST-04's `toContainText` assertions keep passing unchanged.
- Assumption (truncation): the backend already caps the commit at 12 characters (TEST-09); the footer takes the first 7 of whatever it receives, so a commit shorter than 7 is shown whole.
- Merged since the last plan: n/a (fresh plan, based on main at 91202a21, which already holds TEST-08 and TEST-09).

## Plan Overview
Frontend only. The version client (`frontend/src/api/version.ts`) stops discarding the `commit` field TEST-09 added and returns `{ version, commit }`, with `commit` set to `null` when it is unusable. `AppFooter` stores that object and renders the first 7 characters of the commit in a new span after the version span. One request, no new dependency, no backend change.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `VersionResponse` gains `commit: string`. New exported type `BackendVersion = { version: string; commit: string | null }`. `getBackendVersion()` now resolves to `BackendVersion`. Version handling is unchanged (still rejects on a non-OK status, a missing, blank or `unknown` version). Commit is the trimmed `body.commit` when it is a non-blank string other than `unknown`, otherwise `null`; an unusable commit never rejects the call, because the version is still worth showing.
  - `frontend/src/components/AppFooter.tsx`: state becomes `BackendVersion | null`. Renders `Task Notes`, then `<span data-testid="app-footer-version"> v{version}</span>` (unchanged), then, only when `commit !== null`, `<span data-testid="app-footer-commit"> ({commit.slice(0, 7)})</span>`. The 7 is a named constant (`COMMIT_DISPLAY_LENGTH = 7`). Pending and failure paths are unchanged: the footer reads `Task Notes`.
  - `frontend/src/components/LandingPage.test.tsx`: its `getBackendVersion` mock resolves to `{ version: "9.9.9", commit: null }` instead of the string, because the return type changed; no assertion changes.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span inherits the footer's existing style (0.875rem, #5f5f5f); no new styles.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, TEST-09; consumed, not changed)
- Request: none
- Response: `{"version": "0.1.0", "commit": "3f9c2ab71d04"}`; `commit` is BUILD_COMMIT's first 12 characters, or `"unknown"` when unset or blank.
- Client contract (`getBackendVersion`): resolves `{ version: "0.1.0", commit: "3f9c2ab71d04" }`, or `{ version: "0.1.0", commit: null }` when the commit is missing, non-string, blank or `"unknown"`; rejects exactly as today on a failed request, a non-OK status or an unusable version.

## Technology Selection
- No net-new component, module or dependency: the feature extends the existing version client and `AppFooter`, and the truncation is `String.prototype.slice`, the standard library.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }`, commit normalised to `null` when unusable
- [A] frontend/src/api/version.test.ts: update existing expectations to the object shape; add commit cases
- [A] frontend/src/components/AppFooter.tsx: render the first 7 characters of the commit next to the version
- [A] frontend/src/components/AppFooter.test.tsx: mock the object shape; add success, pending, failure and no-commit cases for the commit
- [A] frontend/src/components/LandingPage.test.tsx: mock resolves the object shape (return type change only)

No dependency changes, so no lockfile. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. No new E2E spec (see Testing Strategy); the existing `e2e/tests/TEST-08_footer_app_version.spec.ts` and `e2e/tests/TEST-04_page_footer.spec.ts` are not modified, because the `app-footer-version` span keeps its exact text and the failure path still reads exactly `Task Notes`.

## Testing Strategy
- Unit tests: Vitest, beside the code. `version.test.ts` covers the client's commit normalisation; `AppFooter.test.tsx` covers the rendered success, pending, failure and no-commit paths.
  - Directory: `frontend/src/api/` and `frontend/src/components/` (tests beside the component, per project standards)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: not warranted, no repository, model, migration or endpoint changes (TEST-09's `backend/tests/integration/test_version_integration.py` already covers the endpoint).
  - Directory: backend/tests/integration/
- E2E tests: no new spec. No criterion needs navigation or interaction to verify: the footer renders on load with no user action, and a component test exercises every state, including the pending state a browser cannot hold reliably. The existing TEST-04 and TEST-08 specs keep running unchanged as the browser regression for the footer.
  - Directory: e2e/tests/
  - File: none for TEST-10
- UAT scenarios: one scenario per criterion plus one edge case (backend reports `unknown`).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit next to the version | Unit | `renders the first 7 characters of the commit next to the version`, `returns the commit the backend reports` | Verifying it needs no navigation or interaction: the footer renders on mount, and the component test asserts the exact rendered text from a mocked response |
| 2 | While pending or on failure the footer shows the version alone, never undefined or an error | Unit | `renders no commit while the request is pending`, `renders no commit when the backend is unreachable`, `renders the version alone when the backend reports no commit`, `returns a null commit when the backend reports none` | Verifying it needs no navigation or interaction: these are render states of one component, and the pending state is only deterministic with a never-resolving mock |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the first 7 characters of the commit next to the version`, `renders no commit while the request is pending`, `renders no commit when the backend is unreachable` | The criterion is itself a component-test requirement |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 commit characters next to the version | covered at Unit, see Criterion coverage | Given the backend runs with BUILD_COMMIT 3f9c2ab71d04e5a6b7c8d9e0f1a2b3c4d5e6f708 When I open the landing page Then the footer reads "Task Notes v0.1.0 (3f9c2ab)" |
| 2 | Pending or failed request shows no commit, never undefined or an error | covered at Unit, see Criterion coverage | Given the backend is stopped When I open the landing page Then the footer reads "Task Notes" only; Given BUILD_COMMIT is unset When I open the landing page Then the footer reads "Task Notes v0.1.0" |
| 3 | A component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend tests When I run AppFooter.test.tsx Then the run passes |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: the repository checked out on `feature/TEST-10-footer-build-commit`, Docker running, nothing listening on ports 8010 and 5183.
1. At the repository root run `BUILD_COMMIT=3f9c2ab71d04e5a6b7c8d9e0f1a2b3c4d5e6f708 docker compose up --build -d` → the backend and frontend containers report as started.
2. Run `curl -s http://localhost:8010/api/version` → the body is `{"version":"0.1.0","commit":"3f9c2ab71d04"}` (the version is whatever `backend/pyproject.toml` declares).
3. Open `http://localhost:5183/` in a browser and scroll to the footer → it reads `Task Notes v0.1.0 (3f9c2ab)`: the 7 characters `3f9c2ab`, after the version.

### Criterion 2: While the request is pending or fails, the footer shows the version alone, never undefined or an error
Prerequisites: as for Criterion 1.
1. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown`, parentheses or error text.
2. Run `docker compose up -d backend` with no `BUILD_COMMIT` in the shell (`unset BUILD_COMMIT` first, then `docker compose up --build -d`), then reload the page → the footer reads `Task Notes v0.1.0` with no parentheses and no `unknown`.
3. Open the browser's DevTools Network tab, set throttling to `Slow 3G`, and reload → before `/api/version` answers the footer reads `Task Notes`; when it answers, the version appears, with no commit as in step 2.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: `npm --prefix frontend install` has run.
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains the tests `renders the first 7 characters of the commit next to the version`, `renders no commit while the request is pending` and `renders no commit when the backend is unreachable`.
