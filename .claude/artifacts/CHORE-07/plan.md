# Implementation Plan, CHORE-07: TEST-10 follow-up: known-improvements

## Feature
> RECOMMENDED: the existing TEST-08 E2E test now passes only while `BUILD_COMMIT` is unset. `e2e/tests/TEST-08_footer_app_version.spec.ts:11` asserts the exact footer text `` `Task Notes v${backendVersion}` ``. On any stack where `BUILD_COMMIT` is set (`docker-compose.yml:43` passes it through from the shell or `.env`), the footer appends `(xxxxxxx)` and that assertion fails. Fix: point the TEST-08 assertion at `app-footer-version` only, or use `toContainText`. Verify by running: `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts` (with the stack up and `BUILD_COMMIT` set)
>
> Source: https://github.com/bemayker/framework-improvement/pull/389 (TEST-10, run deliver-20261029T181219Z).
>
> Depends on: TEST-10.

## Acceptance Criteria
The item carries a single review finding and no criteria of its own; the three below are derived from that finding and recorded as assumptions (see Re-Plan Feedback).

- [ ] 1. With the stack started with `BUILD_COMMIT` set (footer renders `Task Notes v{version} ({7-char commit})`), the TEST-08 spec `e2e/tests/TEST-08_footer_app_version.spec.ts` passes with 0 failed.
- [ ] 2. With the stack started with `BUILD_COMMIT` unset (footer renders `Task Notes v{version}`), the same spec still passes with 0 failed.
- [ ] 3. The first TEST-08 test still verifies the version: the footer is asserted to contain `Task Notes v{backendVersion}` and `app-footer-version` is asserted to read exactly `v{backendVersion}`; the second TEST-08 test (backend unreachable, footer reads exactly `Task Notes`) is unchanged.

## Re-Plan Feedback
- Assumption (no tracker comments on the item; the item is a run-filed follow-up carrying one RECOMMENDED finding): acceptance criteria 1 to 3 are derived from the finding's own text and its `Verify by running:` line, since the item has no criteria. Scope is that one finding only.
- Assumption: of the two fixes the finding offers, this plan uses `toContainText` on the footer (keeping the exact `toHaveText` on `app-footer-version` already on line 12). That keeps the footer-level check that the app name and version appear together, which pointing the assertion at `app-footer-version` alone would drop, and it passes whether or not the commit suffix is rendered.
- Not acted on: `e2e/uat/scenarios/TEST-08_footer_app_version.feature` line 14 states the same exact footer text. It is a Gherkin scenario validated for well-formedness only (no BDD runner is installed), so it fails nothing; editing TEST-08's artifacts is outside this one finding.
- Not acted on: no product code changes. `frontend/src/components/AppFooter.tsx` renders the commit suffix by design (TEST-10).
- Merged since the last plan: n/a (fresh plan, no earlier plan for CHORE-07).

## Plan Overview
One-line change to an existing Playwright spec: the first TEST-08 test's exact-text assertion on the `app-footer` element (`toHaveText`) becomes `toContainText` with the same expected string, so the spec passes with and without the TEST-10 commit suffix. The second assertion in that test (exact `v{version}` on `app-footer-version`) and the second test are untouched. No frontend, backend or API code changes. Build phases: D (the spec edit) and G (UAT artifacts).

## Frontend Plan
No frontend changes required.

- Design reference notes: AI freestyle (Design Reference mode NONE; no UI change in this item).

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
No API change. The spec reads the existing `GET /api/version` through the running frontend; its contract is TEST-08's and TEST-09's and is unchanged.

## Technology Selection
- No net-new component, module or dependency: the change uses Playwright's existing `toContainText` web-first assertion from the already installed `@playwright/test`, over a hand-written regex or a text-stripping helper.

## File Manifest
### New files
- [G] e2e/uat/scenarios/CHORE-07_test_10_follow_up.feature: Gherkin scenarios for criteria 1 to 3 plus one edge case (UAT Generation ENABLED)
- [G] e2e/uat/scripts/CHORE-07_test_10_follow_up_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/CHORE-07/uat_script.md: the build-feature Section 14 step 3 copy of the manual UAT script

