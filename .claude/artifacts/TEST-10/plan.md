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
<!--
  First plan on this base (f787cf2e). The tracker item carries 58 comments, read in three pages
  (25, 25, 8) on 2026-11-27; every one starts with "mayker-dev:" (earlier runs' PR notices) and is
  ignored per the dispatch. No human tracker comment, no PR review comment, and no merged-since
  overlap (fresh plan, branched from current main), so there is no feedback line to record.
  The assumptions this plan makes are listed under Plan Overview -> Assumptions.
-->
No human feedback: 0 human tracker comments (58 framework comments ignored), no PR comments, merged-since n/a (fresh plan, branched from current main f787cf2e).

## Plan Overview
Frontend only. TEST-09 (merged, #1055) made `GET /api/version` return `{"version": "...", "commit": "..."}`, where `commit` is BUILD_COMMIT cut to 12 characters, or `"unknown"` when unset. TEST-08 (merged, #1056) renders `Task Notes v{version}` in `AppFooter` through `frontend/src/api/version.ts`, which today returns only the version string.

This item:
1. Widens the API client `fetchVersion()` to return both fields, `{ version, commit }`, with `commit` read tolerantly (`null` when the body carries no string commit) so a missing commit never turns a good version into a failure.
2. Makes `AppFooter` render the first 7 characters of a usable commit in parentheses, in its own span, after the version: `Task Notes v0.1.0 (3f9c2ab)`.
3. Keeps every TEST-08 state otherwise: pending and failure stay exactly `Task Notes`.

Assumptions (recorded per `user_story_alignment.md` Section 4; no human comment contradicts or settles them):
A1. Criterion 2's "the version alone" while pending or failed: the version and the commit arrive in the same `GET /api/version` response, so while it is pending or after it fails no version is known either. The footer then shows exactly `Task Notes` (TEST-08's pending and failure states), never `undefined`, `null`, `unknown` or an error text. "The version alone" (`Task Notes v{version}`, no commit span) is what shows when the request succeeds but the commit is not usable. Making a version visible before the response arrives would need a build-time version source, which no criterion asks for.
A2. A usable commit is a string that is non-blank after trimming and is not the backend's `"unknown"` sentinel. Missing, non-string, blank or `"unknown"` all render the version alone.
A3. The commit renders only together with the version: when the version itself is unusable (blank or `"unknown"`, TEST-08's rule) the footer stays exactly `Task Notes` and no commit is shown, since criterion 1 places the commit "next to the version".
A4. Display format `v{version} ({first 7})`, the commit in a `data-testid="app-footer-commit"` span inside the footer. The backend already cuts to 12; the frontend cuts to 7 with `slice(0, 7)`, so a shorter commit shows whole.
A5. `fetchVersion` keeps its name and its single call site, and changes its resolved type from `string` to `{ version, commit }`. This forces a one-line change in `LandingPage.test.tsx` (its `fetchVersion` mock resolves a bare string, which would leave the footer without a version and fail that file's footer test). `LandingPage.tsx` itself is not touched.
A6. Existing E2E specs TEST-04 and TEST-08 assert with `toContainText` on success and `toHaveText("Task Notes")` only on the routed 500, so both hold with a commit shown; neither is modified.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `VersionResponse` becomes `{ version: string; commit: string }` (the backend shape) and a new exported `VersionInfo = { version: string; commit: string | null }` is what `fetchVersion(): Promise<VersionInfo>` resolves. Version validation unchanged (non-OK status or non-string version still throws); `commit` is `body.commit` when it is a string, else `null`.
  - `frontend/src/components/AppFooter.tsx`: state holds `VersionInfo | null`; the existing usable-version rule is kept; add a module constant `SHORT_COMMIT_LENGTH = 7` and a small pure helper `shortCommit(commit: string | null): string | null` in the same file (returns `null` for null, blank or `"unknown"`, else `commit.trim().slice(0, 7)`). Render `<span data-testid="app-footer-commit"> ({short})</span>` after the version span, only when both version and short commit are present.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today; no new context or store.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span inherits the footer's existing style (`fontSize 0.875rem`, `color #5f5f5f`); no new style values.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
Consumed, unchanged (delivered by TEST-09):
- Method: GET
- URL: `/api/version`
- Request: no body, no parameters
- Response: 200, `{"version": "0.1.0", "commit": "3f9c2ab41d0e"}`; `commit` is `"unknown"` when BUILD_COMMIT is unset.

Frontend client contract (changed by this item):
- `fetchVersion(): Promise<VersionInfo>` resolves `{ version: "0.1.0", commit: "3f9c2ab41d0e" }`; `commit` is `null` when the body's commit is absent or not a string; rejects on a non-OK status or a non-string version, as before.

## Technology Selection
- Commit shortening: chose the standard `String.prototype.slice(0, 7)` and `trim()` over any formatting dependency, because the need is one string operation.
- No net-new component, module or dependency otherwise: the change extends the existing `AppFooter` component and the existing `api/version.ts` client, and uses the already-installed Vitest, Testing Library and Playwright for tests.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright spec, footer shows the short commit next to the version (routed fixed body) and shows no commit when GET /api/version fails
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }` (`VersionInfo`), commit read tolerantly
- [A] frontend/src/api/version.test.ts: assert the commit is returned, and is null when absent or non-string
- [A] frontend/src/components/AppFooter.tsx: render the first 7 characters of a usable commit after the version, in an `app-footer-commit` span
- [A] frontend/src/components/AppFooter.test.tsx: mocks resolve `VersionInfo` objects; success, pending, failure and unusable-commit cases
- [A] frontend/src/components/LandingPage.test.tsx: one line, the `fetchVersion` mock resolves `{ version: BACKEND_VERSION, commit: null }` instead of a bare string

No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: `fetchVersion` client parsing (Vitest, stubbed `fetch`) and `AppFooter` rendering for success, pending, failure, and unusable commit (Vitest + Testing Library, `fetchVersion` mocked).
  - Directory: beside the code, `frontend/src/api/` and `frontend/src/components/` (project-standards.md Layout; CLAUDE.md's unit directory is the backend's)
  - Naming: `{Module}.test.ts(x)`, as `AppFooter.test.tsx`
- Integration tests: not warranted. No router, repository, model or migration changes; `GET /api/version` is already covered by TEST-09's integration tests.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: one spec file. Criterion 1 in the browser, with `page.route` fulfilling `GET /api/version` with a fixed body `{"version": "1.2.3", "commit": "abcdef1234567890"}` so the assertion does not depend on BUILD_COMMIT on the CI stack; plus the edge case, a routed 500 shows exactly `Task Notes` and no commit element.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one per criterion plus the unusable-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added | E2E | `shows the first 7 characters of the commit next to the version in the footer`, `renders the first 7 characters of the commit next to the version`, `returns the version and the commit from GET /api/version` | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error | Unit | `renders exactly Task Notes while the version is loading`, `renders exactly Task Notes when the version request fails`, `renders the version alone when the commit is the unknown sentinel`, `renders the version alone when the response carries no commit`, `returns a null commit when the body carries no string commit` | verifying it needs no navigation or interaction: pending and failure are component states driven by the mocked client; the E2E edge-case spec `shows the footer without a commit when GET /api/version fails` adds a browser check of the failure path |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the first 7 characters of the commit next to the version`, `renders exactly Task Notes while the version is loading`, `renders exactly Task Notes when the version request fails` | the criterion is itself about the component test in `AppFooter.test.tsx`; no browser behaviour to verify |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the first 7 characters of the commit next to the version | Route `**/api/version` to `{"version": "1.2.3", "commit": "abcdef1234567890"}`, open `/`, expect `app-footer` to have text `Task Notes v1.2.3 (abcdef1)` and `app-footer-commit` to contain `abcdef1` | Given the backend reports version 1.2.3 and commit abcdef1234567890, When I open the landing page, Then the footer reads "Task Notes v1.2.3 (abcdef1)" |
| 2 | Pending or failed request shows no commit, never undefined or an error | covered at Unit, see Criterion coverage; E2E edge case routes a 500 and expects exactly `Task Notes` and no `app-footer-commit` | Given GET /api/version fails, When I open the landing page, Then the footer reads exactly "Task Notes" with no "undefined" or error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run AppFooter.test.tsx, Then the success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: the stack is running with the backend started with `BUILD_COMMIT=3f9c2ab41d0e5b6c7d8e9f001122334455667788` (for example `BUILD_COMMIT=3f9c2ab41d0e5b6c7d8e9f001122334455667788 docker compose up --build`), frontend at http://localhost:5183.
1. Open http://localhost:8000/api/version in the browser → the JSON shows `"commit": "3f9c2ab41d0e"` and a `"version"` value; note the version (for example `0.1.0`).
2. Open http://localhost:5183/ → the landing page shows the "Task Notes" heading, the note form and a footer at the bottom.
3. Read the footer → it reads `Task Notes v0.1.0 (3f9c2ab)`: the version from step 1, then the first 7 characters of the commit in parentheses.

### Criterion 2: While the request is pending or when it fails, no undefined or error is shown
Prerequisites: the stack is running as above; Chrome DevTools available.
1. Open http://localhost:5183/, open DevTools → Network, set throttling to "Slow 3G", and reload → while `/api/version` is still pending the footer reads exactly `Task Notes`, with no `undefined`, no `null` and no error text.
2. Wait for the request to finish → the footer changes to `Task Notes v0.1.0 (3f9c2ab)`.
3. In DevTools → Network, right-click the `version` request, choose "Block request URL", and reload → the footer reads exactly `Task Notes`, with no `undefined`, no parentheses and no error text.
4. Remove the block, stop the backend, restart it without BUILD_COMMIT (`docker compose up --build`), and reload → `/api/version` returns `"commit": "unknown"` and the footer reads `Task Notes v0.1.0` with no parentheses (the version alone).

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run lists `renders the first 7 characters of the commit next to the version`, `renders exactly Task Notes while the version is loading` and `renders exactly Task Notes when the version request fails`, its summary line reports no failed or errored test, and the command exits 0.
