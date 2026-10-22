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
- Comment (tracker): 9 comments read on ClickUp task 123k99cwybm, all PR notices from earlier runs (the dispatch's 6.1 read, recorded in decisions.md) → Addressed by: not acted on because none states a requirement; this is a fresh plan (the earlier run's merge was reverted by #283) against plan base d3fc22261c787cf0d31c25d3d3e1505b4c93ee1c.
- Plan verdict (orchestrator, deliver-20261022T194713Z, the one re-plan): TEST-08's E2E spec `e2e/tests/TEST-08_footer_app_version.spec.ts` line 21 asserts the footer with a full-text `toHaveText(`Task Notes v${backendVersion()}`)`. Once this feature renders the commit, that assertion holds only while the backend has no BUILD_COMMIT (commit `unknown`, so no commit span). No workflow sets BUILD_COMMIT today, so it passes by the commit's absence, and the first environment that sets it breaks TEST-08's spec although TEST-08's promise still holds → Addressed by: `[D] e2e/tests/TEST-08_footer_app_version.spec.ts` added to Modified files. Only its first test changes: it asserts `app-version` has text ` v{version}` and the footer matches `^Task Notes v{version}( \([0-9a-f]{7}\))?$` (version regex-escaped), so it holds with or without a commit while still asserting TEST-08's promise. Its failure test is left untouched. The BUILD_COMMIT dependence is recorded in shared_risks.md. Nothing else in the plan changed.
- Assumption (criterion 2, ambiguity): the version and the commit arrive in ONE response of `GET /api/version` (backend/app/schemas/version.py: `version`, `commit`), so while that request is pending or after it fails there is no version to show either. "The version alone" is therefore read as "the footer exactly as TEST-08 renders it, with no commit part": `Task Notes` while pending or failed, `Task Notes v{version}` when the response carries a version but no usable commit. This keeps TEST-08's tested behaviour unchanged and never renders `undefined`, `null`, `unknown` or an error.
- Assumption (commit sentinel): the backend answers `commit: "unknown"` when BUILD_COMMIT is unset (backend/app/core/config.py `DEFAULT_BUILD_COMMIT`). The client treats it like the existing `unknown` version sentinel, as "no commit", so the footer shows the version alone instead of `(unknown)`. A missing, non-string or empty `commit` is also "no commit" and does NOT reject the request, because a malformed commit must never hide a valid version (criterion 2).
- Assumption (display format): the short commit renders as ` ({first 7 characters})` after the version span, e.g. `Task Notes v0.1.0 (0123456)`, in its own span with `data-testid="app-commit"`. The commit is rendered only when the version is rendered ("next to the version").

## Plan Overview
Frontend only. The existing version API client (`frontend/src/api/version.ts`, one call to `GET /api/version`) is extended to return the commit alongside the version, and `AppFooter` renders the first 7 characters of that commit next to the version span TEST-08 added. No backend change: TEST-09 already returns `commit` (first 12 characters of BUILD_COMMIT, or `unknown`). The footer still makes exactly one request.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `fetchBackendVersion()` changes its resolved type from `string | null` to an exported `BackendVersion` type `{ version: string | null; commit: string | null }`. Version validation is unchanged (non-OK status, network error, non-object body, missing or empty `version` still reject; `version: "unknown"` resolves `version: null`). New: `commit` is a non-empty string other than `unknown`, else `null`; it never causes a rejection. Add a `BACKEND_UNKNOWN_COMMIT = "unknown"` constant with a why-comment pointing at backend/app/core/config.py `DEFAULT_BUILD_COMMIT`.
  - `frontend/src/components/AppFooter.tsx`: hold the resolved `BackendVersion` (or the two fields) in state; render `<span data-testid="app-version"> v{version}</span>` as today, followed, only when both version and commit are non-null, by `<span data-testid="app-commit"> ({commit.slice(0, SHORT_COMMIT_LENGTH)})</span>` with `SHORT_COMMIT_LENGTH = 7`. The silent `.catch` stays. No style change.
- Routes: none.
- State management: local `useState` in `AppFooter`, as today; the single mount-time fetch with the `isMounted` guard is kept.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span inherits the existing footer style (`fontSize 0.875rem`, `color #5f5f5f`, `marginTop 1.5rem` on the footer element) and adds none.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version (existing, TEST-09; unchanged)
- Request: no body
- Response: `{"version": "0.1.0", "commit": "0123456789ab"}`; `commit` is the first 12 characters of BUILD_COMMIT, or `"unknown"` when it is unset. The client returns `{ version: "0.1.0", commit: "0123456789ab" }`, or `commit: null` for `"unknown"`, a missing, a non-string or an empty commit. The footer cuts the commit to 7 characters: `0123456`.

## Technology Selection
- No net-new component, module or dependency: the commit is read by the existing version client (`frontend/src/api/version.ts`) and rendered by the existing `AppFooter`; truncation is `String.prototype.slice`, a standard-library call. Nothing to substitute.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: E2E spec, footer shows `v{version} ({7-char commit})` and the version alone when the commit is `unknown`
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus an edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: return `{ version, commit }`, commit sentinel and shape handling
- [A] frontend/src/api/version.test.ts: client tests for the commit field (present, `unknown`, missing, empty, non-string) and the new resolved shape of existing cases
- [A] frontend/src/components/AppFooter.tsx: render the 7-character commit span next to the version
- [A] frontend/src/components/AppFooter.test.tsx: component tests for success, pending, failure and no-commit paths on the new client shape
- [A] frontend/src/components/LandingPage.test.tsx: update the `fetchBackendVersion` mock value to the new `{ version, commit }` shape so the page test keeps compiling and passing (one mock value plus its footer assertion)
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: change only the first test ("shows the backend version in the footer") so it holds with or without a build commit: assert `app-version` has text ` v{backendVersion()}` and the footer matches `^Task Notes v{escaped version}( \([0-9a-f]{7}\))?$`; the failure test is unchanged

No dependency changes, so no lockfile entry. Neither README.md nor docs/DEVELOPMENT.md needs an edit: no project structure, run configuration, dependency or test-infrastructure change.

## Testing Strategy
- Unit tests: Vitest, colocated with the frontend source as the project already does. `version.test.ts` covers the client's commit handling with `fetch` stubbed; `AppFooter.test.tsx` covers the footer with the client module mocked: success (`{version: "9.9.9", commit: "abcdef123456"}` renders exactly `Task Notes v9.9.9 (abcdef1)`), pending (never-resolving promise renders exactly `Task Notes`, no `app-commit`), failure (rejection renders exactly `Task Notes`), version without commit (`commit: null` renders exactly `Task Notes v9.9.9`, no `app-commit`), and none of them contains `undefined`, `null`, `unknown` or `Error`.
  - Directory: colocated `frontend/src/**` (`*.test.ts(x)`); CLAUDE.md's unit test directory names the backend only
  - Naming: `{Module}.test.tsx` / `{module}.test.ts`, matching the existing files
- Integration tests: not warranted. No repository, model, migration or router code changes (testing_standards.md Section 6); TEST-09's router tests already cover the `commit` field.
  - Directory: backend/tests/integration/ (unchanged)
- E2E tests: the landing page footer with `GET /api/version` fulfilled by `page.route` on the exact pathname `/api/version` (the same pathname matcher TEST-08's spec uses, so the Vite module `src/api/version.ts` is never intercepted), giving deterministic data: body `{"version": "9.9.9", "commit": "abcdef123456"}` expects footer text `Task Notes v9.9.9 (abcdef1)`; edge case body `{"version": "9.9.9", "commit": "unknown"}` expects `Task Notes v9.9.9` and `app-commit` count 0.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the `unknown` commit edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version | E2E | — |
| 2 | While pending or failed, the footer shows the version alone, never `undefined` or an error | Unit | the pending state cannot be held in a browser without a hardcoded wait, and the failure and no-commit renders are pure component output; the component test with a never-resolving and a rejecting client mock asserts the exact footer text (the E2E edge-case spec additionally covers the `unknown` commit) |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is the existence of a component test, so the component test itself is its coverage |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-char commit next to the version | Fulfil `/api/version` with `{"version":"9.9.9","commit":"abcdef123456"}`, open `/`, expect `app-footer` text `Task Notes v9.9.9 (abcdef1)` and `app-commit` text ` (abcdef1)` | Given the backend reports commit `0123456789ab`, When I open the landing page, Then the footer reads `Task Notes v0.1.0 (0123456)` |
| 2 | Version alone while pending or failed | covered at Unit, see Criterion coverage; E2E edge case fulfils `commit: "unknown"` and expects `Task Notes v9.9.9` | Given the backend has no build commit, When I open the landing page, Then the footer reads `Task Notes v0.1.0` and never `undefined` or `unknown` |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run AppFooter.test.tsx, Then it reports 0 failed and lists success, pending and failure tests |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version
Prerequisites: Docker running, repository on the feature branch, `.env` copied from `.env.example` at the repository root, ports 5183 and 8010 free.
1. Add the line `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567` to `.env` at the repository root, then run `docker compose up -d --build` → the `db`, `backend` and `frontend` services start.
2. Open `http://localhost:8010/api/version` → the page shows `{"version":"0.1.0","commit":"0123456789ab"}` (the version is whatever `backend/pyproject.toml` `[project].version` reads).
3. Open `http://localhost:5183/` and read the footer at the bottom of the page → it reads `Task Notes v0.1.0 (0123456)`: the version, then exactly the first 7 characters of the commit in parentheses.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error
Prerequisites: the stack from Criterion 1 running.
1. Remove the `BUILD_COMMIT` line from `.env`, run `docker compose up -d --build backend`, then open `http://localhost:8010/api/version` → it shows `{"version":"0.1.0","commit":"unknown"}`.
2. Reload `http://localhost:5183/` and read the footer → it reads exactly `Task Notes v0.1.0`, with no `(unknown)`, no `()` and no `undefined`.
3. In Chrome DevTools, Network tab, set throttling to `Slow 3G` and reload `http://localhost:5183/` while watching the footer → while the `version` request is pending the footer reads exactly `Task Notes`; once it completes it reads `Task Notes v0.1.0`.
4. Run `docker compose stop backend`, then reload `http://localhost:5183/` → the footer reads exactly `Task Notes`, with no `undefined`, `null`, `unknown` or error text. Run `docker compose start backend` afterwards.

### Criterion 3: A component test covers the success, pending and failure paths
Prerequisites: frontend dependencies installed (`npm --prefix frontend install`).
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx` → the run reports `0 failed`, and its test list includes a success test expecting `Task Notes v9.9.9 (abcdef1)`, a pending (still loading) test, a failure (rejected request) test and a version-without-commit test.
