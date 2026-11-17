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
- Comment (tracker): none actionable; every comment on the ticket is a framework PR notice (run=deliver-20261117T194314Z 6.1) → Addressed by: nothing to change.
- Merged since the last plan: n/a (fresh plan, branched from current main 174a1e09cbf5d30c23699012f94b3fc0d1fa375e, which already carries TEST-08 #858 and TEST-09 #857).
- Interpretation (criterion 2, "the version alone"): `GET /api/version` returns the version and the commit in ONE response, so while it is pending or after it fails there is no version either. The footer then renders exactly what TEST-08 renders in those states, `Task Notes` with no version and no commit, which is the "no commit, never `undefined` or an error" reading of the criterion. "The version alone" (`Task Notes v{version}` with no commit) is what renders when the request succeeds but carries no usable commit: the field is missing, not a string, empty, or the backend's `"unknown"` sentinel (backend/app/core/config.py `UNKNOWN_BUILD_COMMIT`, returned when `BUILD_COMMIT` is unset).
- Interpretation (criterion 1, "first 7 characters"): the backend already cuts the commit to 12 characters (backend/app/core/config.py `BUILD_COMMIT_LENGTH = 12`); the frontend takes the first 7 of what it receives. A commit shorter than 7 characters is shown whole. The commit is shown only next to a version: a response with a commit but no usable version shows neither (the criterion places the commit "next to the version").
- Interpretation (display format): `Task Notes v{version} ({commit7})`, the commit in parentheses after the version, in its own `data-testid="app-footer-commit"` span so the existing `app-footer-version` span keeps its exact text ` v{version}` and TEST-08's assertions on it stay valid. Design Reference mode is NONE, so the format is a freestyle choice.

## Plan Overview
Frontend only. The version API client (`frontend/src/api/version.ts`, added by TEST-08) stops returning a bare version string and returns `{ version, commit }`, both already normalized: `version` as today (null for missing, empty or `"unknown"`), `commit` cut to its first 7 characters and null for missing, non-string, empty or `"unknown"`. `AppFooter` keeps one request on mount, stores the object, and renders the commit in a new span after the version span. No backend change: TEST-09 already serves `commit`. No routing, no new dependency, no new state library.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: export `type AppVersionInfo = { version: string | null; commit: string | null }`; `getAppVersion()` now resolves to `AppVersionInfo` (same name, same single `fetch` of `${API_BASE_URL}/api/version`, same rejection on non-OK and network error). Add a module constant `SHORT_COMMIT_LENGTH = 7` and reuse the existing `UNRESOLVED_VERSION_SENTINEL` (`"unknown"`, which both backend fields use) for the commit as well. The normalization of each field is one small helper (string, non-empty, not the sentinel, else null); the commit is then `.slice(0, SHORT_COMMIT_LENGTH)`.
  - `frontend/src/components/AppFooter.tsx`: state becomes `AppVersionInfo | null` (null = pending or failed). Render `Task Notes`, then `<span data-testid="app-footer-version"> v{version}</span>` when `version` is non-null (unchanged text), then `<span data-testid="app-footer-commit"> ({commit})</span>` when both `version` and `commit` are non-null. Failure stays swallowed (loading and failure look the same, as TEST-08 decided).
- Routes: none.
- State management: local `useState` in `AppFooter`, unchanged pattern (the existing `isMounted` guard is kept).
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span inherits the existing footer style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem` on the footer element); no new style values.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version (existing, TEST-05 and TEST-09; unchanged)
- Request: none
- Response: 200, `{"version": "0.1.0", "commit": "4f2a9c1e7b3d"}`; `commit` is `"unknown"` when `BUILD_COMMIT` is unset, otherwise at most 12 characters.
- Frontend client contract: `getAppVersion(): Promise<AppVersionInfo>`, resolving `{ version: "0.1.0", commit: "4f2a9c1" }` for the response above, `{ version: "0.1.0", commit: null }` when `commit` is `"unknown"`, missing, non-string or empty; rejects on non-OK status and on network error (unchanged).

## Technology Selection
- Short commit: chose `String.prototype.slice(0, 7)` (language standard library) over any formatting helper or dependency; nothing else is needed.
- Version info type and normalization: no stdlib call, native platform feature or installed dependency covers parsing this one response shape, so it is a few lines in the existing client module, extended in place rather than a new module.
- No net-new component, module or dependency is introduced: the footer, the client and the fetch call all exist already.

## File Manifest
### New files
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (backend reports `"unknown"`)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/version.ts: `getAppVersion()` resolves to `AppVersionInfo` with a 7-character `commit` or null
- [A] frontend/src/api/version.test.ts: existing cases move to the object shape; add the commit cases
- [A] frontend/src/components/AppFooter.tsx: store `AppVersionInfo`, render the `app-footer-commit` span next to the version
- [A] frontend/src/components/AppFooter.test.tsx: mocks resolve the object shape; success, pending, failure and no-commit cases assert the commit span
- [A] frontend/src/components/LandingPage.test.tsx: its `getAppVersion` mock resolves `{ version: BACKEND_VERSION, commit: null }` instead of a string (it renders AppFooter, so the return-type change reaches it); no other line changes

No dependency changes, so no lockfile is regenerated. Neither README.md nor docs/DEVELOPMENT.md needs an edit: no project structure, run configuration, dependency or test-infrastructure change.

## Testing Strategy
- Unit tests: Vitest, co-located. `version.test.ts` for the client's normalization (commit cut to 7, sentinel and malformed commit to null, version behaviour unchanged); `AppFooter.test.tsx` for the component's success, pending, failure and no-commit renders (criterion 3 asks for a component test explicitly).
  - Directory: frontend/src/api/ and frontend/src/components/ (co-located, per project-standards Layout)
  - Naming: `{Name}.test.ts(x)`
- Integration tests: none warranted; no endpoint, repository or model changes (TEST-09's integration tests already cover the `commit` field of `GET /api/version`).
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: no new spec. No criterion needs navigation or interaction through the UI: the commit renders on page load from one response, which the component test covers with the request mocked at the client boundary. The existing `e2e/tests/TEST-08_footer_app_version.spec.ts` stays green unchanged: its stubbed tests return no `commit` (so no commit span), and its real-backend test runs where CI sets no `BUILD_COMMIT` (commit `"unknown"`, so no commit span).
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: footer shows `v{version} ({7-char commit})`; pending and failure show `Task Notes` with no commit; `"unknown"` commit shows the version alone.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | Unit | `renders the first 7 characters of the commit next to the version`, `returns the first 7 characters of the commit from GET /api/version` | verifying it needs no navigation or interaction: it is a render of one mocked response plus a string cut in the client |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | `renders the app name without a version or commit while the request is pending`, `renders the app name without a version or commit when the request fails`, `renders the version alone when the backend reports no commit`, `returns a null commit when the backend reports the unknown sentinel`, `returns a null commit when the response has no commit string` | verifying it needs no navigation or interaction: pending, failed and commit-less states are mock outcomes at the client boundary |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the first 7 characters of the commit next to the version`, `renders the app name without a version or commit while the request is pending`, `renders the app name without a version or commit when the request fails` | the criterion itself names a component test; it is satisfied by the AppFooter Vitest file, not by a browser |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 commit characters next to the version | covered at Unit, see Criterion coverage | Given the backend runs with BUILD_COMMIT 4f2a9c1e7b3d5a60 When I open the landing page Then the footer reads "Task Notes v{version} (4f2a9c1)" |
| 2 | Pending or failed request shows no commit, never undefined or an error | covered at Unit, see Criterion coverage | Given the backend is stopped When I open the landing page Then the footer reads "Task Notes" and contains neither "undefined" nor an error |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend tests When I run the AppFooter test file Then the run passes |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: the stack is down (`docker compose down`); the version is the `[project].version` in backend/pyproject.toml (called {version} below).
1. From the repository root run `BUILD_COMMIT=4f2a9c1e7b3d5a60 docker compose up -d --build` → the db, backend and frontend containers start.
2. Open `http://localhost:8010/api/version` in a browser → the JSON shows `"commit": "4f2a9c1e7b3d"` (12 characters, TEST-09's cut).
3. Open `http://localhost:5183/` → the footer at the bottom of the landing page reads `Task Notes v{version} (4f2a9c1)`: exactly 7 commit characters, in parentheses, right after the version.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack from Criterion 1 is running.
1. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no version, no parentheses, no `undefined` and no error text.
2. Run `docker compose down`, then `docker compose up -d --build` with no BUILD_COMMIT set, and reload `http://localhost:5183/` → `http://localhost:8010/api/version` shows `"commit": "unknown"` and the footer reads `Task Notes v{version}` with no parentheses (the version alone).
3. In the browser's developer tools, Network tab, set throttling to `Slow 3G` and reload `http://localhost:5183/` → while `/api/version` is still pending the footer reads `Task Notes` only, then changes to `Task Notes v{version}` when the response arrives.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run passes: its summary line reports no failed or errored test and the command exits 0.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains the tests `renders the first 7 characters of the commit next to the version`, `renders the app name without a version or commit while the request is pending` and `renders the app name without a version or commit when the request fails`.
