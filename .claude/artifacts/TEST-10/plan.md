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

## Acceptance Criteria
- [ ] 1. The footer shows the first 7 characters of the commit from `GET /api/version`, next to the version TEST-08 added.
- [ ] 2. While the request is pending or when it fails, the footer shows the version alone, never `undefined` or an error.
- [ ] 3. A component test covers the success, pending and failure paths.

## Re-Plan Feedback
- Comment (tracker): five mayker-dev PR notices from earlier runs (links to plan and implementation PRs that the sandbox reset reverted) → Not acted on because none carries a requirement; the dispatch states that none is actionable. Their recorded reading of criterion 2 was weighed and agrees with the assumption below.
- Assumption (criterion 2): the version and the commit arrive in the same `GET /api/version` response, so while that request is pending, or when it fails outright, there is no version to show either. In those states the footer keeps TEST-08 behaviour exactly (`Task Notes` alone, no commit, no `undefined`, no error text). "The version alone" is therefore read as: whenever the commit is not usable (request pending, request failed, or a response whose commit is missing, empty, non-string or the backend default `unknown`), no commit element is rendered and whatever TEST-08 shows is shown unchanged. A response with a usable version and a usable commit shows both.
- Assumption (display format): the commit renders as a sibling span after the version span, text ` (abc1234)`, with `data-testid="app-commit"`. A sibling, not a child, so the TEST-08 assertion that `app-version` reads exactly ` v<version>` keeps holding.
- Assumption (truncation): TEST-09 returns the commit cut to 12 characters; the frontend client cuts it to the first 7. No backend change.
- Merged since the last plan: n/a (fresh plan, branched from current main at 38e5d71; the earlier run's implementation was reverted by the sandbox reset, so nothing of TEST-10 is on main).

## Plan Overview
Frontend-only change on top of TEST-08 and TEST-09. The version client (`frontend/src/api/version.ts`) starts reading the `commit` field that TEST-09 already serves, normalises it (first 7 characters, or null when missing, empty, non-string or `unknown`) and returns version and commit together. `AppFooter` keeps its loading and failure behaviour and adds one span for the commit when one is known. Tests: client unit tests, component tests for success, pending and failure, and one small E2E spec on the landing page. No backend, no new dependency, no route.

## Frontend Plan
- Components to create/modify:
  - `frontend/src/api/version.ts`: `fetchAppVersion()` now resolves an `AppVersion` object (`version: string`, `commit: string | null`) or `null`. The version rules are unchanged (missing, empty, non-string or `unknown` version resolves `null`, a non-OK response or network error rejects). New commit rule: a string that is non-empty and not `unknown` is cut to its first 7 characters (`SHORT_COMMIT_LENGTH = 7`); anything else becomes `commit: null`. Export the `AppVersion` type. Update the doc comment, which today says fields other than `version` are ignored.
  - `frontend/src/components/AppFooter.tsx`: state holds `AppVersion | null` instead of `string | null`. Render unchanged when null. When resolved, render the existing `app-version` span (` v<version>`) and, only when `commit` is non-null, a sibling `<span data-testid="app-commit"> (<commit>)</span>` right after it. Loading and failure paths stay exactly as TEST-08 wrote them.
- Routes: none.
- State management: local component state in `AppFooter`, as today.
- Design reference notes: AI freestyle (Design Reference mode NONE). The commit span inherits the existing footer style (`fontSize 0.875rem`, `color #5f5f5f`); no new style values.

## Backend Plan
No backend changes required. TEST-09 already serves `commit` (12 characters, default `unknown`) on `GET /api/version`.

## API Integration Plan
No external API integration.

## API Contract
- Method: GET
- URL: /api/version (internal, served by TEST-09, unchanged)
- Request: no body, no parameters.
- Response: 200 with a JSON object of two string fields, `version` (for example `0.1.0`) and `commit` (for example `3dd809b0a1c2`, 12 characters, or `unknown` when the build commit is not set). The frontend reads both fields and ignores any other.
- Client result consumed by `AppFooter`: `AppVersion | null`, where `AppVersion` has `version` (string) and `commit` (the first 7 characters, or null).

## Technology Selection
- Commit truncation: chose the standard library `String.prototype.slice(0, 7)` over any formatting dependency; no new dependency is needed.
- Commit display: chose a plain `<span>` sibling in the existing footer over a new component; no net-new component, module or dependency is introduced by this feature.
- Tests: chose the already-installed Vitest, Testing Library and Playwright (with `page.route` to serve a known response) over any new test dependency.

## File Manifest
### New files
- [D] e2e/tests/TEST-10_footer_build_commit.spec.ts: landing page shows the 7-character commit next to the version (served via `page.route`), plus the edge case where the response carries the `unknown` commit and only the version shows
- [G] e2e/uat/scenarios/TEST-10_footer_build_commit.feature: Gherkin scenarios, one per criterion plus one edge case
- [G] e2e/uat/scripts/TEST-10_footer_build_commit_uat_script.md: manual UAT script expanded from the Manual verification plan
- [G] .claude/artifacts/TEST-10/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [A] frontend/src/api/version.ts: read and normalise `commit` (first 7 characters, or null), return `AppVersion | null`, export the type
- [A] frontend/src/api/version.test.ts: update existing expectations to the object result; add cases for commit cut to 7, commit missing, empty, non-string and `unknown` giving null, and a commit shorter than 7 kept as is
- [A] frontend/src/components/AppFooter.tsx: hold `AppVersion | null`; render the `app-commit` span after `app-version` when the commit is known
- [A] frontend/src/components/AppFooter.test.tsx: update mocks to the object result; add success (version and commit), pending (name alone, no commit, no version), failure (rejected: name alone, no `undefined`/`null`/`unknown`/error text) and resolved-without-commit (version alone) cases
No dependency changes, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit. The existing TEST-08 E2E spec keeps passing unchanged (the commit is a sibling of `app-version`), so it is not listed.

## Testing Strategy
- Unit tests: `fetchAppVersion` commit normalisation (fetch stubbed, as `version.test.ts` already does) and `AppFooter` rendering for success, pending, failure and resolved-without-commit (client mocked, as `AppFooter.test.tsx` already does). Vitest, run by `npm --prefix frontend test`.
  - Directory: colocated with the source under `frontend/src/` (the existing frontend convention; `backend/tests/unit/` in CLAUDE.md is the backend directory)
  - Naming: `<module>.test.ts` / `<Component>.test.tsx`, as the existing frontend tests
- Integration tests: not warranted. No repository, model, migration or endpoint changes (testing_standards.md Section 6); TEST-09 already covers the endpoint.
- E2E tests: one spec for criterion 1 on the landing page, with `page.route` serving a known version and a 12-character commit, plus one edge-case test where the served commit is `unknown` and only the version shows.
  - Directory: e2e/tests/
  - File: TEST-10_footer_build_commit.spec.ts
- UAT scenarios: one scenario per criterion plus one edge case (response with the `unknown` commit).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The footer shows the first 7 characters of the commit next to the version | E2E (plus unit for the truncation rule) | — |
| 2 | While pending or on failure the footer shows the version alone, never `undefined` or an error | Unit (component test) | Verifying it needs no navigation or interaction: it is a render state of one component for a pending, rejected or commit-less client result, which a mocked client reproduces deterministically; a browser cannot hold a request pending reliably |
| 3 | A component test covers the success, pending and failure paths | Unit (component test) | The criterion is itself the existence of a component test; it is satisfied by `AppFooter.test.tsx` and verified by running it |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Commit shown, 7 characters, next to the version | `page.route` on `**/api/version` fulfils version `9.9.9-e2e` and commit `abcdef123456`; go to `/`; expect `app-version` text ` v9.9.9-e2e` and `app-commit` text ` (abcdef1)`, footer text `Task Notes v9.9.9-e2e (abcdef1)` | Given the API reports version 9.9.9 and commit abcdef123456, When I open the landing page, Then the footer reads Task Notes v9.9.9 (abcdef1) |
| 2 | Pending or failed: version alone, no `undefined` or error | covered at Unit, see Criterion coverage; the E2E edge-case test (commit `unknown`) checks `app-commit` count 0 and no `undefined`/`unknown` text | Given the version request fails, When I open the landing page, Then the footer reads Task Notes with no commit and no error text |
| 3 | Component test covers success, pending, failure | covered at Unit, see Criterion coverage | Given the frontend test suite, When I run it, Then the AppFooter success, pending and failure tests pass with 0 failed |

## Manual verification plan
### Criterion 1: The footer shows the first 7 characters of the commit from GET /api/version, next to the version
Prerequisites: from the repository root, start the stack with a known build commit: `BUILD_COMMIT=3dd809b0a1c2 docker compose up -d --build`, then wait until `http://localhost:8010/api/version` answers.
1. Open `http://localhost:8010/api/version` in the browser → the JSON shows `version` (for example `0.1.0`) and `commit` `3dd809b0a1c2`.
2. Open `http://localhost:5183/` (landing page) → the footer at the bottom of the page reads `Task Notes v0.1.0 (3dd809b)`: the version, then the commit in parentheses, exactly 7 characters.
3. Open the browser dev tools Elements panel and inspect the footer (`data-testid="app-footer"`) → it holds a span `app-version` with text ` v0.1.0` and, right after it, a span `app-commit` with text ` (3dd809b)`.

### Criterion 2: While the request is pending or when it fails, the footer shows the version alone, never undefined or an error
Prerequisites: the stack from Criterion 1 is running.
1. Restart the backend without a build commit: `docker compose up -d --build backend` with `BUILD_COMMIT` unset, then reload `http://localhost:5183/` → the footer reads `Task Notes v0.1.0` with no parentheses, and no `unknown`, `undefined` or `null` anywhere in it.
2. In dev tools Network panel set throttling to `Slow 3G` and reload `http://localhost:5183/` → while `/api/version` is still pending the footer reads `Task Notes` alone, with no commit, no `undefined` and no error text; once the request completes the version appears.
3. Stop the backend: `docker compose stop backend`, then reload `http://localhost:5183/` → the page renders, the footer reads `Task Notes` alone, with no commit, no `undefined` and no error message.
4. Start it again: `docker compose start backend` → after a reload the footer reads `Task Notes v0.1.0` again (version alone while `BUILD_COMMIT` is unset).

### Criterion 3: A component test covers the success, pending and failure paths
This criterion is about the test suite, not the UI; verify it by running the tests.
1. From the repository root run `npm --prefix frontend test -- src/components/AppFooter.test.tsx src/api/version.test.ts` → the run reports `0 failed`.
2. Open `frontend/src/components/AppFooter.test.tsx` → it contains a success test (footer shows the version and the 7-character commit), a pending test (client promise never settles: footer shows `Task Notes` alone, no `app-commit`) and a failure test (client rejects: footer shows `Task Notes` alone, no `undefined`, `null`, `unknown` or error text).
