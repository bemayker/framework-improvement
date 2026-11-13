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

(Tracker task 123k99cwybm, read from ClickUp workspace 30307190. Both dependencies are merged on the plan base `293907c4c7f905c127f702c51ad48a381b1cf12e`.)

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 41 comments across 2 pages, all the framework's own "PR opened" notes from earlier runs, none from a human and none actionable → not acted on, because they carry no requirement or correction.
- Merged since the last plan: n/a (fresh plan, branched from current main `293907c4c7f905c127f702c51ad48a381b1cf12e`, which already holds TEST-09 `4e346c0` and TEST-08 `293907c`).
- Assumption (criterion 2, "the version alone"): the version and the commit arrive in the same `GET /api/version` response, so while that request is pending or after it fails there is no version to show either. The footer then shows exactly what TEST-08 shows in those states, the app name `Task Notes` alone, with no commit and no placeholder. "The version alone" is read as "no commit is ever shown without a successful response", and its one reachable form is a successful response whose commit is not usable: the backend's `"unknown"` sentinel (TEST-09's default when `BUILD_COMMIT` is unset), an empty string, a missing field or a non-string. In that case the footer shows `Task Notes v{version}` with no commit, exactly as today.
- Assumption (criterion 1, "next to the version"): the rendered form is `Task Notes v0.1.0 (a1b2c3d)`, the 7-character commit in parentheses after the version, one space between. No label such as "commit" or "build" is added, and no link to the commit is made (not asked for, `user_story_alignment.md` Section 3).
- Assumption (where the commit is cut): the API client returns the commit as the backend sends it (up to 12 characters, or `null` when unusable), and `AppFooter` cuts it to 7 for display. The 7 is a display rule of this footer, so it lives with the footer and its component tests, as criterion 3 asks.
- Assumption (shared client): `fetchBackendVersion` keeps its name and its rejection rules for an unusable version, and changes its resolved value from a string to `{ version, commit }`. A second request or a second client function for the commit would double the calls to the same endpoint for no gain.
- Dispatch note (feature map): the map flags TEST-10 against BUG-04 on `frontend/src/components/LandingPage.tsx`. This plan does not modify `LandingPage.tsx`; it modifies `LandingPage.test.tsx`, whose version mock must return the new shape. BUG-04's manifest names neither file, so there is no real overlap with BUG-04 (see `shared_risks.md`). The real overlap is with CHORE-02, on `frontend/src/api/version.ts` and `frontend/src/components/AppFooter.tsx`.

## Plan Overview
Frontend-only change on top of TEST-08's footer and TEST-09's endpoint. `frontend/src/api/version.ts` reads the `commit` field TEST-09 added to `GET /api/version` and resolves `{ version, commit }`, with `commit` set to `null` when it is missing, not a string, empty or the backend's `"unknown"` sentinel. `frontend/src/components/AppFooter.tsx` stores that pair and renders `Task Notes v{version} ({first 7 characters of commit})`, falling back to `Task Notes v{version}` when there is no usable commit and to `Task Notes` while pending or after a failure, as today. Tests: Vitest client tests for the new field, Vitest component tests for success, pending, failure and no-usable-commit, the `LandingPage` test's mock updated to the new shape, one Playwright spec that serves a known commit through `page.route`, and the TEST-08 spec's exact-text success assertion loosened to accept the commit suffix. No backend change.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): export `interface BackendVersion { version: string; commit: string | null }`. `fetchBackendVersion(): Promise<BackendVersion>`. Keep every existing rejection (non-OK status, network error, non-object body, missing, empty, non-string or `"unknown"` version). Read `commit` from the same body: a non-empty string other than `"unknown"` is returned as is; anything else becomes `null`. An unusable commit never rejects, because the version is still worth showing. Reuse the existing `UNKNOWN_VERSION` constant's value for the commit sentinel under a name that says it covers both fields (for example `UNKNOWN_MARKER`), rather than a second literal.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `useState<BackendVersion | null>(null)`. Add `const SHORT_COMMIT_LENGTH = 7`. Render `Task Notes` when the state is `null`; `Task Notes v{version}` when `commit` is `null`; otherwise `Task Notes v{version} ({commit.slice(0, SHORT_COMMIT_LENGTH)})`. The `data-testid="app-footer"`, the `<footer>` element (contentinfo landmark), the `isMounted` guard and the swallowed rejection stay as they are. The comment on the state is updated to say it now carries the commit too.
- Routes: none.
- State management: local `useState` in `AppFooter`, one value for the resolved pair, as TEST-08 does for the version.
- Design reference notes: AI freestyle (Design Reference mode NONE). Footer text unchanged from TEST-08: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem. The commit suffix is plain text in the same run of text, same size and color, no separate element, no monospace, no link. Format: `Task Notes v0.1.0 (a1b2c3d)`.

