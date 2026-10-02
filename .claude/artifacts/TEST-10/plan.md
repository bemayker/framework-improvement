# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> Footer shows the build commit. Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates. Depends on TEST-08 (footer app version) and TEST-09 (version endpoint reports the build commit), both merged.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback (if applicable)
No tracker comments on the item (0 read) and no PR review comments; fresh plan branched from current main (6ba616d, which already carries TEST-08 #68 and TEST-09 #69), so there is no merged-since overlap. The interpretations below are recorded here in place of a question, because this is an unattended `/deliver` run with no human to ask (`user_story_alignment.md` Section 4).

- Assumption A1 (how AC2 maps onto one request): on main the version and the commit arrive in the SAME response of `GET /api/version`, so while that request is pending, or when it fails, there is no version to show either. The plan keeps one request (Architecture note: keep every feature as small as possible) and reads AC2 as "the commit is never required for the footer to render, and its absence never leaks into the text": (a) request pending or failed: the footer shows exactly what TEST-08 ships for that case, `Task Notes`, with no `v`, no commit, no `undefined`/`null`/`unknown`/error text; (b) request succeeded with a usable version but no usable commit: the footer shows the version alone, `Task Notes v0.1.0`. Case (b) is the literal "version alone" reading the single-request design can produce. A second request, or caching the version elsewhere, was rejected as scope growth AC2 does not ask for.
- Assumption A2 (what counts as an unusable commit): the commit is treated as absent when the field is missing, not a string, an empty string, or the backend's own sentinel `"unknown"` (TEST-09 `DEFAULT_BUILD_COMMIT`, returned when `BUILD_COMMIT` is unset). An absent commit never rejects the request: the version still renders. This mirrors how TEST-08 treats the `"unknown"` version sentinel, without making the commit fatal.
- Assumption A3 (display format): the short commit renders after the version in parentheses, `Task Notes v0.1.0 (abc1234)`, the 7 characters wrapped in `<span data-testid="app-commit">`. A commit shorter than 7 characters is shown whole (`String.prototype.slice` semantics). No hex validation: the criterion asks for the first 7 characters, nothing more.
- Assumption A4 (version failure stays fatal): the existing TEST-08 behaviour is unchanged: a missing/empty/`"unknown"` version, a non-OK status, a malformed body or a network error still rejects, and the footer shows `Task Notes`.

## Plan Overview
Frontend only. Extend the existing single-request client `fetchBackendVersion` in `frontend/src/api/version.ts` to resolve `{ version, commit }` instead of a bare string, with `commit` normalised to `null` when unusable (A2). Extend `AppFooter` to hold that object in state and render ` (abc1234)` beside the version when `commit` is non-null. Update the client unit tests and the component tests, add one E2E spec, and the UAT artifacts. No backend, no new dependency, no new module.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `VersionInfo` becomes `{ version: string; commit: string | null }`; `fetchBackendVersion(): Promise<VersionInfo>`. Version validation unchanged (A4). Add `UNRESOLVED_BACKEND_COMMIT = "unknown"` and a small private normaliser returning the commit string, or `null` when it is missing, non-string, empty or the sentinel (A2). The header comment saying only `version` is read is updated. Still exactly one `fetch` call.
  - `frontend/src/components/AppFooter.tsx`: state becomes `VersionInfo | null`; `null` still means pending or failed, rendering `Task Notes` alone. On success render `Task Notes v<span data-testid="app-version">{version}</span>` and, only when `commit !== null`, ` (<span data-testid="app-commit">{commit.slice(0, 7)}</span>)`. A named constant `SHORT_COMMIT_LENGTH = 7` carries the criterion's number. Existing `data-testid="app-footer"`, `data-testid="app-version"`, the `<footer>` landmark and `footerStyle` are unchanged.
- Routes: none (footer is already rendered by `LandingPage` at `/`).
- State management: local `useState` in `AppFooter`, as today; the unmount guard stays.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit inherits the footer's existing inline style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem`); no new style values.

## Backend Plan
No backend changes required. `GET /api/version` already returns `commit` (TEST-09).

## API Integration Plan
No external API integration.

## API Contract
Consumed, unchanged (TEST-05 / TEST-09):
- Method: GET
- URL: `/api/version` (base `VITE_API_BASE_URL`, default `http://localhost:8010`, via `frontend/src/api/apiBaseUrl.ts`)
- Request: none
- Response 200: `{"version": "0.1.0", "commit": "abcdef1234567890"}`; with `BUILD_COMMIT` unset: `{"version": "0.1.0", "commit": "unknown"}`
- Client result (`VersionInfo`): `{"version": "0.1.0", "commit": "abcdef1234567890"}`, or `{"version": "0.1.0", "commit": null}` for a missing/empty/non-string/`"unknown"` commit; rejection for every TEST-08 version failure.

## Technology Selection
- Short commit (first 7 characters): chose the standard library `String.prototype.slice(0, 7)` over any helper module or dependency; it covers the need completely.
- Commit normalisation: no stdlib call, native platform feature or installed dependency covers "treat the backend's `unknown` sentinel as absent", so it is a few lines inside the existing `version.ts` client, not a new module.
- No net-new component, module or dependency is introduced: the existing `fetchBackendVersion` client and `AppFooter` component are extended, and the existing Vitest + Testing Library and Playwright installs cover every test.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec for AC1 (route-fulfilled response with a 16-character commit shows its first 7 characters beside the version) plus the edge case (commit `"unknown"` shows the version alone)
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus the unknown-commit edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from `## Manual verification plan`
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: `VersionInfo` gains `commit: string | null`; `fetchBackendVersion` resolves `VersionInfo`, normalising an unusable commit to `null`
- [A] frontend/src/api/version.test.ts: assertions move from the bare string to `{ version, commit }`; new cases for commit present, missing, empty, non-string and `"unknown"` (all resolve with `commit: null` except present); version-failure cases unchanged
- [A] frontend/src/components/AppFooter.tsx: hold `VersionInfo | null`; render ` (abc1234)` in `data-testid="app-commit"` when a commit is present
- [A] frontend/src/components/AppFooter.test.tsx: mock resolves `VersionInfo`; success path asserts `Task Notes v9.9.9-test (abcdef1)` from commit `abcdef1234567890`; pending and failure paths assert `Task Notes` with no `app-commit`/`app-version` and no `undefined|null|unknown|error`; version-alone path (`commit: null`) asserts `Task Notes v9.9.9-test`

No dependency change, so no lockfile entry. No project structure, run configuration, dependency or test-infrastructure change, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. `e2e/tests/TEST-08_footer_app_version.spec.ts` is deliberately not modified: its `toContainText("Task Notes v{version}")` and its abort-path `toHaveText("Task Notes")` assertions both still hold with the commit appended.

## Testing Strategy
- Unit tests (Vitest + Testing Library, `npm --prefix frontend test`): client normalisation in `frontend/src/api/version.test.ts`; footer success, pending, failure and version-alone rendering in `frontend/src/components/AppFooter.test.tsx`, mocking `../api/version` as the existing tests do.
  - Directory: beside the module under `frontend/src/` (the project's established frontend convention; `backend/tests/unit/` is the backend's)
  - Naming: `{Module}.test.ts(x)`, as existing
- Integration tests: not warranted. Integration Tests is ENABLED, but this feature adds or modifies no repository, model, migration or endpoint (`testing_standards.md` Section 6); the endpoint's `commit` field is already integration-tested by TEST-09.
- E2E tests: AC1 only, per the table below, with the edge-case spec (commit `"unknown"`) Section 4 requires.
  - Directory: `e2e/tests/`
  - File: `e2e/tests/TEST-10_footer_build_commit.spec.ts`
  - Approach: `page.route("**/api/version", ...)` fulfils `{"version": "0.1.0", "commit": "abcdef1234567890"}` so the assertion is deterministic whatever `BUILD_COMMIT` the stack was built with (`testing_standards.md` Section 1.3 deterministic data); locate by `data-testid="app-commit"` / `app-footer`; no fixed waits.
- UAT scenarios: `e2e/uat/scenarios/TEST-10_footer_build_commit.feature`, one scenario per criterion plus the unknown-commit edge case; manual script in `e2e/uat/scripts/`.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While pending or on failure, the footer shows the version alone, never `undefined` or an error | Unit | verifying it needs no navigation or interaction: pending and failure are client states a component test produces directly by mocking `fetchBackendVersion`; the browser-level failure path is already covered by TEST-08's abort spec, which this plan leaves passing |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component-test requirement, satisfied by `AppFooter.test.tsx` |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows first 7 commit characters next to the version | Fulfil `/api/version` with commit `abcdef1234567890`; `goto("/")`; expect `app-commit` text `abcdef1` and `app-footer` text `Task Notes v0.1.0 (abcdef1)`. Edge: commit `"unknown"` gives `Task Notes v0.1.0` and `app-commit` count 0 | Given the backend reports commit abcdef1234567890 When I open the landing page Then the footer reads Task Notes v0.1.0 (abcdef1) |
| 2 | Pending or failed request never shows `undefined` or an error | covered at Unit, see Criterion coverage | Given the version request is blocked When I open the landing page Then the footer reads Task Notes with no undefined or error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite When it runs Then AppFooter success, pending and failure tests pass |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: Docker running; from the repository root, start the stack with the commit set: `BUILD_COMMIT=abcdef1234567890 docker compose up --build`; wait for Vite on port 5183.
1. Open `http://localhost:8010/api/version` → the JSON reads `{"version": "0.1.0", "commit": "abcdef1234567890"}`.
2. Open `http://localhost:5183` → the Task Notes landing page loads.
3. Scroll to the footer → it reads `Task Notes v0.1.0 (abcdef1)`: exactly 7 commit characters, after the version.
4. In DevTools Elements, inspect the footer → `<span data-testid="app-version">0.1.0</span>` followed by `<span data-testid="app-commit">abcdef1</span>`.
5. In DevTools Network, reload → exactly one `GET /api/version` request was made.

### Criterion 2: Pending or failed request shows no commit, no `undefined`, no error
Prerequisites: the stack from Criterion 1 is running; the landing page is open at `http://localhost:5183`.
1. In DevTools Network, set throttling to a custom profile with 10000 ms latency and reload → while the request is pending the footer reads `Task Notes`, with no `v`, no parentheses, no `undefined`.
2. Wait for the request to complete → the footer changes to `Task Notes v0.1.0 (abcdef1)`.
3. Remove throttling; in DevTools Network, block the request URL `http://localhost:8010/api/version` and reload → the footer reads `Task Notes` and stays so; no `undefined`, `null`, `unknown` or error text appears anywhere in the footer.
4. Unblock the URL. Stop the stack and restart it without the commit: `docker compose up --build` (no `BUILD_COMMIT`) → `http://localhost:8010/api/version` returns `"commit": "unknown"`.
5. Open `http://localhost:5183` → the footer reads `Task Notes v0.1.0` (the version alone): no parentheses and no `unknown`.

### Criterion 3: A component test covers the success, pending and failure paths
This criterion is verified in the test suite rather than in the UI.
1. From the repository root run `npm --prefix frontend test` → Vitest reports all tests passed.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a success test asserting `Task Notes v9.9.9-test (abcdef1)`, a pending test (never-settling promise) and a failure test (rejected promise), each asserting the footer text.
