# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What:** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes:** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.
>
> (ClickUp task 123k99cwybm, workspace 30307190.)

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

### Assumptions
- **Display format:** `Task Notes v{version} ({commit7})`, for example `Task Notes v0.1.0 (abc1234)`. The commit sits in its own `data-testid="app-footer-commit"` span after TEST-08's `app-footer-version` span. This is the format `docs/DEVELOPMENT.md` (line 669) already documents for this feature, so the plan adopts it rather than inventing another.
- **Criterion 2, "the version alone":** the version and the commit arrive in the same response, so while that request is pending or after it fails there is no version to show either. In those states the footer keeps TEST-08's contracted behaviour, exactly `Task Notes` (no version, no commit, never `undefined`, `null` or an error text). "The version alone", meaning `Task Notes v{version}` with no commit segment, is what the footer shows whenever the version resolved but the commit did not: the `commit` field missing (a backend older than TEST-09), not a string, blank, or the backend sentinel `unknown` (which is what `GET /api/version` returns whenever `BUILD_COMMIT` is unset or blank, the default locally and in CI). This reading keeps TEST-08's criterion 3 and its passing E2E edge-case spec intact.
- **Commit shown only next to a version:** when the backend reports its version as `unknown` (or blank), the footer shows `Task Notes` alone even if a commit is known, because the criterion places the commit "next to the version" and TEST-08 contracts `Task Notes` for an unresolved version.
- **A bad `commit` never fails the request:** a missing, non-string, blank or `unknown` commit yields no commit segment rather than a rejected promise, so a commit problem can never hide a good version (criterion 2, "never ... an error").
- **No hex validation of the commit:** the backend already returns the first 12 characters of `BUILD_COMMIT`; the frontend takes the first 7 of the trimmed string and does no further validation (no gold plating, `user_story_alignment.md` Section 3).

## Re-Plan Feedback
- Comment (tracker): 25 comments read by the dispatching session (2 pages), all the framework's own "PR opened" notices from earlier runs whose code was reset → not acted on because none carries feedback on the item's behaviour or scope.
- Description note "Modifies the footer TEST-08 creates" → acted on: `frontend/src/components/AppFooter.tsx` (merged with TEST-08 as 4848e83) is modified. `frontend/src/components/LandingPage.tsx` is **not** modified, because it already renders `<AppFooter />` and this change lives inside the footer and its client; the map row's flag against BUG-04 on `LandingPage.tsx` therefore does not materialize (see `shared_risks.md`).

## Plan Overview
TEST-08 made the footer fetch `GET /api/version` at runtime and render `Task Notes v{version}`. TEST-09 made that same response carry `commit`, the first 12 characters of `BUILD_COMMIT` or `unknown`. This item reads `commit` from the response the footer already fetches and renders its first 7 characters in parentheses after the version.

- `frontend/src/api/version.ts`: `fetchBackendVersion()` returns a `BackendBuildInfo` (`{ version, commit }`) instead of a bare version string, with the commit normalised to its first 7 characters, or `null` when it cannot be resolved. Still one request, no new endpoint call.
- `frontend/src/components/AppFooter.tsx`: holds the build info in state and renders an extra `app-footer-commit` span when a commit resolved.
- Tests: the existing colocated Vitest files for both modules are updated to the new return shape and extended with the commit paths; one new Playwright spec plus UAT artifacts.

