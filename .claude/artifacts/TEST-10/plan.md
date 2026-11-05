# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What:** The landing page footer shows the short build commit next to the version.
>
> **Notes:** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.
>
> (Tracker task 123k99cwybm. Plan base: `7edc323`, current `main`, which carries TEST-08 (#592) and TEST-09 (#591).)

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 28 comments read across 2 pages, all framework PR-opened notes from earlier runs → not acted on because none carries a requirement or amends a criterion; there is no stakeholder feedback on this item.
- Assumption (criterion 2, recorded instead of a blocking question): the version and the commit arrive in the **same** `GET /api/version` response, so while that request is pending or after it fails there is no version to show either. "The version alone" is therefore read as "the footer TEST-08 already renders in that state, with no commit part": exactly `Task Notes` (TEST-08's recorded loading and failure state), never `undefined`, `null`, `unknown`, an empty `()` or error text. A second request, or caching a version from elsewhere, would be new behaviour the criteria do not ask for. The commit part is also omitted when the response resolves with a version but no usable commit, so the footer then reads `Task Notes v{version}` alone.
- Assumption (format): the commit is shown in parentheses after the version, `Task Notes v0.1.0 (abc1234)`. This is the format `docs/DEVELOPMENT.md` already documents for the footer (its "The page footer shows the backend's version and build commit" paragraph, left in place by TEST-08 for this item to land), so the code is planned to match the docs rather than the docs being rewritten.
- Merged since the last plan: n/a (fresh plan, branched from current main `7edc323`).

## Plan Overview
Frontend only. `GET /api/version` already returns `{"version": "...", "commit": "..."}` since TEST-09 (`backend/app/routers/version.py`, `backend/app/schemas/version.py`): `commit` is the first 12 characters of `BUILD_COMMIT`, or `unknown` when that variable is unset or blank (`backend/app/core/config.py` `DEFAULT_BUILD_COMMIT`). The version client `frontend/src/api/version.ts` is widened from returning the version alone to returning both values from the one response, with the commit cut to 7 characters and set to `null` when it is unusable. `AppFooter.tsx` renders `Task Notes v{version} ({commit})` when both are present, `Task Notes v{version}` when only the version is, and `Task Notes` otherwise (pending, failed, or no usable version, all unchanged from TEST-08). The two Vitest suites that mock the client (`AppFooter.test.tsx`, `LandingPage.test.tsx`) follow the client's new name and shape. No backend file, no new dependency, no new route.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): replace `getBackendVersion(): Promise<string | null>` with `getBackendBuildInfo(): Promise<BackendBuildInfo | null>`, exporting `interface BackendBuildInfo { version: string; commit: string | null }`. Same single `fetch` of `${API_BASE_URL}/api/version`, same throw on `!response.ok` (`Loading the version failed: {status} {statusText}`), network errors still propagate. Version rules unchanged from TEST-08: the trimmed `version` when it is a non-empty string other than `unknown`, otherwise the function returns `null` (no build info at all, so no commit is shown without a version). Commit rules, new: when `commit` is a string that, trimmed, is non-empty and not `unknown`, return its first 7 characters (`SHORT_COMMIT_LENGTH = 7`, named constant); otherwise `commit: null`. Add `BACKEND_UNKNOWN_COMMIT = "unknown"` beside the existing `BACKEND_UNKNOWN_VERSION`, with a comment pointing at `DEFAULT_BUILD_COMMIT` in `backend/app/core/config.py`. Type the parsed body as `{ version?: unknown; commit?: unknown } | null`, never `any`.
  - `frontend/src/components/AppFooter.tsx` (modify): import `getBackendBuildInfo` and `BackendBuildInfo`; state `useState<BackendBuildInfo | null>(null)`; the existing `useEffect` with its `isMounted` guard and empty `.catch` stays, calling the new function. Render: `null` → `Task Notes`; otherwise `Task Notes v{version}` followed by ` ({commit})` only when `commit` is a non-null string. Build the text so no `undefined`, `null`, stray space or empty `()` can appear. Keep `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark), `APP_NAME` and `footerStyle` unchanged. No separate test id for the commit: the criteria are about the footer's text, which `app-footer` already locates.
- Routes: none.
- State management: local component state in `AppFooter` only, as TEST-08 left it.
- Rendered states: pending → `Task Notes`; failure (network error, non-OK status, unparseable body) → `Task Notes`; no usable version → `Task Notes`; version and no usable commit (missing, not a string, blank, `unknown`) → `Task Notes v0.1.0`; both → `Task Notes v0.1.0 (3f2a9c1)`.
- Design reference notes: AI freestyle (Design Reference mode NONE). The footer keeps TEST-04's inline style unchanged: `fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`; the commit is plain text in the same run of text, no extra styling.

## Backend Plan
No backend changes required. TEST-09 (merged, #591) already returns `commit` from `GET /api/version`: `VersionResponse` has `version: str` and `commit: str`, the service cuts `BUILD_COMMIT` to 12 characters, and an unset or blank `BUILD_COMMIT` reports `unknown`. Cutting to 7 characters is a display concern and lives in the frontend client, as criterion 1 places it ("the first 7 characters of the commit from `GET /api/version`").

## API Integration Plan
No external API integration. The only call is to this project's own backend, through the existing client module `frontend/src/api/version.ts`.

## API Contract
- Method: GET
- URL: `/api/version` on `API_BASE_URL` (`frontend/src/api/baseUrl.ts`: `VITE_API_BASE_URL`, default `http://localhost:8010`)
- Request: no body, no parameters
- Response: `200` with JSON `{"version": "0.1.0", "commit": "3f2a9c1d4e5b"}` (TEST-09 contract, unchanged). `commit` is `"unknown"` when `BUILD_COMMIT` is unset or blank. The client returns `{ version: "0.1.0", commit: "3f2a9c1" }` for that body, `{ version: "0.1.0", commit: null }` for a missing, non-string, blank or `unknown` commit, and `null` when the version is unusable.

## Technology Selection
- Commit shortening in `frontend/src/api/version.ts`: chose the standard library's `String.prototype.slice(0, 7)` over any formatting helper or dependency; no new module is introduced.
- Footer text: chose the existing React `useState` and `useEffect` in `AppFooter.tsx` and a template string over a data-fetching or formatting dependency (none installed, none needed).
- No net-new component, module or dependency is introduced by this feature; every change is to files TEST-08 created, so no lockfile changes.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright specs for criterion 1 (footer shows `v{version} ({7-char commit})` for a fulfilled response) and the edge case (commit `unknown` leaves `v{version}` alone, no parentheses)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: `getBackendVersion` becomes `getBackendBuildInfo`, returning `{ version, commit }` from the one response with the commit cut to 7 characters or `null`
- [A] frontend/src/api/version.test.ts: retarget the existing cases to `getBackendBuildInfo` and add commit cases (12-char commit cut to 7, shorter commit kept whole, trimmed, missing, non-string, blank, `unknown`, and an unusable version returning `null` even with a commit present)
- [A] frontend/src/components/AppFooter.tsx: render the short commit in parentheses after the version when present; pending, failure and no-version states unchanged
- [A] frontend/src/components/AppFooter.test.tsx: mock `getBackendBuildInfo`; cover success with commit, success without commit, pending and failure (criterion 3), keeping the landmark and test id test
- [A] frontend/src/components/LandingPage.test.tsx: switch its `../api/version` mock from `getBackendVersion` to `getBackendBuildInfo` and assert the footer text including the commit; no other test in the file changes

`frontend/src/components/LandingPage.tsx` is not modified (it already renders `<AppFooter />`). No backend file changes. No dependency changes, so no lockfile entry. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: no project structure, run configuration, dependency or test infrastructure changes, and `docs/DEVELOPMENT.md` already documents the footer's commit display in the format this plan adopts. The existing E2E specs `e2e/tests/TEST-08_footer_app_version.spec.ts` and `e2e/tests/TEST-04_page_footer.spec.ts` are not modified: their live-backend cases run with `BUILD_COMMIT` unset (it is not set in any CI workflow or `playwright.config.ts`), so the backend reports `unknown`, the commit part is omitted and their exact `Task Notes v{version}` text still holds; their fulfilled response carries no `commit` field, which also omits it.

## Testing Strategy
- Unit tests: the version client (`version.test.ts`, `fetch` stubbed with `vi.stubGlobal` as today) and the footer component (`AppFooter.test.tsx`, `../api/version` mocked with `vi.mock`), plus the footer assertion in `LandingPage.test.tsx`.
  - Directory: `frontend/src/`, co-located `*.test.ts(x)` (the frontend's existing Vitest convention; `CLAUDE.md`'s `backend/tests/unit/` applies to the backend)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`
- Integration tests: none new. No repository, model, migration or endpoint changes; the endpoint's `commit` field is already covered by `backend/tests/integration/test_version_integration.py` (TEST-09).
  - Directory: `backend/tests/integration/`
- E2E tests: on `/`, `page.route` fulfils `/api/version` with `{"version": "0.1.0", "commit": "3f2a9c1d4e5b"}` and the footer reads exactly `Task Notes v0.1.0 (3f2a9c1)`; edge case, `{"version": "0.1.0", "commit": "unknown"}` → exactly `Task Notes v0.1.0`. Match the route on `url.pathname === "/api/version"`, never a substring (the Vite module `src/api/version.ts` matches a substring, as `TEST-08_footer_app_version.spec.ts` documents), and send `access-control-allow-origin: *` on the fulfilled response as that spec does. A fulfilled response, not the live backend, because CI runs with `BUILD_COMMIT` unset and the live backend would only ever report `unknown`. Wait on the footer text, never a fixed timeout.
  - Directory: `e2e/tests/`
  - File: `TEST-10_footer_build_commit.spec.ts`
- UAT scenarios: one per criterion plus the `unknown`-commit edge case.
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | Pending or failed request shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: a never-resolving and a rejecting mock of `getBackendBuildInfo` render both states deterministically in `AppFooter.test.tsx`, asserting the exact text `Task Notes` and the absence of `undefined`, `null`, `unknown` and `()` |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test in `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Short commit next to the version | fulfil `/api/version` with `{"version": "0.1.0", "commit": "3f2a9c1d4e5b"}`, `page.goto("/")`, assert `app-footer` has text `Task Notes v0.1.0 (3f2a9c1)`; edge case with `commit: "unknown"` asserts `Task Notes v0.1.0` | Given the backend runs with BUILD_COMMIT 3f2a9c1d4e5b6a7b, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (3f2a9c1)" |
| 2 | Pending or failed shows no commit and no error | covered at Unit, see Criterion coverage | Given the version request is blocked, When I open the landing page, Then the footer reads exactly "Task Notes" with no "undefined" or error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend unit suite, When it runs, Then the AppFooter success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: from the repo root, start the stack with `BUILD_COMMIT=3f2a9c1d4e5b6a7b docker compose up -d --build`; `backend/pyproject.toml` declares `version = "0.1.0"`.
1. Open `http://localhost:8010/api/version` in a browser → the JSON reads `{"version":"0.1.0","commit":"3f2a9c1d4e5b"}`.
2. Open `http://localhost:5183/` → the landing page shows the "Task Notes" heading.
3. Scroll to the footer at the bottom of the page → it reads exactly `Task Notes v0.1.0 (3f2a9c1)`: seven commit characters, in parentheses, after the version.
4. Run `docker compose up -d --force-recreate backend` from the repo root with `BUILD_COMMIT` unset in the shell, then reload `http://localhost:5183/` → `/api/version` reports `"commit":"unknown"` and the footer reads exactly `Task Notes v0.1.0`, with no parentheses and no `unknown`.

### Criterion 2: Pending or failed request shows the version alone, never undefined or an error
Prerequisites: stack running as in criterion 1's prerequisites, browser DevTools open on the Network tab.
1. Right-click the `/api/version` request, choose "Block request URL", reload `http://localhost:5183/` → the footer reads exactly `Task Notes`: no commit, no `undefined`, no `null`, no `()` and no error text.
2. Unblock it, set Network throttling to "Slow 3G" and reload → while the request is pending the footer reads `Task Notes`; when it completes it changes to `Task Notes v0.1.0 (3f2a9c1)`.
3. Reset throttling to "No throttling". Run `docker compose stop backend` and reload → the footer reads exactly `Task Notes`. Run `docker compose start backend` and reload → it reads `Task Notes v0.1.0 (3f2a9c1)` again.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test` from the repo root → `frontend/src/components/AppFooter.test.tsx`, `frontend/src/api/version.test.ts` and `frontend/src/components/LandingPage.test.tsx` are in the run, with `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it holds a success test expecting `Task Notes v0.1.0 (3f2a9c1)`, a pending test (never-resolving mock) expecting exactly `Task Notes`, and a failure test (rejected mock) expecting exactly `Task Notes`.
