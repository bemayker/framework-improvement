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
- Comment (tracker): all comments on the task are mayker-dev bot notes from earlier runs whose PRs were reset → not acted on because they carry no requirement; the feature text above is the sole requirement source.
- Merged since the last plan: n/a (fresh plan, no earlier plan.md for TEST-10; planned against main at 9c91fa1, which already holds TEST-08 and TEST-09).

## Plan Overview
Frontend-only change on top of TEST-08's footer and TEST-09's `commit` field (verified on main at 9c91fa1: `backend/app/schemas/version.py` returns `version` and `commit`; `backend/app/services/version_service.py` caps `commit` at 12 characters; `backend/app/core/config.py` defaults it to `"unknown"`).

1. `frontend/src/api/version.ts`: `fetchVersion()` returns a `VersionInfo` object (`version` plus `commit`) instead of a bare string. Version validation is unchanged (a missing or empty version still throws). The commit is optional for the client: a missing, non-string, empty or `"unknown"` commit becomes `null`, so the footer can show the version alone rather than fail the whole request.
2. `frontend/src/components/AppFooter.tsx`: stores the `VersionInfo`; renders `Task Notes v{version} ({first 7 chars of commit})` when both are known, `Task Notes v{version}` when the commit is `null`, and `Task Notes` (TEST-08's behaviour, unchanged) while pending, on failure, and for the `"unknown"` version sentinel. The commit is rendered in its own `<span data-testid="app-footer-commit">`.
3. Tests follow the new return shape: client unit tests, footer component tests (success, pending, failure), the LandingPage test's `fetchVersion` mock, and one new E2E spec that stubs `/api/version` in the browser.

No backend, no new dependency, no LandingPage.tsx change (it already renders `<AppFooter />` unchanged).

Assumptions (also for the PR description):
- A1. "Next to the version" is rendered as `Task Notes v0.1.0 (0123456)`: one space, the 7-character commit in parentheses, inside the same footer.
- A2. "Shows the version alone" while pending or on a failed request is read as TEST-08's existing rendering: no version is known in those states, so the footer reads exactly `Task Notes` (no commit part, never `undefined`, never an error text). When the request succeeds with a version but no usable commit, the footer reads `Task Notes v{version}`, which is the literal "version alone".
- A3. The backend's `"unknown"` commit sentinel (BUILD_COMMIT unset) is treated as no commit, mirroring how TEST-08 treats the `"unknown"` version sentinel. Without this the footer would show `(unknown)`, which is 7 characters and looks like a commit. This also keeps TEST-08's E2E exact-text assertion (`Task Notes v0.1.0`) true on the E2E stack, where BUILD_COMMIT is not set.
- A4. Shortening to 7 characters happens in the footer (display concern); the client returns the commit as reported (up to 12 characters).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: export `type VersionInfo = { version: string; commit: string | null }`; extend `VersionResponse` with optional `commit`; `fetchVersion(): Promise<VersionInfo>`; constant `UNKNOWN_COMMIT = "unknown"`; commit normalized to `null` when not a non-empty string or equal to `UNKNOWN_COMMIT`.
  - `frontend/src/components/AppFooter.tsx`: state `VersionInfo | null`; constant `SHORT_COMMIT_LENGTH = 7`; keeps the `UNKNOWN_VERSION` check and the `isMounted` guard; keeps `data-testid="app-footer"` and `footerStyle` as they are; renders the commit span only when `commit !== null`.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today.
- Design reference notes: AI freestyle

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, unchanged; consumed only)
- Request: none
- Response: `{"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is at most 12 characters, `"unknown"` when BUILD_COMMIT is unset or blank.
- Client contract (`fetchVersion`): resolves `{ version: "0.1.0", commit: "0123456789ab" }`; resolves `commit: null` when the field is missing, not a string, empty, or `"unknown"`; rejects (unchanged) on a non-OK status or a missing/empty version.

## Technology Selection
- Commit shortening: chose the standard `String.prototype.slice(0, 7)` over any helper or dependency, because the standard library covers it.
- Footer rendering and state: chose React `useState`/`useEffect` already installed and already used by `AppFooter.tsx` over any data-fetching library; no net-new component, module or dependency is introduced.
- E2E network stubbing: chose Playwright's built-in `page.route` (already installed, already used by `e2e/tests/TEST-08_footer_app_version.spec.ts`) over setting BUILD_COMMIT on the E2E stack, because it makes the commit deterministic without changing CI or compose.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser specs for the commit next to the version (stubbed `/api/version`) and the edge cases (unknown commit sentinel, aborted request)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `VersionInfo` with a normalized, nullable `commit`
- [A] frontend/src/api/version.test.ts: assert the returned object, the commit pass-through, and `null` for missing, non-string and `"unknown"` commits
- [A] frontend/src/components/AppFooter.tsx: render the first 7 characters of the commit next to the version; version alone when the commit is null
- [A] frontend/src/components/AppFooter.test.tsx: success, pending and failure paths for the commit; existing mocks moved to the `VersionInfo` shape
- [A] frontend/src/components/LandingPage.test.tsx: `fetchVersion` mock resolves the `VersionInfo` shape instead of a string

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: Vitest, frontend. The API client's commit normalization (`version.test.ts`) and the footer's three rendering paths (`AppFooter.test.tsx`), with `fetchVersion` mocked.
  - Directory: co-located with the source under `frontend/src/` (the project's established Vitest layout; CLAUDE.md's unit directory `backend/tests/unit/` is the backend's)
  - Naming: `{Module}.test.ts(x)`, as the existing frontend tests
- Integration tests: not warranted. No router, repository or migration changes; GET /api/version and its `commit` field are already covered by TEST-09's integration tests.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: the landing page footer in a real browser, with `/api/version` stubbed through `page.route` so the commit is deterministic; one success spec and two edge-case specs.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (unknown commit sentinel).
  - Directory: e2e/uat/scenarios/

Existing tests that must keep passing unchanged: `e2e/tests/TEST-08_footer_app_version.spec.ts` (exact text `Task Notes v{version}` holds because the E2E stack's commit is `"unknown"`, assumption A3) and `e2e/tests/TEST-04_page_footer.spec.ts` (substring assertions only).

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added. | E2E | `shows the first 7 characters of the build commit next to the version`, `renders the first 7 characters of the commit next to the version` | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error. | Unit | `never renders undefined or an error while the version is loading`, `never renders undefined or an error when /api/version fails`, `renders the version alone when the backend reports the unknown commit sentinel`, `returns a null commit when the response carries the unknown sentinel` | verifying it needs no navigation or interaction: pending and failure states are produced deterministically by a mocked `fetchVersion` in a component test; the E2E edge-case specs exercise them in the browser as well |
| 3 | A component test covers the success, pending and failure paths. | Unit | `renders the first 7 characters of the commit next to the version`, `never renders undefined or an error while the version is loading`, `never renders undefined or an error when /api/version fails` | the criterion itself names a component test: it is satisfied by the Vitest tests existing and passing, not by browser behaviour |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 characters of the commit next to the version | `page.route("**/api/version")` fulfils a JSON body with version `1.2.3` and commit `0123456789ab`; go to `/`; `app-footer` has text `Task Notes v1.2.3 (0123456)` and `app-footer-commit` has text `0123456` | Given the backend reports version 1.2.3 and commit 0123456789ab, When I open the landing page, Then the footer reads "Task Notes v1.2.3 (0123456)" |
| 2 | Pending or failed: version alone, never `undefined` or an error | covered at Unit, see Criterion coverage; edge-case specs `shows the version alone when the backend reports the unknown commit` and `shows no commit and no undefined when /api/version is unreachable` | Given /api/version is unreachable, When I open the landing page, Then the footer reads "Task Notes" and contains no "undefined" |
| 3 | A component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter component tests, Then 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
Prerequisites: the stack is built with a known commit. From the repository root run `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build`, and wait until the backend answers on `http://localhost:8010/api/version`.
1. Open `http://localhost:8010/api/version` in the browser → the JSON reads `{"version": "0.1.0", "commit": "0123456789ab"}` (the version is whatever `backend/pyproject.toml` declares, `0.1.0` on main today).
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading, the note form and the note list.
3. Scroll to the footer at the bottom of the page → it reads exactly `Task Notes v0.1.0 (0123456)`: seven commit characters, in parentheses, right after the version.
4. Right-click the commit text and choose Inspect → it is a span with `data-testid="app-footer-commit"` containing `0123456`, inside the footer with `data-testid="app-footer"`.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
Prerequisites: the stack from Criterion 1 is running; the browser DevTools are open on the Network tab.
1. On `http://localhost:5183/`, set DevTools Network throttling to "Slow 3G" and reload → before the `/api/version` request finishes, the footer reads exactly `Task Notes`, with no `undefined`, no `null` and no error text; once it finishes, it reads `Task Notes v0.1.0 (0123456)`.
2. Set throttling back to "No throttling". In DevTools Network, right-click the `version` request and choose "Block request URL", then reload → the footer reads exactly `Task Notes`, with no `undefined` and no error text, and the rest of the page works (the note form still accepts `Buy milk` and lists it after Save).
3. Unblock the URL. Rebuild the stack without a commit: `docker compose up -d --build` (BUILD_COMMIT unset) → `http://localhost:8010/api/version` reads `{"version": "0.1.0", "commit": "unknown"}`.
4. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`: the version alone, no parentheses, no `(unknown)`.

### Criterion 3: A component test covers the success, pending and failure paths.
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run lists `renders the first 7 characters of the commit next to the version`, `never renders undefined or an error while the version is loading` and `never renders undefined or an error when /api/version fails`, and reports 0 failed.
2. Run `npm --prefix frontend test -- src/api/version.test.ts src/components/LandingPage.test.tsx` → 0 failed.
