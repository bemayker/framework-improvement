# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, wave 2). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What:** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes:** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates. Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 0 actionable comments on the ClickUp task; 50 bot notes dropped (run deliver-20261119T010710Z, recorded in `.claude/artifacts/TEST-10/decisions.md`) → Addressed by: nothing to act on.
- Merged since the last plan: n/a (fresh plan on main at 7c61eb74; the earlier TEST-10 attempt, PR #912, was reset off main and none of its code is on the current tree: `frontend/src/components/AppFooter.tsx` and `frontend/src/api/version.ts` read only TEST-08's version, and nothing reads `commit`) → planned against the current tree.
- Assumption (criterion 2, recorded instead of a question): the version and the commit arrive in the same `GET /api/version` response, so while it is pending or after it fails the version is not known either. "The version alone" is therefore read as "whatever TEST-08 shows in that state, with no commit": the footer keeps reading exactly `Task Notes` while pending and on failure (TEST-08's behaviour, unchanged). The literal "version alone" case is a successful response whose commit is TEST-09's `"unknown"` default, blank or missing: the footer then reads `Task Notes v{version}` with no commit.
- Assumption (format): the commit is shown in parentheses after the version, `Task Notes v0.1.0 (3f9a2c1)`. The ticket names no separator; parentheses keep TEST-08's `Task Notes v{version}` prefix intact, so its substring assertions keep holding.
- Assumption (no version, commit known): when the backend reports no version (`"unknown"` or blank, TEST-08 treats it as none), the footer stays `Task Notes` and does not show the commit on its own, because the criterion places the commit "next to the version".

## Plan Overview
Frontend only. The version API client (`frontend/src/api/version.ts`) already fetches `GET /api/version`; it now also reads the `commit` field TEST-09 added, normalises it (TEST-09's `"unknown"` sentinel, blank, or a non-string becomes `null`; otherwise cut to its first 7 characters) and returns `{ version, commit }`. `AppFooter` renders `Task Notes v{version} ({commit})` when both are present, `Task Notes v{version}` when the commit is absent, and `Task Notes` while pending, on failure, or with no version. No backend, no new dependency, no new component. Two existing test files that mock the client's old string return are updated to the new shape, and TEST-08's exact-text E2E assertion is relaxed so it still holds when `BUILD_COMMIT` is set.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `fetchBackendVersion()` keeps its name and its fetch/error behaviour, and returns `Promise<BackendVersionInfo | null>` with `type BackendVersionInfo = { version: string; commit: string | null }`. Returns `null` exactly where it returns `null` today (version `""` or `"unknown"`). Adds `UNKNOWN_BACKEND_COMMIT = "unknown"` (line comment: mirrors `DEFAULT_BUILD_COMMIT` in `backend/app/core/config.py`) and `COMMIT_DISPLAY_LENGTH = 7`. `commit` is `null` when the field is missing, not a string, blank, or `"unknown"`; otherwise `commit.slice(0, 7)`. A missing or malformed commit never throws: it degrades to the version alone (criterion 2). `VersionResponse` gains `commit: string`.
  - `frontend/src/components/AppFooter.tsx`: state becomes `BackendVersionInfo | null`; the render line becomes: no info → `Task Notes`; info with commit → `Task Notes v{version} ({commit})`; info without commit → `Task Notes v{version}`. `data-testid="app-footer"`, the `<footer>` landmark, `footerStyle` and the unmount guard are unchanged.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Consumed as-is from TEST-09 (no change):
- Method: GET
- URL: /api/version
- Request: none
- Response: 200, `{"version": "0.1.0", "commit": "3f9a2c1d8e7b"}`; `commit` is `BUILD_COMMIT` cut to 12 characters by the backend, or `"unknown"` when unset or blank. The frontend cuts it to 7 for display.

## Technology Selection
- Commit truncation: chose `String.prototype.slice(0, 7)` (standard library) over any formatting helper or dependency; nothing else is needed.
- No net-new component, module or dependency: the feature extends the existing `frontend/src/api/version.ts` client and `AppFooter` component, and its tests use the already-installed Vitest and Testing Library.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (commit reported as unknown)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: read and normalise `commit` (sentinel, blank, non-string to null; cut to 7), return `{ version, commit }`
- [A] frontend/src/api/version.test.ts: update the existing cases to the object return; add commit cases (cut to 7, unknown sentinel, missing or non-string commit)
- [A] frontend/src/components/AppFooter.tsx: render the commit in parentheses next to the version when present
- [A] frontend/src/components/AppFooter.test.tsx: success with commit, version alone without commit, pending and failure paths with the new mock shape, no `undefined` in any state
- [A] frontend/src/components/LandingPage.test.tsx: only the `../api/version` mock changes, to resolve `{ version: BACKEND_VERSION, commit: null }`; its assertions stay as they are
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: relax the exact `toHaveText` on line 23 to a pattern that allows an optional ` (sha7)` suffix, so TEST-08's spec stays true when `BUILD_COMMIT` is set

No lockfile changes: no dependency is added or changed. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: this feature changes no project structure, run configuration, dependency or test infrastructure (`BUILD_COMMIT` was already wired by TEST-09). `frontend/src/components/LandingPage.tsx` is not edited.

## Testing Strategy
- Unit tests: the version client's normalisation (`frontend/src/api/version.test.ts`, fetch stubbed) and the footer's three render states (`frontend/src/components/AppFooter.test.tsx`, client mocked). These are the Vitest component and client tests the frontend already uses, co-located per project standards.
  - Directory: `frontend/src/` (co-located `*.test.ts(x)`; CLAUDE.md's `backend/tests/unit/` applies to the backend only)
  - Naming: `{Module}.test.ts(x)`
- Integration tests: not warranted, one sentence: no endpoint, router, repository or migration changes (TEST-09 owns and already tests the endpoint).
  - Directory: backend/tests/integration/ (unused by this item)
- E2E tests: no new spec. No criterion needs navigation or interaction through the UI to verify; all three are render states of one component, covered by its component test. The local and CI E2E stack runs with `BUILD_COMMIT` unset, so a real-backend spec could only ever see the version-alone state. The one E2E change is keeping TEST-08's existing spec correct under the new footer text.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts (modified)
- UAT scenarios: one per criterion plus the unknown-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added. | Unit | `renders the version and the first 7 characters of the commit once /api/version resolves`, `returns the version and the commit cut to its first 7 characters` | It is a render of the response, with no navigation or interaction; the component test asserts the exact text, the client test the cut to 7 |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. | Unit | `renders the app name without a version while /api/version is pending`, `renders the app name without a version when /api/version is unreachable`, `renders the version alone when the backend reports no commit`, `returns a null commit when the backend reports the unknown commit sentinel`, `returns a null commit when the response carries no string commit` | Pending, failure and no-commit are component states reached by mocking the client; no UI interaction is involved |
| 3 | A component test covers the success, pending and failure paths. | Unit | `renders the version and the first 7 characters of the commit once /api/version resolves`, `renders the app name without a version while /api/version is pending`, `renders the app name without a version when /api/version is unreachable` | The criterion asks for a component test itself, which is the Vitest tier |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-char commit next to the version | covered at Unit, see Criterion coverage | Given the backend reports version 0.1.0 and commit 3f9a2c1d8e7b, When the landing page loads, Then the footer reads "Task Notes v0.1.0 (3f9a2c1)" |
| 2 | Pending or failed request shows the version alone, never undefined or an error | covered at Unit, see Criterion coverage | Given the backend is unreachable, When the landing page loads, Then the footer reads "Task Notes" and contains no "undefined", "null" or error text |
| 3 | A component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When it runs, Then the AppFooter success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker running; from the repository root, the stack started with a known commit: `BUILD_COMMIT=3f9a2c1d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a39 docker compose up -d --build`.
1. Open `http://localhost:8010/api/version` in the browser → the JSON reads `{"version":"0.1.0","commit":"3f9a2c1d8e7b"}`.
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading, the note form and the note list.
3. Scroll to the footer at the bottom of the page → it reads exactly `Task Notes v0.1.0 (3f9a2c1)`: the version, then the first 7 characters of the commit in parentheses.

### Criterion 2: Pending or failed request shows the version alone, never undefined or an error
Prerequisites: the stack from Criterion 1 is running.
1. With the stack running, stop the backend only: `docker compose stop backend`.
2. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no version, no commit, and no `undefined`, `null` or error text on the page footer.
3. Restart without a commit: `docker compose stop` then `docker compose up -d` with `BUILD_COMMIT` unset in your shell.
4. Open `http://localhost:8010/api/version` → `commit` reads `"unknown"`.
5. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown`.
Note: the pending state is too short to see by eye on a local stack; it is verified by the component test in Criterion 3.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: its summary reports no failed test and the command exits 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains the success test `renders the version and the first 7 characters of the commit once /api/version resolves`, the pending test `renders the app name without a version while /api/version is pending` and the failure test `renders the app name without a version when /api/version is unreachable`.
