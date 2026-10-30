# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, **wave 2**). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> **What.** The landing page footer shows the short build commit next to the version.
>
> **Acceptance criteria (as written on the ticket)**
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> **Notes.** Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.
>
> (ClickUp task 123k99cwybm, https://app.clickup.com/t/123k99cwybm.)

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 16 comments read, all framework PR notices from earlier runs; none is actionable for this item. → Addressed by: not acted on because none carries a requirement or correction.
- Assumption (criterion 2, "pending"): the version and the commit arrive in the same `GET /api/version` response (TEST-09's shape), so while that request is pending there is no version to show either. "The version alone" is read as "no commit segment, and whatever TEST-08 already shows": while pending the footer keeps TEST-08's render, `Task Notes` with no version and no commit. A second request just to show the version earlier would be gold plating.
- Assumption (criterion 2, "fails"): two failure kinds are distinguished. (a) The request fails outright (network error, 5 s timeout, non-2xx, no usable `version`): TEST-08's client already rejects, and the footer shows `Task Notes` alone, unchanged from TEST-08. (b) The request succeeds with a usable `version` but `commit` is missing, not a string, or blank: the footer shows the version alone, `Task Notes v0.1.0`, with no commit segment. Case (b) is the literal "version alone" path of the criterion.
- Assumption (backend `unknown` sentinel): TEST-09's backend answers `"commit": "unknown"` when `BUILD_COMMIT` is unset, which is the default for a `docker compose` build (docs/DEVELOPMENT.md, `backend/app/core/config.py`). The footer shows that value verbatim (`Task Notes v0.1.0 (unknown)`), the same decision TEST-08 recorded for the version sentinel: it is the backend's own answer about itself, and the frontend does not hardcode the backend's sentinel string. A reviewer who wants it hidden should say so on the plan; it is a one-line change.
- Assumption (display format): "next to the version" is rendered as the 7 characters in parentheses after the version, `Task Notes v0.1.0 (abc1234)`. A commit shorter than 7 characters is shown whole.

## Plan Overview
Extend TEST-08's footer to show the short build commit TEST-09 added to `GET /api/version`. The client `frontend/src/api/version.ts` stops returning only the version string and returns `{ version, commit }`, with `commit` set to `null` when the response carries no usable commit (the version rules are unchanged, so a bad version still rejects). `AppFooter` renders the first 7 characters of the commit in a `data-testid="app-commit"` span after the version, only when both are present. Tests: Vitest for the client (commit present, missing, non-string, blank) and the component (success, pending, failure, version-without-commit); LandingPage's test mock updated to the new return shape; one new Playwright spec plus a one-line loosening of TEST-08's exact footer assertion; the footer paragraph in docs/DEVELOPMENT.md rewritten. No backend change, no new dependency.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): `VersionResponse` becomes `{ version: string; commit?: string }`; add `export type BackendVersion = { version: string; commit: string | null }`. `getBackendVersion(): Promise<BackendVersion>`. Fetch, timeout (`AbortSignal.timeout(VERSION_TIMEOUT_MS)`), non-2xx handling and the `version` validation stay exactly as they are (same error messages). After the version check, read `commit` from the same parsed body: a non-empty string after trim is returned verbatim, anything else (missing, non-string, blank) yields `commit: null` and does not reject. Update the module's doc comment to say a missing commit is `null`, not a rejection.
  - `frontend/src/components/AppFooter.tsx` (modify): state becomes `useState<BackendVersion | null>(null)`; the `useEffect`, `isMounted` guard and the `catch` that leaves it `null` are unchanged. Add `const COMMIT_DISPLAY_LENGTH = 7;`. Render: `Task Notes`, then when the state is non-null ` <span data-testid="app-version">v{version}</span>`, then when `commit !== null` ` (<span data-testid="app-commit">{commit.slice(0, COMMIT_DISPLAY_LENGTH)}</span>)`. Text content per state: pending or rejected `Task Notes`; version without commit `Task Notes v0.1.0`; both `Task Notes v0.1.0 (abc1234)`. No trailing space in any state. `footerStyle` unchanged.
- Routes: none.
- State management: local component state in `AppFooter`, as TEST-08 left it.
- Design reference notes: AI freestyle (Design Reference mode NONE). Keep TEST-08's footer values unchanged: font-size 0.875rem, color #5f5f5f, margin-top 1.5rem; the commit span inherits them, no styling of its own.

## Backend Plan
No backend changes required.

`GET /api/version` already returns `commit` (TEST-09, merged at 893c492): `backend/app/schemas/version.py` declares `commit: str`, `backend/app/services/version_service.py` `get_build_commit()` returns `BUILD_COMMIT` truncated to the backend's own `COMMIT_LENGTH`, and `"unknown"` when the variable is unset or blank. This item only consumes it.

## API Integration Plan
No external API integration. (The project's own backend is consumed through the existing client module `frontend/src/api/version.ts`.)

## API Contract
- Method: GET
- URL: `{VITE_API_BASE_URL or http://localhost:8010}/api/version`
- Request: no body, no parameters.
- Response: 200 `{"version": "0.1.0", "commit": "abc1234def56"}`. `commit` is shown as its first 7 characters (`abc1234`); `"unknown"` is shown verbatim. A 200 body with a usable `version` and a missing, non-string or blank `commit` resolves `{ version, commit: null }` and the footer shows the version alone. Non-2xx, network error, the 5000 ms timeout, or a body without a non-empty string `version` reject as before, and the footer shows `Task Notes` alone.

## Technology Selection
- Short-commit display in `AppFooter.tsx`: chose the standard `String.prototype.slice(0, 7)` over any formatting helper or dependency; nothing to build.
- Commit validation in `frontend/src/api/version.ts`: chose the existing `typeof` plus `trim()` checks already used for `version` over adding a schema library (none installed), because it is one optional string field.
- No net-new component, module or dependency is introduced: every file is an existing one modified, or a test or UAT artifact.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: E2E spec, footer shows the backend version and the first 7 characters of the commit the live backend served, plus the version-without-commit edge case
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: the artifact copy of the manual UAT script build-feature writes

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }`, commit `null` when missing, non-string or blank
- [A] frontend/src/api/version.test.ts: replace the "ignores additional fields" case with commit present, missing, non-string and blank cases; existing version cases assert `.version` on the resolved object
- [A] frontend/src/components/AppFooter.tsx: render the 7-character commit in an `app-commit` span after the version
- [A] frontend/src/components/AppFooter.test.tsx: mock resolves `{ version, commit }`; success, pending, failure and version-without-commit paths
- [A] frontend/src/components/LandingPage.test.tsx: version mock resolves `{ version: MOCKED_BACKEND_VERSION, commit: null }` instead of a string
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: the exact `toHaveText("Task Notes v{version}")` footer assertion becomes `toContainText`, since the footer now also carries the commit; the `app-version` assertion stays exact
- [Docs] docs/DEVELOPMENT.md: the footer paragraph says the footer shows the version and the first 7 characters of `commit`, the pending, failure and missing-commit renders, and that a compose build shows `(unknown)`

No dependency changes, so no lockfile is regenerated. README.md needs no edit: no project structure, run configuration or dependency changes.

## Testing Strategy
- Unit tests: frontend only (no backend logic changes).
  - `frontend/src/api/version.test.ts`, stubbing global `fetch` as today: `{ version: "0.1.0", commit: "abc1234def56" }` resolves `{ version: "0.1.0", commit: "abc1234def56" }` (the client does not truncate); missing commit, `commit: 1`, `commit: ""` and `commit: "   "` each resolve with `commit: null`; all existing rejection cases (non-OK, bad version, null and non-object bodies, network error), the abort signal and the `VITE_API_BASE_URL` case keep passing, adjusted to the object return.
  - `frontend/src/components/AppFooter.test.tsx`, mocking `../api/version`: success (`{ version: "9.9.9", commit: "abcdef1234567" }` renders `app-commit` with text exactly `abcdef1` and footer text exactly `Task Notes v9.9.9 (abcdef1)`); short commit (`"abc"` shown whole); version without commit (`commit: null` gives `Task Notes v9.9.9`, no `app-commit`); pending (never-resolving promise, `Task Notes`, no `app-version`, no `app-commit`); failure (rejection, `Task Notes`, none of `undefined`, `null`, `Error`, `(`); landmark and single-call tests kept.
  - `frontend/src/components/LandingPage.test.tsx`: mock shape updated; its footer assertion keeps passing.
  - Directory: co-located `*.test.ts(x)` under `frontend/src/` (the project's existing Vitest convention; CLAUDE.md's unit directory is the backend's)
  - Naming: `{Module}.test.ts(x)`, matching the existing frontend tests
- Integration tests: none added. The endpoint is unchanged and its `commit` field is already covered by TEST-09's `backend/tests/integration/test_version_integration.py`; no router or repository code changes.
  - Directory: backend/tests/integration/
- E2E tests: `TEST-10_footer_build_commit.spec.ts`. Main spec: register `page.waitForResponse` for `**/api/version` before `goto("/")`, read `version` and `commit` from that real response, then assert `app-commit` has text exactly `commit.slice(0, 7)` and the footer has text exactly `Task Notes v{version} ({short commit})`; reading the served value keeps the spec deterministic whether the stack was built with a real `BUILD_COMMIT` or the compose default `unknown`. Edge-case spec: `page.route("**/api/version", ...)` fulfils 200 with body `{"version":"9.9.9"}` (no commit), then the footer has text exactly `Task Notes v9.9.9` and `app-commit` has count 0. TEST-08's spec gets the one assertion loosened (above); its aborted-request spec additionally asserts `app-commit` has count 0.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the version-without-commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from GET /api/version, next to the version | E2E | — |
| 2 | While pending or on failure, the footer shows the version alone, never undefined or an error | Unit | verifying it needs no navigation or interaction: pending, rejection and a commit-less response are injected at the client mock in milliseconds; the commit-less E2E edge-case spec and TEST-08's aborted-request spec sit on top |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-character commit next to the version | goto `/`, read the real /api/version response, footer reads `Task Notes v{version} ({commit[0..7]})` | Given the backend was built with BUILD_COMMIT abc1234def5678, When I open the landing page, Then the footer reads "Task Notes v0.1.0 (abc1234)" |
| 2 | Pending or failed: version alone | covered at Unit, see Criterion coverage; edge-case E2E fulfils a commit-less body | Given the backend answers without a commit, When I open the landing page, Then the footer reads "Task Notes v0.1.0" with no parentheses |
| 3 | Component test covers success, pending, failure | covered at Unit | Given the frontend test suite, When AppFooter.test.tsx runs, Then 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit next to the version
Prerequisites: from the repository root, build the backend with a known commit: `docker compose build --build-arg BUILD_COMMIT=abc1234def5678 backend`, then `docker compose up -d`. `curl -s http://localhost:8010/api/version` prints `{"version":"0.1.0","commit":"abc1234def56"}` (version as in `backend/pyproject.toml`).
1. Open `http://localhost:5183/` in a browser → the landing page shows the "Task Notes" heading, the note form and the footer at the bottom.
2. Read the footer → it reads `Task Notes v0.1.0 (abc1234)`: the version, then exactly the first 7 characters of the commit the curl printed.
3. Rebuild without the argument: `docker compose build backend` then `docker compose up -d backend`, wait until the curl prints `"commit":"unknown"`, and reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0 (unknown)`.

### Criterion 2: While pending or on failure, the footer shows the version alone
Prerequisites: as Criterion 1, backend built with `BUILD_COMMIT=abc1234def5678`.
1. In DevTools, Network tab, set throttling to "Slow 3G" and reload `http://localhost:5183/` → while the `/api/version` request is pending the footer reads exactly `Task Notes`: no commit, no parentheses, no "undefined". Once it completes it reads `Task Notes v0.1.0 (abc1234)`. Set throttling back to "No throttling".
2. Run `docker compose stop backend`, reload `http://localhost:5183/` → the `/api/version` request fails in the Network tab and the footer reads exactly `Task Notes`: no "undefined", "null", "Error" or empty parentheses.
3. Run `docker compose start backend`, wait until the curl answers, reload → the footer reads `Task Notes v0.1.0 (abc1234)` again.
4. A commit-less 200 answer cannot be produced from the running backend through the UI; it is verified by the E2E edge-case spec. Run `npx playwright test e2e/tests/TEST-10_footer_build_commit.spec.ts` from the repository root with the stack up → `0 failed`, including the spec "shows the version alone when the response carries no commit".

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend ci`).
1. Run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → Vitest reports `0 failed`, and the AppFooter output lists a success test, a pending test, a failure test and a version-without-commit test.
