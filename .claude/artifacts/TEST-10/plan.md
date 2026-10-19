# Implementation Plan, TEST-10: Footer shows the build commit

## Feature
> A small frontend feature staged 2026-10-02 for sitting 2 of the 0.3.250 release run (Arm E, wave 2). It needs TEST-08's footer and TEST-09's endpoint, so it cannot start until both are done: this is the item that makes the run cross a wave boundary.
>
> ### What
> The landing page footer shows the short build commit next to the version.
>
> ### Acceptance criteria
> 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
> 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
> 3. A component test covers the success, pending and failure paths.
>
> ### Notes
> Frontend only, under `frontend/src/`. Modifies the footer TEST-08 creates.
>
> Depends on: TEST-08, TEST-09.

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): 6 comments on the item, all mayker-dev PR notices from earlier runs, none carrying stakeholder direction. → Addressed by: not acted on as direction (they are notices, not corrections of the description); the interpretation of criterion 2 they recorded is reused below because it still fits the code on main.
- Assumption (criterion 2, recorded instead of a blocking question): version and commit come from ONE `GET /api/version` request (TEST-09 returns both fields), so there is no state in which the version is known while the commit request is still pending. Therefore: while that request is pending, or when it fails outright (network error, non-2xx, malformed body, version missing, blank or `unknown`), the footer reads exactly `Task Notes`, unchanged from TEST-08. When the request succeeds with a usable version but the commit is missing, not a string, blank or the backend `unknown` sentinel, the footer shows the version alone (`Task Notes v0.1.0`). Never `undefined`, `null`, `unknown` or an error text.
- Assumption (criterion 1): the commit is shown only next to a resolved version. If the version is unresolved, the footer falls back to `Task Notes` per TEST-08 and the commit is not shown on its own.
- Assumption (criterion 1, rendering): the short commit renders as ` (abc1234)` in its own span (`data-testid="app-footer-commit"`) directly after the version span, so the footer reads `Task Notes v0.1.0 (abc1234)`. The backend already shortens to 12 characters; the frontend takes the first 7 of what it receives.
- Merged since the last plan: n/a (fresh plan, branched from current main 81b98e5, which already contains TEST-08 and TEST-09).

## Plan Overview
Frontend only. Extend the existing version API client (`frontend/src/api/version.ts`) so its single `GET /api/version` request returns both the version and the short commit, and extend `AppFooter.tsx` to render the commit next to the version. No new request, no new module, no backend change. TEST-08's loading and failure behaviour is preserved exactly.