## Backend Plan
No backend changes required.

`GET /api/version` already returns `commit` (TEST-09, `backend/app/schemas/version.py`): the build commit cut to 12 characters, or `"unknown"` when `BUILD_COMMIT` is unset.

## API Integration Plan
No external API integration.

## API Contract
Unchanged on the backend; this feature starts reading the `commit` field the frontend ignored until now.
- Method: GET
- URL: `/api/version` (on `API_BASE_URL`, default `http://localhost:8010`)
- Request: none
- Response: 200 with `{"version": "0.1.0", "commit": "a1b2c3d4e5f6"}`, or `{"version": "0.1.0", "commit": "unknown"}` when the backend was built without `BUILD_COMMIT`
- Frontend client result: `{ version: "0.1.0", commit: "a1b2c3d4e5f6" }`, or `{ version: "0.1.0", commit: null }` for an unusable commit; rejects when the version is unusable or the request fails

## Technology Selection
- Commit shortening: chose the standard `String.prototype.slice(0, 7)` over a formatting helper module or a dependency, because one call covers it.
- Reading the commit: chose to extend the existing `fetchBackendVersion` client (already in the project) over a second client function or a second request, because the commit arrives in the same response.
- E2E control of the commit value: chose Playwright's built-in `page.route` with `route.fulfill` over setting `BUILD_COMMIT` on the E2E stack, because the backend's commit depends on how the stack was built and the spec must assert a known 7-character value deterministically.
- No new component, module or dependency is added.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: Playwright spec serving a known `GET /api/version` body through `page.route` and asserting the 7-character commit next to the version, plus the edge case where the commit is `"unknown"`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-10/uat_script.md: the copy of the manual UAT script that build-feature Section 14 step 3 writes

### Modified files
- [A] frontend/src/api/version.ts: export `BackendVersion`, resolve `{ version, commit }`, map an unusable commit to `null`
- [A] frontend/src/api/version.test.ts: existing cases updated to the object result (`resolves.toEqual`), plus the commit cases named in `### Criterion coverage`
- [A] frontend/src/components/AppFooter.tsx: hold the `{ version, commit }` pair and render the 7-character commit next to the version
- [A] frontend/src/components/AppFooter.test.tsx: mock returns `{ version, commit }`; success-with-commit, no-usable-commit, pending and failure cases
- [A] frontend/src/components/LandingPage.test.tsx: version mock resolves `{ version: "9.8.7", commit: null }` so the existing footer assertion keeps its meaning
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the success test's exact `Task Notes v{backendVersion}` assertion accepts an optional ` ({7 hex characters})` suffix, so it passes whether or not the stack was built with `BUILD_COMMIT`

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the feature changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: Vitest, colocated with the code as the frontend already does. Client tests stub `fetch` (as `version.test.ts` does); component tests mock `../api/version` (as `AppFooter.test.tsx` does), with a never-settling promise for pending and a rejected one for failure.
  - Directory: `frontend/src/api/` and `frontend/src/components/` (colocated `*.test.ts(x)`, the existing frontend convention; CLAUDE.md's `backend/tests/unit/` is the backend's)
  - Naming: `{module}.test.ts`, `{Component}.test.tsx`
- Integration tests: none. No router, service, repository or schema change; `GET /api/version`'s `commit` field stays covered by `backend/tests/integration/test_version_integration.py` (TEST-09).
  - Directory: `backend/tests/integration/`
