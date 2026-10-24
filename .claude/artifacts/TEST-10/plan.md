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
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. (Interpreted, see `## Re-Plan Feedback`: pending and failure keep TEST-08's `Task Notes` rendering; "version alone" is the rendering when the request succeeds but carries no usable commit.)
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Assumption (criterion 2, no comment carries it; recorded instead of a blocking question per `user_story_alignment.md` Section 4): the version and the commit arrive in the **same** `GET /api/version` response, so while that request is pending, or when it fails, there is no version to show either. Read against current main (`cb8be1f`): `frontend/src/components/AppFooter.tsx` renders exactly `Task Notes` while loading and on failure, and `frontend/src/api/version.ts` returns `null` for a blank or `unknown` version. This plan keeps those two states unchanged (footer text exactly `Task Notes`, no `v`, no commit, no `undefined`, no error text) and applies "the version alone" to the one case where it is meaningful: the request succeeds with a usable version but the commit is missing, not a string, blank, or the backend's `unknown` default (`backend/app/core/config.py` `DEFAULT_BUILD_COMMIT`). Then the footer reads `Task Notes v{version}` with no commit element. Chosen over inventing a second request or a cached version, which no criterion asks for (`user_story_alignment.md` Section 3).
- Comment (tracker, all 10 comments): framework run notes from earlier, since-reverted runs → not acted on because none is a requirement (dispatch prompt and `.claude/artifacts/TEST-10/decisions.md`). Their interpretation of criterion 2 matches the assumption above, but it was re-derived against main's code here rather than taken from them.
- Merged since the last plan: n/a (fresh plan, no existing `plan.md`; plan base is main HEAD `cb8be1f95e73c0a5923df83a29c6f61e93c5207c`, and the dispatch carried no `[merged-since]` lines).

## Plan Overview
Frontend-only change on top of TEST-08's footer, consuming the `commit` field TEST-09 added to `GET /api/version` (verified on main: `backend/app/schemas/version.py` declares `commit: str`, `backend/app/services/version_service.py` cuts `BUILD_COMMIT` to `COMMIT_LENGTH = 12`, default `unknown`). The existing client `frontend/src/api/version.ts` keeps its function name `getBackendVersion()` (it is the client for `/api/version`) but now returns both values, `{ version, commit } | null`, instead of a bare string. `AppFooter.tsx` stores that object and, when a commit is present, renders the first 7 characters of it in its own span after the version. The two test files that mock the client (`AppFooter.test.tsx`, `LandingPage.test.tsx`) move to the new return shape. No backend change, no new dependency, no new route, no E2E spec change: the existing TEST-08 specs assert the `app-footer-version` span (still `v{version}`) and the exact `Task Notes` text on an aborted request (unchanged), so they stay valid. `LandingPage.tsx` is not touched (BUG-04 is in flight on NoteForm files only; this plan stays off `NoteForm.tsx` and `NoteForm.test.tsx`).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify):
    - `VersionResponse` becomes `{ version: string; commit: string }`, mirroring `backend/app/schemas/version.py`.
    - New exported type `BackendVersion = { version: string; commit: string | null }`.
    - `getBackendVersion(): Promise<BackendVersion | null>`. Unchanged failure contract: non-OK throws `Loading the version failed: {status} {statusText}`; a body whose `version` is not a string throws `Loading the version failed: unexpected response`; a network rejection propagates; a version that is blank after trim or equals `"unknown"` returns `null` (nothing to show, commit ignored).
    - New commit rule: `commit` is the trimmed `body.commit` when it is a string that is neither blank nor `"unknown"`; otherwise `null`. A missing or non-string `commit` does **not** throw, so a backend without TEST-09's field still shows its version. The `"unknown"` literal reuses the existing `BACKEND_UNKNOWN_VERSION` constant, renamed `BACKEND_UNKNOWN` with its comment extended to cite `config.DEFAULT_BUILD_COMMIT` as well as `version_service.UNKNOWN_VERSION`, since both backend defaults are the same sentinel.
    - The client returns the commit as the backend sent it (12 characters today); shortening is display, so it happens in the component.
  - `frontend/src/components/AppFooter.tsx` (modify): state `useState<BackendVersion | null>(null)`; the mount effect, `isMounted` guard and the silent `catch` with its "why" comment are unchanged. A module constant `SHORT_COMMIT_LENGTH = 7` with a comment that criterion 1 fixes the display length while the backend sends 12. Render, inside the unchanged `<footer data-testid="app-footer" style={footerStyle}>`: `Task Notes`; when the state is non-null, a space and `<span data-testid="app-footer-version">v{version}</span>`; when the state's `commit` is non-null, a space and `<span data-testid="app-footer-commit">({commit.slice(0, SHORT_COMMIT_LENGTH)})</span>`. Exact text contract: version `0.1.0` and commit `0123456789ab` → footer `textContent` is `Task Notes v0.1.0 (0123456)`, `app-footer-commit` text is `(0123456)`; version with null commit → `Task Notes v0.1.0`, no `app-footer-commit`; pending, failed or null result → exactly `Task Notes`, neither span present.
  - `frontend/src/components/LandingPage.tsx`: **not modified**.
- Routes: none.
- State management: the existing local `useState` + `useEffect` in `AppFooter`, holding the object instead of a string.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps its existing values unchanged: `font-size 0.875rem`, `color #5f5f5f`, `margin-top 1.5rem`; the commit span inherits them and adds no style of its own. States: success with commit `Task Notes v{version} ({7-char commit})`; success without a usable commit `Task Notes v{version}`; pending and failure `Task Notes` (TEST-08's states, see `## Re-Plan Feedback`).

## Backend Plan
No backend changes required.

`GET /api/version` already returns `commit` (TEST-09, merged on main); this item only reads it.

## API Integration Plan
No external API integration. (The only call is to this project's own backend, see `## API Contract`.)

## API Contract
Existing endpoint, consumed unchanged (TEST-05 and TEST-09):
- Method: GET
- URL: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version`
- Request: no body, no parameters.
- Response: `200 application/json`, example:

```json
{"version": "0.1.0", "commit": "0123456789ab"}
```

  `commit` is the first 12 characters of `BUILD_COMMIT`, or `"unknown"` when it is unset or blank. The frontend shows the first 7 characters of it, and treats a missing, non-string, blank or `"unknown"` commit as absent (version shown alone).

## Technology Selection
- No net-new component, module or dependency: the change extends the existing client `frontend/src/api/version.ts` (native `fetch`) and the existing `AppFooter` component (React `useState`/`useEffect`), and shortens the commit with the standard `String.prototype.slice` rather than any helper. `frontend/package.json` and its lockfile are unchanged.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the missing-commit edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit } | null`; read `commit` from the body, absent (null) when missing, non-string, blank or `unknown`; failure contract unchanged
- [A] frontend/src/api/version.test.ts: assert the new return shape and every commit case (present, missing, non-string, blank, `unknown`), keep every existing failure case
- [A] frontend/src/components/AppFooter.tsx: hold the object, render `({first 7 chars})` in `app-footer-commit` after the version when a commit is present
- [A] frontend/src/components/AppFooter.test.tsx: mock the new return shape; cover success with commit, success without commit, pending and failure
- [A] frontend/src/components/LandingPage.test.tsx: move the `getBackendVersion` mock to the new return shape (`{ version: "9.9.9", commit: null }`); assertions unchanged

No dependency is added or changed, so no lockfile is touched. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure (`BUILD_COMMIT` is already documented in `docs/DEVELOPMENT.md` by TEST-09). No E2E spec is added or modified: no criterion is assigned to E2E, and the existing `e2e/tests/TEST-08_footer_app_version.spec.ts` and `e2e/tests/TEST-04_page_footer.spec.ts` assertions stay true under this change.

## Testing Strategy
- Unit tests (Vitest, frontend):
  - `frontend/src/api/version.test.ts` (fetch stubbed, as today): `{"version": "0.1.0", "commit": "0123456789ab"}` resolves to `{ version: "0.1.0", commit: "0123456789ab" }` from `http://localhost:8010/api/version`; `commit` missing, `42`, `"  "` and `"unknown"` each resolve to `{ version: "0.1.0", commit: null }`; `VITE_API_BASE_URL` resolution kept; version `"unknown"` and blank resolve to `null`; the 503, `{}`, `{"version": 42}` and network-rejection failure cases kept.
  - `frontend/src/components/AppFooter.test.tsx` (`../api/version` mocked): success with commit `0123456789ab` → footer `textContent` exactly `Task Notes v9.9.9 (0123456)` and `app-footer-commit` text `(0123456)` (proves the 7-character cut, since the mock sends 12); success with `commit: null` → exactly `Task Notes v9.9.9`, no `app-footer-commit`; pending (never-settling promise) → exactly `Task Notes`, neither span; failure (rejects `Failed to fetch`) → exactly `Task Notes`, neither span, and text matches none of `undefined`, `null`, `unknown`, `Error`, `Failed`; resolved `null` → exactly `Task Notes`; `contentinfo` landmark test kept.
  - `frontend/src/components/LandingPage.test.tsx`: mock returns `{ version: "9.9.9", commit: null }`; existing footer assertion unchanged.
  - Directory: colocated under `frontend/src/` (the existing frontend convention); `CLAUDE.md`'s `backend/tests/unit/` is the backend's.
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, matching the existing files.
- Integration tests: none added. No router, repository or migration changes (`testing_standards.md` Section 6); `GET /api/version`'s `commit` field is already covered by TEST-09's backend tests.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: no new spec. Every criterion is a rendering branch of one component or a property of its test file, covered at Unit (see `### Criterion coverage`); no criterion needs navigation or interaction. The existing TEST-08 and TEST-04 specs run unchanged and must stay green.
  - Directory: e2e/tests/
  - File: none for this item (would be `TEST-10_footer_build_commit.spec.ts`)
- UAT scenarios: one per criterion plus the missing-commit edge case.
  - Directory: e2e/uat/scenarios/ (Gherkin), e2e/uat/scripts/ (manual script)

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | Unit | verifying it needs no navigation or interaction: the client test proves `commit` is read from the `/api/version` body and the component test proves a 12-character commit renders as its first 7 after the version |
| 2 | While pending or on failure, the footer shows no `undefined` or error (version alone when the commit is unusable) | Unit | verifying it needs no navigation or interaction: each state is a rendering branch exercised by the component test with the client mocked pending, rejecting, returning `null` and returning a null commit |
| 3 | A component test covers the success, pending and failure paths | Unit | it is a property of the component test itself, verified by running `frontend/src/components/AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | covered at Unit, see Criterion coverage | Given the backend runs with BUILD_COMMIT 0123456789abcdef, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (0123456)" |
| 2 | Pending or failed request shows no undefined or error; no commit shows the version alone | covered at Unit, see Criterion coverage | Given the backend runs with no BUILD_COMMIT, When I open the landing page, Then the footer reads "Task Notes v0.1.0"; Given the backend is stopped, Then it reads "Task Notes" |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the footer component tests, Then the success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: from the repository root, the stack is started with `BUILD_COMMIT=0123456789abcdef docker compose up -d --force-recreate backend frontend`; the frontend is at `http://localhost:5183` and the backend at `http://localhost:8010`; `backend/pyproject.toml` has `version = "0.1.0"`.
1. Open `http://localhost:8010/api/version` in the browser → it shows `{"version":"0.1.0","commit":"0123456789ab"}`.
2. Open `http://localhost:5183/` and scroll to the footer → it reads `Task Notes v0.1.0 (0123456)`: the version, then the first 7 characters of the commit in parentheses.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: as for Criterion 1, then recreate the backend without the variable: `docker compose up -d --force-recreate backend`.
1. Open `http://localhost:8010/api/version` → it shows `{"version":"0.1.0","commit":"unknown"}`.
2. Open `http://localhost:5183/` and read the footer → it reads exactly `Task Notes v0.1.0`, with no parentheses, no `unknown` and no `undefined`.
3. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes` (TEST-08's failure state), with none of `undefined`, `null`, `unknown` or an error message, and the rest of the page still renders.
4. In the browser developer tools, Network tab, set throttling to `Slow 3G`, run `docker compose start backend`, and reload `http://localhost:5183/` → until the `/api/version` request completes the footer reads exactly `Task Notes`; once it completes it reads `Task Notes v0.1.0`. Reset throttling to `No throttling`.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend exec --no -- vitest run src/components/AppFooter.test.tsx` → the run lists the success-with-commit, success-without-commit, pending and failure tests and reports `0 failed`.
2. Run `npm --prefix frontend test` → the frontend suite, including `src/api/version.test.ts`, `src/components/AppFooter.test.tsx` and `src/components/LandingPage.test.tsx`, reports `0 failed`.
