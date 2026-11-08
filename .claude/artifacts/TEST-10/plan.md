# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What:** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria:**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes:** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): none actionable. The dispatch reports the item's tracker comments are all framework PR notices from earlier runs; none changes scope, so nothing here acts on them.
- Merged since the last plan: n/a (fresh plan, branched from current main a765934, which already contains both dependencies: TEST-09 #654 and TEST-08 #655).
- Assumption (ambiguity in criterion 2, recorded instead of blocking): the version and the commit arrive in the **same** `GET /api/version` response, so while that request is pending or after it fails there is no version to show either. TEST-08 (merged) already decided that state: the footer reads exactly `Task Notes`, never `undefined`, `null`, `unknown` or an error. This plan keeps that unchanged and reads criterion 2 as "the commit adds nothing to the footer until it is resolved": pending and failed requests render TEST-08's footer as it is today (`Task Notes`, plus `v{version}` once a version is known), and no commit text, placeholder or error message ever appears. A second request just for the commit was rejected: it would duplicate the call and add a state (version shown, commit pending) the ticket does not ask for.
- Assumption (commit present but unusable): a 200 response whose `commit` is missing, not a string, empty, or the backend's default `"unknown"` (TEST-09, `backend/app/core/config.py` `DEFAULT_BUILD_COMMIT`) is treated as an unresolved commit, so the footer shows the version alone (`Task Notes v0.1.0`). This is the state CI and an image built without `BUILD_COMMIT` produce, so it is the realistic "version alone" case.
- Assumption (no version, commit present): the commit is only ever shown next to a version; when the version is unresolved (TEST-08's null cases) the footer reads `Task Notes` and the commit is not shown on its own.
- Display format decided: `Task Notes v0.1.0 (a1b2c3d)`, the 7-character commit in parentheses after the version, inside its own `<span data-testid="app-footer-commit">`. The backend already cuts the commit to 12 characters (TEST-09); the frontend cuts it to 7 per criterion 1.
- Description note "Frontend only, under `frontend/src/`": honoured for code; the plan also adds this item's own E2E spec and UAT artifacts under `e2e/`. TEST-04's and TEST-08's existing E2E specs stay true with the commit in its own span and are not edited (see `## File Manifest`).

## Plan Overview
Frontend-only change on top of TEST-08's footer. The version client in `frontend/src/api/version.ts` stops discarding the `commit` field TEST-09 added: `getBackendVersion()` is replaced by `getBackendBuildInfo()`, which returns `{ version, commit }` (commit already cut to 7 characters, or `null` when unusable) or `null` when no usable version came back, and rejects on a network error or non-OK status exactly as today. `AppFooter` keeps one fetch on mount and renders `Task Notes`, then ` v{version}` when a version is known, then ` ({commit})` when a commit is also known. No backend, database, dependency or configuration change. Tests: client unit tests, component tests for success, pending, failure and commit-unresolved paths, the LandingPage test re-pointed at the new client function, one new E2E spec.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): `VersionResponse` becomes `{ version: string; commit: string }` (TEST-09's schema). Export `BuildInfo = { version: string; commit: string | null }` and `COMMIT_DISPLAY_LENGTH = 7`. Rename `getBackendVersion()` to `getBackendBuildInfo(): Promise<BuildInfo | null>`: same URL, same rejection on non-OK (`Loading the version failed: {status} {statusText}`) and on network error; resolves `null` when the version is missing, non-string, empty or `"unknown"` (unchanged rule); otherwise resolves `{ version, commit }` where `commit` is `body.commit.slice(0, COMMIT_DISPLAY_LENGTH)` when `body.commit` is a non-empty string other than `"unknown"`, else `null`. The single `UNKNOWN` sentinel constant serves both fields. The old name is removed rather than kept beside the new one, so the client has one function for one request.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `useState<BuildInfo | null>(null)`, set from `getBackendBuildInfo()` with the existing `isMounted` guard and the existing silent `.catch`. Render `Task Notes`; when build info is non-null, `<span data-testid="app-footer-version"> v{version}</span>`; when build info is non-null and its commit is non-null, `<span data-testid="app-footer-commit"> ({commit})</span>` immediately after. `data-testid="app-footer"`, the contentinfo landmark and `footerStyle` are unchanged.
  - `frontend/src/components/LandingPage.tsx`: **not modified** (the fetch stays inside `AppFooter`, as TEST-08 placed it).
- Routes: none.
- State management: local `useState` in `AppFooter`; no shared store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit inherits the footer's existing TEST-04 styles (font-size 0.875rem, color #5f5f5f, margin-top 1.5rem on the footer); no new visual values.

## Backend Plan
No backend changes required. `GET /api/version` already returns `{"version", "commit"}` on main (TEST-09, #654: `backend/app/schemas/version.py`, `backend/app/services/version_service.py`, commit from `BUILD_COMMIT` cut to 12 characters, `"unknown"` when unset).

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing; called at `${VITE_API_BASE_URL or http://localhost:8010}/api/version` through `frontend/src/api/baseUrl.ts`)
- Request: none
- Response: 200, `{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}`; `commit` is `"unknown"` when the backend image was built without `BUILD_COMMIT`.
- Client mapping: usable version and usable commit → `{ version: "0.1.0", commit: "a1b2c3d" }` → footer `Task Notes v0.1.0 (a1b2c3d)`; usable version, unusable commit → `{ version: "0.1.0", commit: null }` → `Task Notes v0.1.0`; unusable version, pending, or any failure → footer `Task Notes`.

## Technology Selection
- Commit shortening in `frontend/src/api/version.ts`: chose the standard library's `String.prototype.slice` over any helper or dependency; it is one call.
- Footer commit state: chose React's built-in `useState`/`useEffect` (already installed and already used by `AppFooter`) over a data-fetching or state library.
- Fetching the commit: chose to extend the existing native-`fetch` client for the same request over a second request or a new client module, because one response already carries both fields.
- No net-new module, component or dependency is introduced; every code entry modifies an existing file.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: footer shows `v{version} ({first 7 of commit})` from a fulfilled `/api/version` response, and the version alone when the commit is `"unknown"`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the commit-unknown edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: read `commit`, cut it to 7 characters, return `BuildInfo`; rename `getBackendVersion` to `getBackendBuildInfo`
- [A] frontend/src/api/version.test.ts: re-point to `getBackendBuildInfo`; add cases for commit cut to 7, commit already shorter than 7 kept whole, commit `"unknown"`, empty, missing and non-string resolving to `commit: null`; keep the non-OK, network-error, version-sentinel and base-URL cases
- [A] frontend/src/components/AppFooter.tsx: hold `BuildInfo`, render the commit span after the version when known
- [A] frontend/src/components/AppFooter.test.tsx: mock `getBackendBuildInfo`; success path `Task Notes v0.1.0 (a1b2c3d)`; pending and failure paths `Task Notes` with no version or commit span and no `undefined`, `null`, `unknown` or error text; commit-null path `Task Notes v0.1.0` with no commit span; keep the landmark test
- [A] frontend/src/components/LandingPage.test.tsx: mock `getBackendBuildInfo` instead of `getBackendVersion` and resolve it to `{ version: "0.1.0", commit: null }`, keeping its footer-version assertion

`e2e/tests/TEST-08_footer_app_version.spec.ts` and `e2e/tests/TEST-04_page_footer.spec.ts` need no edit: their assertions are `toHaveText` on the `app-footer-version` span (which still holds only ` v{version}`), `toContainText` on the footer, and exact `Task Notes` only on the unreachable path, all of which stay true with a separate commit span.

No dependency manifest changes, so no lockfile is regenerated. No `README.md` or `docs/DEVELOPMENT.md` edit is expected: the feature changes no project structure, run configuration, dependency or test infrastructure (`BUILD_COMMIT` is already documented by TEST-09 in `.env.example`).

## Testing Strategy
- Unit tests: `frontend/src/api/version.test.ts` (stubbed `fetch`, as today): `{version:"0.1.0", commit:"a1b2c3d4e5f6"}` resolves `{version:"0.1.0", commit:"a1b2c3d"}`; commit `"abc"` resolves `commit:"abc"`; commit `"unknown"`, `""`, missing and `42` resolve `commit:null`; version `"unknown"` resolves `null` whatever the commit; non-OK rejects with status text; network error propagates; `VITE_API_BASE_URL` override still changes the URL. `frontend/src/components/AppFooter.test.tsx` with `../api/version` mocked: success, pending (never-settling promise), failure (rejected promise), resolved `null`, and commit-null paths, each asserting the footer's exact `textContent`.
  - Directory: frontend tests are co-located under `frontend/src/` (Vitest, the existing precedent); backend `backend/tests/unit/` is untouched
  - Naming: `{module}.test.ts(x)` beside the module, the existing frontend precedent
- Integration tests: no backend code changes, so none are added; the endpoint stays covered by the existing `backend/tests/integration/test_version_integration.py` (TEST-05 and TEST-09), which must still pass.
  - Directory: backend/tests/integration/
- E2E tests: one spec. (a) `page.route("**/api/version", ...)` fulfils `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}`, navigate to `/`, expect `app-footer` to have text exactly `Task Notes v0.1.0 (a1b2c3d)` and `app-footer-commit` to contain `(a1b2c3d)` and not `a1b2c3d4`. The response is fulfilled because CI and local stacks build the backend without `BUILD_COMMIT`, so the live commit is `"unknown"` and a real 7-character value cannot be asserted deterministically. (b) Edge case: fulfil `{"version":"0.1.0","commit":"unknown"}`, navigate to `/`, expect `app-footer` to have text exactly `Task Notes v0.1.0` and `app-footer-commit` to have count 0. The unreachable-endpoint case is already covered by TEST-08's spec and is not duplicated.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the commit-unknown edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While pending or on failure, the footer shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: pending and failure are render branches of `AppFooter` on a never-settling or rejected client promise, plus the client's commit-null mapping; TEST-08's existing E2E unreachable spec already exercises the failure case on the real page |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component-test requirement, satisfied by `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | Fulfil `/api/version` with a 12-character commit, go to `/`, expect footer text exactly `Task Notes v0.1.0 (a1b2c3d)` | Given the backend was built with BUILD_COMMIT a1b2c3d4e5f6 When I open the landing page Then the footer reads "Task Notes v0.1.0 (a1b2c3d)" |
| 2 | Pending or failed request shows no commit, no `undefined`, no error | covered at Unit, see Criterion coverage; E2E edge case shows the version alone when the commit is `"unknown"` | Given the version endpoint is unreachable When I open the landing page Then the footer reads "Task Notes" with no commit, "undefined" or error |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite When I run the AppFooter tests Then the success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from GET /api/version, next to the version
Prerequisites: from the repository root, build and start the stack with a known commit: `BUILD_COMMIT=a1b2c3d4e5f67890 docker compose up -d --build`. Backend on http://localhost:8010, frontend on http://localhost:5183.
1. Open http://localhost:8010/api/version in a browser tab → the page shows `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}` (the backend's 12-character form).
2. Open http://localhost:5183/ → the landing page shows the `Task Notes` heading, the note form and a footer at the bottom.
3. Read the footer → it reads exactly `Task Notes v0.1.0 (a1b2c3d)`: the version, then the first 7 characters of the commit from step 1 in parentheses.
4. Open DevTools, Elements tab, select the footer → it contains a `span` with `data-testid="app-footer-commit"` holding `(a1b2c3d)`, right after the `app-footer-version` span.

### Criterion 2: While the request is pending or fails, the footer shows the version alone, never undefined or an error
Prerequisites: the stack is running as for criterion 1.
1. Open http://localhost:5183/, DevTools, Network tab, set throttling to `Slow 3G`, reload, and watch the footer before the `/api/version` request finishes → the footer reads `Task Notes`, with no commit, no `undefined`, no `null` and no error text; once the request finishes it reads `Task Notes v0.1.0 (a1b2c3d)`. Set throttling back to `No throttling`.
2. Stop the backend only: `docker compose stop backend`, then reload http://localhost:5183/ → the footer reads exactly `Task Notes`, with no commit, no `undefined` and no error message; the Network tab shows the `/api/version` request as failed.
3. Rebuild the backend without a commit: `docker compose up -d --build backend` (no `BUILD_COMMIT` set), then open http://localhost:8010/api/version → it shows `"commit":"unknown"`.
4. Reload http://localhost:5183/ → the footer reads exactly `Task Notes v0.1.0`: the version alone, with no `(unknown)`, no empty parentheses and no trailing space.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`, and the AppFooter test list includes a success test (version and commit), a pending test and a failure test.