Design: `fetchAppVersion()` changes its resolved type from `string | null` to `AppVersionInfo | null`, where `AppVersionInfo` has `version: string` and `commit: string | null`. It still resolves `null` when the version is unusable (TEST-08 semantics) and still rejects on a network failure. `commit` is the trimmed commit cut to its first 7 characters, or `null` when it is missing, not a string, blank or `unknown`. One private normaliser handles the trim, blank and sentinel check for both fields. The two callers that mock `fetchAppVersion` (AppFooter.test.tsx and LandingPage.test.tsx) are updated to the new resolved shape.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts` (modify): export `type AppVersionInfo` with `version: string` and `commit: string | null`; export `SHORT_COMMIT_LENGTH = 7` and `UNKNOWN_COMMIT = "unknown"` (mirrors `backend/app/core/config.py` DEFAULT_BUILD_COMMIT, with a comment saying so, as UNKNOWN_VERSION already does for the version). Add one private helper that takes an unknown value and returns the trimmed string or null (non-string, blank, or equal to the given sentinel). `fetchAppVersion()` now resolves `AppVersionInfo | null`: null when the response is not 2xx, the body is not JSON, or the version is unusable; otherwise the version plus the commit cut to its first 7 characters (null when unusable). A network failure still rejects. Same single fetch of `API_BASE_URL + /api/version`.
  - `frontend/src/components/AppFooter.tsx` (modify): hold `AppVersionInfo | null` in state instead of `string | null`. Render `Task Notes`, then the existing version span (`app-footer-version`, text ` v` + version) when info is non-null, then a new commit span (`data-testid="app-footer-commit"`, text ` (` + commit + `)`) only when info is non-null AND commit is non-null. Pending and failure keep state null, so the footer reads exactly `Task Notes` as in TEST-08. Update the leading comment to describe the commit rule.
- Routes: none (footer is already on the landing page `/`).
- State management: local `useState` in AppFooter, unchanged pattern (the `isMounted` guard stays).
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span inherits the existing footer style (0.875rem, #5f5f5f); no new style values.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: `/api/version` (existing, delivered by TEST-09; consumed, not changed)
- Request: no body, no parameters
- Response: 200 with a JSON object carrying `version` (string; backend sentinel `unknown` when package metadata is missing) and `commit` (string; BUILD_COMMIT cut to 12 characters by the backend, sentinel `unknown` when unset). Example:
```json
{"version": "0.1.0", "commit": "abc1234def56"}
```
Frontend client result for that example: version 0.1.0, commit abc1234. Footer text: Task Notes v0.1.0 (abc1234).

## Technology Selection
- Commit display in the footer: no net-new component, module or dependency. Chose to extend the existing `fetchAppVersion` client and `AppFooter` component over a second client function or a second request, because the one existing request already returns the commit (TEST-09) and a separate fetch would duplicate it.
- Commit shortening (first 7 characters): chose the standard `String.prototype.slice` over any formatting dependency; trim and sentinel checks likewise use built-in string methods.
- Tests: Vitest plus Testing Library (already installed and used by AppFooter.test.tsx) and Playwright `page.route` (already installed, used by TEST-08) over any new test dependency.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: browser spec on `/` with `/api/version` fulfilled by `page.route` (version 0.1.0, commit abc1234def56) asserting the footer reads `Task Notes v0.1.0 (abc1234)`, plus the edge case where the commit is `unknown` and the footer shows the version alone
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per acceptance criterion plus an edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from this plan's Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: add `AppVersionInfo`, `SHORT_COMMIT_LENGTH`, `UNKNOWN_COMMIT` and the private normaliser; `fetchAppVersion` resolves version plus short commit from the same single request
- [A] frontend/src/api/version.test.ts: update existing assertions to the new resolved shape; add cases for commit cut to 7 characters, commit missing, non-string, blank and `unknown` (version still returned, commit null)
- [A] frontend/src/components/AppFooter.tsx: render the `app-footer-commit` span next to the version when the commit is present; pending and failure unchanged
- [A] frontend/src/components/AppFooter.test.tsx: success path with commit (footer text exactly `Task Notes v0.1.0 (abc1234)`), success with commit null (version alone, no commit span), pending (exactly `Task Notes`), failure by rejection and by null (exactly `Task Notes`), and no `undefined`, `null` or `unknown` text in any path
- [A] frontend/src/components/LandingPage.test.tsx: update the `fetchAppVersion` mock to resolve the new object shape (version plus commit null), so the existing footer assertion keeps passing

No dependency change, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: Vitest component and client tests (frontend). `version.test.ts` covers the client normalisation (commit cut to 7, missing, non-string, blank and `unknown` commit giving null, version failures still giving null, network failure still rejecting, still exactly one fetch). `AppFooter.test.tsx` covers the success, pending and failure paths of the footer (criterion 3).
  - Directory: co-located under frontend/src/ next to the module, matching the existing `*.test.ts(x)` files (the CLAUDE.md unit directory backend/tests/unit/ is the backend one)
  - Naming: `{module}.test.ts` / `{Component}.test.tsx`, as already used in frontend/src/
- Integration tests: not warranted. No repository, model, migration or endpoint changes (testing_standards.md Section 6); `GET /api/version` is unchanged and already covered by TEST-09.
  - Directory: backend/tests/integration/ (unused by this item)
- E2E tests: one spec for criterion 1 on the landing page, with `/api/version` fulfilled through `page.route` so the commit is deterministic (the dev stack defaults BUILD_COMMIT to `unknown`); the fulfilled response carries an `access-control-allow-origin: *` header because the API is on another origin than the page. Edge-case spec: commit `unknown` gives `Task Notes v0.1.0` with no commit span.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus the commit-unknown edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit from GET /api/version, next to the version | E2E (plus Unit in AppFooter.test.tsx and version.test.ts) | — |
| 2 | While the request is pending or when it fails, the footer shows the version alone, never undefined or an error | Unit | verifying it needs no navigation or interaction: it is component render state for pending, rejected and partial responses, which a component test controls exactly while a browser cannot hold a request pending deterministically; TEST-08 E2E already covers the unreachable-endpoint footer |
| 3 | A component test covers the success, pending and failure paths | Unit | the criterion is itself a component test; it is satisfied by AppFooter.test.tsx existing and passing, which no browser test can show |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Footer shows the 7-char commit next to the version | Fulfil /api/version with version 0.1.0 and commit abc1234def56, open `/`, expect `app-footer` text `Task Notes v0.1.0 (abc1234)` and `app-footer-commit` text ` (abc1234)` | Given the backend reports commit abc1234def56, When I open the landing page, Then the footer reads Task Notes v0.1.0 (abc1234) |
| 2 | Pending or failed shows version alone, never undefined or an error | covered at Unit, see Criterion coverage (edge E2E: commit unknown gives `Task Notes v0.1.0`, no commit span) | Given the backend reports commit unknown, When I open the landing page, Then the footer reads Task Notes v0.1.0 and shows no commit |
| 3 | Component test covers success, pending and failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When AppFooter.test.tsx runs, Then it reports 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from GET /api/version, next to the version
Prerequisites: stack started from the repo root with a known commit: `BUILD_COMMIT=abc1234def5678 docker compose up -d --build` (backend on http://localhost:8010, frontend on http://localhost:5183). No sign-in, no seed data.
1. Open http://localhost:8010/api/version in the browser → the JSON shows version `0.1.0` and commit `abc1234def56` (12 characters, cut by the backend).
2. Open http://localhost:5183/ → the landing page loads and the footer at the bottom reads exactly `Task Notes v0.1.0 (abc1234)`.
3. Inspect the footer element in DevTools → a span with `data-testid="app-footer-commit"` holds ` (abc1234)`, directly after the `app-footer-version` span holding ` v0.1.0`; the commit shows 7 characters, not 12.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error
Prerequisites: same stack as Criterion 1.
1. Restart only the backend without a commit: `docker compose up -d --force-recreate backend` with BUILD_COMMIT unset (it defaults to `unknown`), then reload http://localhost:5183/ → the footer reads exactly `Task Notes v0.1.0`; no `(unknown)`, no `undefined`, no empty parentheses.
2. In DevTools, Network tab, set throttling to `Slow 3G` and reload http://localhost:5183/ → while the `/api/version` request is still pending the footer reads exactly `Task Notes`; once it completes it reads `Task Notes v0.1.0` (or with the commit, if BUILD_COMMIT is set). Reset throttling to `No throttling` afterwards.
3. Stop the backend with `docker compose stop backend` and reload http://localhost:5183/ → the footer reads exactly `Task Notes`; no error text, no `undefined`, no `unknown`. Start it again with `docker compose start backend`.
Note: version and commit come from one request, so pending and outright failure show `Task Notes` (TEST-08 behaviour) and a missing commit shows the version alone; see Re-Plan Feedback for this recorded interpretation.

### Criterion 3: A component test covers the success, pending and failure paths
This criterion is a test, not UI behaviour; the observable check is the test run.
1. From the repo root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports 0 failed.
2. Open frontend/src/components/AppFooter.test.tsx → it contains a success test (footer exactly `Task Notes v0.1.0 (abc1234)`), a pending test (never-resolving promise, footer exactly `Task Notes`), and failure tests (rejected request and null result, footer exactly `Task Notes`), plus the version-alone test for a null commit.