### Modified files
- [D] e2e/tests/TEST-08_footer_app_version.spec.ts: line 11, `await expect(footer).toHaveText(...)` becomes `await expect(footer).toContainText(...)` with the same `Task Notes v${backendVersion}` string; nothing else in the file changes

No dependency change, so no lockfile entry. No project structure, run configuration, dependency or test infrastructure change, so neither README.md nor docs/DEVELOPMENT.md needs an edit.

## Testing Strategy
- Unit tests: none warranted. No service, utility or component logic changes; `frontend/src/components/AppFooter.test.tsx` already covers the footer with and without a commit.
  - Directory: backend/tests/unit/ (unused here)
  - Naming: test_{module}_unit.py (unused here)
- Integration tests: none warranted. No repository, model, migration or endpoint changes.
  - Directory: backend/tests/integration/ (unused here)
- E2E tests: the modified spec itself is the deliverable. Run it against the stack twice, once with `BUILD_COMMIT` set and once unset; no new spec file is added, since the existing TEST-08 spec is what the criteria name.
  - Directory: e2e/tests/
  - File: e2e/tests/TEST-08_footer_app_version.spec.ts (modified, existing name kept)
- UAT scenarios: one scenario per criterion plus one edge case (the backend-unreachable test still reads exactly `Task Notes`).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | TEST-08 spec passes with BUILD_COMMIT set | E2E | — |
| 2 | TEST-08 spec passes with BUILD_COMMIT unset | E2E | — |
| 3 | The first test still verifies the version and the second test is unchanged | E2E | — |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Passes with BUILD_COMMIT set | Run the TEST-08 spec against a stack started with `BUILD_COMMIT` set; footer carries `(xxxxxxx)` and both tests pass | Given the stack runs with BUILD_COMMIT set When the TEST-08 spec runs Then it reports 0 failed |
| 2 | Passes with BUILD_COMMIT unset | Run the same spec against a stack with `BUILD_COMMIT` unset | Given the stack runs with BUILD_COMMIT unset When the TEST-08 spec runs Then it reports 0 failed |
| 3 | Still verifies the version | Read the diff: line 11 uses `toContainText` with `Task Notes v${backendVersion}`, line 12 keeps exact `toHaveText` on `app-footer-version`, test 2 untouched | Given the modified spec When its first test is read Then it asserts the footer contains "Task Notes v0.1.0" and app-footer-version reads exactly "v0.1.0" |

## Manual verification plan
### Criterion 1: TEST-08 spec passes with BUILD_COMMIT set
Prerequisites: repository root checked out at the CHORE-07 build; nothing listening on ports 5183 and 8010.
1. From the repository root run `BUILD_COMMIT=3761feee721597797dfabfd75a08d12e7aea4a23 docker compose up -d --build` → frontend, backend and db containers are running.
2. Open http://localhost:5183/ in a browser → the footer reads `Task Notes v0.1.0 (3761fee)`.
3. Run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts` → both tests in that file pass, 0 failed.

### Criterion 2: TEST-08 spec passes with BUILD_COMMIT unset
Prerequisites: no `BUILD_COMMIT` exported in the shell and none in a root `.env` file.
1. Run `docker compose down`, then `docker compose up -d --build` → containers are running.
2. Open http://localhost:5183/ → the footer reads `Task Notes v0.1.0`, with no parenthesised commit.
3. Run `npx playwright test e2e/tests/TEST-08_footer_app_version.spec.ts` → both tests in that file pass, 0 failed.

### Criterion 3: The first test still verifies the version; the second is unchanged
Not a UI behaviour: verified by reading the spec.
1. Open `e2e/tests/TEST-08_footer_app_version.spec.ts` → line 11 reads `await expect(footer).toContainText(` with the `Task Notes v${backendVersion}` template; line 12 still reads `await expect(page.getByTestId("app-footer-version")).toHaveText(` with `v${backendVersion}`.
2. Run `git diff main -- e2e/tests/TEST-08_footer_app_version.spec.ts` → exactly one line changed (line 11); the second test, `footer reads exactly Task Notes when /api/version is unreachable`, has no diff.