- E2E tests: one spec. Read the backend version from `backend/pyproject.toml` as the TEST-08 spec does. `page.route("**/api/version", ...)` fulfils `{"version": <that version>, "commit": "a1b2c3d4e5f6"}` with status 200 and `Access-Control-Allow-Origin: *` (the call is cross-origin, port 5183 to 8010), then `page.goto("/")` and assert `app-footer` has text `Task Notes v{version} (a1b2c3d)`. Edge case: fulfil `"commit": "unknown"` and assert the text is exactly `Task Notes v{version}`. The TEST-08 spec's success assertion becomes a regular expression accepting the optional suffix, so the existing browser coverage of the real endpoint stays.
  - Directory: `e2e/tests/`
  - File: `TEST-10_footer_build_commit.spec.ts`
- UAT scenarios: one per criterion plus an edge case (the backend built without a commit shows the version alone).
  - Directory: `e2e/uat/scenarios/`

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit next to the version | E2E | `shows the first 7 characters of the build commit next to the version`, `renders the first 7 characters of the commit next to the version`, `resolves the version and the commit from GET /api/version` | — |
| 2 | While pending or on failure, the footer shows no commit, never `undefined` or an error | Unit | `renders the app name without a version while the version request is pending`, `renders the app name without a version when the version request fails`, `renders the version alone when the backend reports no usable commit`, `resolves a null commit when the backend reports the unknown commit`, `resolves a null commit when the commit is missing or not a string` | Verifying it needs no navigation or interaction: it is the rendered text of one component across a held or rejected promise, which a component test controls exactly; TEST-08's browser spec already covers the aborted request |
| 3 | A component test covers the success, pending and failure paths | Unit | `renders the first 7 characters of the commit next to the version`, `renders the app name without a version while the version request is pending`, `renders the app name without a version when the version request fails` | The criterion is the existence of the component tests themselves; they are the coverage |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Short commit next to the version | Fulfil `GET /api/version` with a 12-character commit via `page.route`, open `/`, assert the footer reads `Task Notes v{version} (a1b2c3d)` | Given the backend reports commit `a1b2c3d4e5f6`, When I open the landing page, Then the footer reads `Task Notes v0.1.0 (a1b2c3d)` |
| 2 | No commit while pending or on failure | covered at Unit, see Criterion coverage; the E2E edge case asserts the version alone for an `unknown` commit | Given the version request fails, When I open the landing page, Then the footer reads `Task Notes` with no `undefined` or error text |
| 3 | Component tests for success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run the footer component tests, Then the success, pending and failure tests pass |

## Manual verification plan
Common prerequisites for every criterion: Docker is running; from the repository root the stack is started with `BUILD_COMMIT=a1b2c3d4e5f6a7b8 docker compose up --build -d`; the frontend is at `http://localhost:5183` and the backend at `http://localhost:8010`; the browser is Chrome with DevTools available.

### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: common prerequisites.
1. Open `http://localhost:8010/api/version` → the body reads `{"version":"0.1.0","commit":"a1b2c3d4e5f6"}`.
2. Open `http://localhost:5183/` and scroll to the bottom → the footer reads exactly `Task Notes v0.1.0 (a1b2c3d)`, in the same small grey text as before.
3. Check the footer text for the 8th to 12th characters of the commit → `4e5f6` does not appear anywhere in the footer.

### Criterion 2: While pending or on failure, the footer shows no commit, never `undefined` or an error
Prerequisites: common prerequisites; DevTools open on the Network tab.
1. Set the Network throttling dropdown to "Slow 3G", reload `http://localhost:5183/` and look at the footer before the `version` request finishes → the footer reads `Task Notes` alone, with no `undefined`, no `v`, no parentheses.
2. Wait for the `version` request to finish → the footer changes to `Task Notes v0.1.0 (a1b2c3d)` without a reload. Set throttling back to "No throttling".
3. Open DevTools Network request blocking (Cmd+Shift+P, "Show Network request blocking"), add and tick the pattern `*/api/version`, and reload the page → the request shows as `(blocked:devtools)` and the footer reads `Task Notes`, with no error text and nothing in parentheses. Untick the pattern.
4. Restart the stack without a commit: `docker compose down` then `docker compose up --build -d` (no `BUILD_COMMIT`), and open `http://localhost:8010/api/version` → `"commit":"unknown"`.
5. Reload `http://localhost:5183/` → the footer reads exactly `Task Notes v0.1.0`, with no `(unknown)` and no empty parentheses.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: the frontend dependencies are installed (`npm --prefix frontend install`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run lists the tests named in `### Criterion coverage` for the success, pending and failure paths, and reports `0 failed`.