**Layers: frontend only.** No backend file changes: the endpoint and its `commit` field already exist on main (TEST-09, d3f91e5).

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify):
    - Add `export type BackendBuildInfo = { version: string; commit: string | null };` and `const SHORT_COMMIT_LENGTH = 7;` with a one-line comment saying why 7 (the footer's short commit; the backend already shortened it to 12).
    - Widen the existing response type to `BackendVersion = { version: string; commit?: unknown }` (the type guard still requires only a string `version`, so a backend without `commit` stays valid).
    - Change `fetchBackendVersion(): Promise<string | null>` to `fetchBackendVersion(): Promise<BackendBuildInfo | null>`. Unchanged: the single `GET ${API_BASE_URL}/api/version`, the non-OK throw, the unexpected-shape throw, the network-error propagation, and `null` when the trimmed `version` is blank or `unknown`.
    - New: a small private `toShortCommit(raw: unknown): string | null` that returns `null` when `raw` is not a string, or is blank or `unknown` after trim; otherwise `trimmed.slice(0, SHORT_COMMIT_LENGTH)`. Reuse the existing `UNRESOLVED_BACKEND_VERSION = "unknown"` constant for the sentinel (rename it to `UNRESOLVED_SENTINEL` or keep the name and its comment widened to cover both fields; either is fine, one constant only).
    - Resolved result: `{ version: trimmedVersion, commit: toShortCommit(body.commit) }`.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `useState<BackendBuildInfo | null>(null)`; the effect stores the resolved value (same `isMounted` guard, `.catch` sets `null`). Render:
    `{APP_NAME}{buildInfo !== null && (<><span data-testid="app-footer-version">{` v${buildInfo.version}`}</span>{buildInfo.commit !== null && (<span data-testid="app-footer-commit">{` (${buildInfo.commit})`}</span>)}</>)}`
    so the footer text is `Task Notes v0.1.0 (abc1234)` with a commit, `Task Notes v0.1.0` without one, and exactly `Task Notes` while pending, on failure, or for an unresolved version. `footerStyle`, the `<footer>` element and `data-testid="app-footer"` are unchanged. Update the state comment to say `null` covers pending, failed and unresolved-version alike.
- Routes: none (the footer is on `/`, rendered by the unchanged `LandingPage.tsx`).
- State management: the existing local `useState` plus `useEffect` in `AppFooter`; no store, no retry, no polling, no second request.
- Design reference notes: AI freestyle (Design Reference mode NONE). Keep TEST-04's footer values unchanged: `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`. The commit `<span>` adds no style of its own and inherits them. Display format `Task Notes v{version} ({first 7 chars of commit})`, e.g. `Task Notes v0.1.0 (abc1234)`, a single space before the opening parenthesis.

## Backend Plan
No backend changes required.

`GET /api/version` already returns `{"version": str, "commit": str}` (TEST-09: `backend/app/routers/version.py`, `backend/app/schemas/version.py`, `backend/app/services/version_service.py` with `COMMIT_LENGTH = 12`, and `backend/app/core/config.py` defaulting `BUILD_COMMIT` to `unknown`). This item is a runtime consumer of that field and edits none of those files.

## API Integration Plan
No external API integration. The footer consumes this project's own backend through the internal contract below.

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL, default http://localhost:8010}/api/version` (existing, TEST-05 and TEST-09; unchanged by this item)
- Request: no body, no query parameters, no auth.
- Response: `200 OK`, `application/json`, example `{"version": "0.1.0", "commit": "0123456789ab"}`. `commit` is the first 12 characters of `BUILD_COMMIT`, or `unknown` when it is unset or blank.
- Client-side interpretation (`fetchBackendVersion`):
  - `{"version": "0.1.0", "commit": "0123456789ab"}` gives `{ version: "0.1.0", commit: "0123456" }`, displayed `Task Notes v0.1.0 (0123456)`.
  - `{"version": "0.1.0", "commit": "unknown"}`, a blank commit, a non-string commit, or no `commit` field gives `{ version: "0.1.0", commit: null }`, displayed `Task Notes v0.1.0`.
  - `version` blank or `unknown` gives `null`, displayed `Task Notes`, whatever `commit` holds.
  - Non-OK status, malformed body (no string `version`) or network error throws; the footer catches it and displays `Task Notes`.

## Technology Selection
- Commit shortening in `frontend/src/api/version.ts`: chose the standard `String.prototype.slice(0, 7)` over any git or formatting library; the standard library covers it.
- Commit and version state in `AppFooter.tsx`: chose React's built-in `useState` and `useEffect`, already used there, over a data-fetching dependency; one fire-once GET needs nothing more.
- Request: reuse the existing `fetch` call in `fetchBackendVersion`, over a second request or a second client function; the commit is in the response the footer already reads.
- No net-new module or dependency is introduced, so no lockfile changes.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright spec; with `/api/version` fulfilled as `{version: <backend version>, commit: "0123456789ab"}` the footer reads `Task Notes v{version} (0123456)`; edge case: commit `unknown` leaves `Task Notes v{version}` and no `app-footer-commit`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus the commit-unknown edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `BackendBuildInfo` (`version` plus `commit` shortened to 7 characters or `null`) instead of a bare string; tolerate a missing, non-string, blank or `unknown` commit
- [A] frontend/src/api/version.test.ts: update expectations to the new return shape and add the commit cases (12-char commit shortened to 7, `unknown`, blank, missing, non-string, version `unknown` with a known commit)
- [A] frontend/src/components/AppFooter.tsx: hold the build info in state and render the `app-footer-commit` span ` ({commit})` after the version when a commit resolved
- [A] frontend/src/components/AppFooter.test.tsx: mock the client with the new shape; add success-with-commit, version-without-commit, pending and failure assertions for the commit span; keep TEST-08's version and landmark tests

No dependency is added or changed, so no lockfile (`frontend/package-lock.json`, root `package-lock.json`, `backend/uv.lock`) is modified. `README.md` and `docs/DEVELOPMENT.md` need no edit: this item changes no project structure, run configuration, dependency or test infrastructure, and `docs/DEVELOPMENT.md` line 669 already describes exactly this footer behaviour (format, 7 characters, omission rules). TEST-08's E2E spec and UAT artifacts stay true unchanged: its assertions use `toContainText` for the version, and its exact-`Task Notes` assertions cover the aborted-request state this item does not change; its manual script's `Task Notes v0.1.0` holds with `BUILD_COMMIT` unset, the default. `frontend/src/components/LandingPage.tsx` and every backend file are not modified.

## Testing Strategy
- Unit tests (Vitest, colocated `*.test.ts(x)` beside the module, the existing frontend convention; `backend/tests/unit/` and `test_{module}_unit.py` are the backend's and do not apply because no backend code changes):
  - `frontend/src/api/version.test.ts` (`fetch` stubbed via `vi.stubGlobal`, as today):
    - `{"version": "0.1.0", "commit": "0123456789ab"}` resolves to `{ version: "0.1.0", commit: "0123456" }` and calls `http://localhost:8010/api/version` once.
    - Commit `"unknown"`, `"  "`, absent, or `42` resolves to `{ version: "0.1.0", commit: null }` (no throw).
    - A commit shorter than 7 characters (`"abc"`) resolves to `commit: "abc"`.
    - Version `"unknown"` or blank resolves to `null` even with commit `"0123456789ab"`.
    - Existing cases kept, updated to the new shape: non-OK throw, unexpected-shape throws (`{}`, `{"version": 1}`), network failure propagates, `VITE_API_BASE_URL` override.
  - `frontend/src/components/AppFooter.test.tsx` (`vi.mock("../api/version")`):
    - Success: resolved `{ version: "0.1.0", commit: "abc1234" }` → `app-footer-commit` text ` (abc1234)` and footer text `Task Notes v0.1.0 (abc1234)` (criteria 1 and 3, success path).
    - Version without commit: resolved `{ version: "0.1.0", commit: null }` → footer text exactly `Task Notes v0.1.0`, no `app-footer-commit` (criterion 2, version alone).
    - Pending: never-settling promise → footer text exactly `Task Notes`, no `app-footer-commit`, no `app-footer-version` (criteria 2 and 3, pending path).
    - Failure: rejected promise → after it settles, footer text exactly `Task Notes`, no `app-footer-commit`, text contains none of `undefined`, `null`, `unknown`, `Error` (criteria 2 and 3, failure path).
    - Unresolved version: resolved `null` → exactly `Task Notes`.
    - Kept: app name, fetched once on mount, contentinfo landmark with `data-testid="app-footer"`.
  - Directory: colocated under `frontend/src/`
  - Naming: `{Module}.test.ts(x)`
- Integration tests: none new. `GET /api/version` and its `commit` field are unchanged and already covered by TEST-09's `backend/tests/integration/test_version_integration.py`; this item adds or modifies no endpoint, repository or model, so `testing_standards.md` Section 6 warrants no integration tier.
  - Directory: backend/tests/integration/ (untouched)
- E2E tests:
  - `e2e/tests/TEST-10_footer_build_commit.spec.ts`:
    - (1) `page.route("**/api/version", ...)` fulfils `200` with `{"version": <readBackendVersion()>, "commit": "0123456789ab"}` (helper from `e2e/helpers/backendVersion.ts`, reused unchanged); `goto("/")`; `getByTestId("app-footer")` has text `Task Notes v{backendVersion} (0123456)` and `getByTestId("app-footer-commit")` has text ` (0123456)`. The route is fulfilled because CI and a default local run leave `BUILD_COMMIT` unset, so the real backend answers `unknown` and no commit would ever render; fulfilling keeps the spec deterministic (`testing_standards.md` Section 1.3).
    - (2) Edge case: the route fulfils `{"version": <backendVersion>, "commit": "unknown"}`; the footer has text exactly `Task Notes v{backendVersion}` and `app-footer-commit` has count 0.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the commit-unknown edge case in `e2e/uat/scenarios/TEST-10_footer_build_commit.feature`; the manual script expands `## Manual verification plan`.
  - Directory: e2e/uat/scenarios/ and e2e/uat/scripts/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | It is a rendering rule over client outcomes (pending, rejected, commit unresolved), each set directly by mocking the client, with no navigation or interaction; the E2E edge-case spec (commit `unknown`) is the feature's required edge-case spec, not the covering tier. |
| 3 | A component test covers the success, pending and failure paths | Unit | The criterion is itself a requirement on the component test `AppFooter.test.tsx`, satisfied by that file's tests passing, not by browser behaviour. |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | Fulfil `/api/version` with commit `0123456789ab`; `goto("/")`; footer text `Task Notes v{version} (0123456)` | Given the backend runs with BUILD_COMMIT 0123456789abcdef0123456789abcdef01234567, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (0123456)" |
| 2 | Pending or failed request shows no commit, never undefined or an error | covered at Unit, see Criterion coverage (E2E edge-case spec: commit `unknown` gives `Task Notes v{version}`) | Given the backend is stopped, When I open the landing page, Then the footer reads exactly "Task Notes" with no "undefined", "null" or error text |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the AppFooter component tests, Then they report 0 failed, including success, pending and failure cases |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from GET /api/version, next to the version
Prerequisites: from the repo root, start the stack with the backend given a known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` (services `db`, `backend`, `frontend`); `backend/pyproject.toml` declares `version = "0.1.0"`.
1. Open `http://localhost:8010/api/version` in a browser tab → the page shows `{"version":"0.1.0","commit":"0123456789ab"}`.
2. Open `http://localhost:5183/` → the landing page renders with the footer at the bottom.
3. Read the footer → it reads exactly `Task Notes v0.1.0 (0123456)`: the version, a space, then the first 7 characters of the commit in parentheses.
4. In DevTools → Network, filter on `version` and reload → exactly one `GET http://localhost:8010/api/version` request (status 200) appears; the footer still reads `Task Notes v0.1.0 (0123456)`.
5. In DevTools → Elements, inspect the footer → it contains a `data-testid="app-footer-version"` span with ` v0.1.0` followed by a `data-testid="app-footer-commit"` span with ` (0123456)`.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error
Prerequisites: same stack as Criterion 1.
1. Loading state: in DevTools → Network set throttling to "Slow 3G" and reload `http://localhost:5183/` → until `/api/version` completes the footer reads exactly `Task Notes` (no `undefined`, no `null`, no placeholder word); when it completes it changes to `Task Notes v0.1.0 (0123456)`. Reset throttling to "No throttling".
2. Run `docker compose stop backend` from the repo root, then hard-reload `http://localhost:5183/` (Cmd+Shift+R) → the footer reads exactly `Task Notes`: no commit, no `undefined`, no `null`, no error text.
3. Run `docker compose up -d --build backend` from the repo root with no `BUILD_COMMIT` set, wait until `http://localhost:8010/api/version` shows `{"version":"0.1.0","commit":"unknown"}`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`, the version alone, with no parentheses and no `unknown`.
4. In DevTools → Elements, inspect the footer → there is no `app-footer-commit` span.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` from the repo root → the run lists `AppFooter.test.tsx` and `version.test.ts` and reports 0 failed.
2. Open `frontend/src/components/AppFooter.test.tsx` → it has a test where the mocked client resolves a version and commit and the footer shows `Task Notes v0.1.0 (abc1234)` (success), a test with a never-settling promise where the footer shows exactly `Task Notes` (pending), and a test where the client rejects and the footer shows exactly `Task Notes` with no commit span (failure).
