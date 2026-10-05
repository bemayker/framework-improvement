# Implementation Plan, CHORE-03: TEST-10 follow-up: known-improvements

## Feature
> Follow-up filed by the autonomous delivery run `deliver-20261005T151552Z` (type: chore; depends on TEST-10).
> ## Known improvements (verbatim from the merged pull request)
> * OPTIONAL (review): Design Reference mode is NONE, so no design values were recorded for the commit token (spacing, monospace, emphasis); it inherits the footer's style.
> Source pull request: https://github.com/bemayker/framework-improvement/pull/101

Tracker: ClickUp 123k99cx6rm (chore, tracker-resident, filed by run deliver-20261005T151552Z). Depends on TEST-10 (done, merged at 5615203). Tracker comments: 0.

## Acceptance Criteria
- [ ] 1. The item's decision log, `.claude/artifacts/CHORE-03/decisions.md`, records that under `CLAUDE.md` Design Reference mode NONE the footer's commit token (`data-testid="app-footer-commit"`) deliberately inherits the footer's existing style, with no token-specific spacing, monospace font or emphasis, and that token-specific values are set only when a configured design reference supplies them.
- [ ] 2. No application, test or configuration file changes: the TEST-10 footer renders exactly as merged (`Task Notes v{version} · {first 7 characters of commit}`, the commit span styled only by the footer's own `fontSize 0.875rem, color #5f5f5f`), and the existing `AppFooter.test.tsx` and `e2e/tests/TEST-10_footer_build_commit.spec.ts` pass unchanged.

## Re-Plan Feedback (if applicable)
- Comment (tracker): none on the item (0 read by the main session at 6.1). Nothing to address.
- Merged since the last plan: n/a (fresh plan, branched from current main 65d624c; no prior plan for this item).
- Assumption (derived criteria, `user_story_alignment.md` Section 4, autonomous run): the item carries one reviewer note and no criteria. The note is not a defect report: it records that a design input (token-level values) does not exist under Design Reference NONE and that the token therefore inherits the footer's style. Criteria 1 and 2 above are the only ones stateable without inventing design values or adding a dependency, which the orchestrator's scope steer requires and `CLAUDE.md` Architecture Notes ("Keep every feature as small as possible") prefers.
- Assumption: the inheritance is the intended behaviour, not a gap to fill. Verified on the worktree at 65d624c: `frontend/src/components/AppFooter.tsx` renders the commit in a bare `<span data-testid="app-footer-commit">` inside the `<footer>` whose only style is `footerStyle` (`fontSize: "0.875rem"`, `color: "#5f5f5f"`, `marginTop: "1.5rem"`), separated from the version by the footer's existing `SEPARATOR` (` · `). TEST-10's approved plan recorded exactly this ("The commit inherits the footer's existing inline style ... no new style values"), and its self-review graded it OPTIONAL, not RECOMMENDED or BLOCKING.
- Rejected alternative, styling the token (monospace, letter-spacing, weight or color): every such value would be invented, which `user_story_alignment.md` Section 3 forbids and the steer excludes; it would also put `AppFooter.tsx` in this item's file set.
- Rejected alternative, a "why" comment at the commit span in `frontend/src/components/AppFooter.tsx`: it is an application-file change for a record, and BUG-03 ("Footer sometimes shows 'unknown' instead of the build commit", wave 5, depends on TEST-10 and so can run concurrently with this item) plausibly edits that file; a decision-log entry needs no serialization.
- Rejected alternative, the repository-root `DECISIONS.md`: it is the run-owned cross-cutting log the active `/deliver` session writes in the primary checkout (currently modified there), so a feature-branch edit invites a conflict with the run's own landing, and this decision is item-scoped, which `.claude/artifacts/{ID}/decisions.md` is for.
- Rejected alternative, `docs/DEVELOPMENT.md`: `/sync-project` regenerates the project docs, so a hand-added note there is not durable.
- Assumption (who writes criterion 1's entry): the planner appends it to `.claude/artifacts/CHORE-03/decisions.md` in this dispatch, through `run-dir.sh append-item`, so it lands in the plan commit with `plan.md` and `shared_risks.md`. It is therefore not a File Manifest entry; the build's only output is the mandated UAT artifacts.

## Plan Overview
A decision-record-only chore. The single finding is resolved by recording, in the item's committed decision log, that the footer's commit token intentionally inherits the footer's style while Design Reference mode is NONE, and by leaving the merged TEST-10 code untouched. No frontend, backend, API, dependency or configuration change. The build runs Phase G only (manual UAT script, its artifact copy, and the Gherkin scenarios, because UAT Generation is ENABLED).

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE); no visual change in this item. For the record, the existing commit token has no values of its own: it inherits the footer's `fontSize 0.875rem, color #5f5f5f, marginTop 1.5rem`, the page's font family, and the ` · ` separator text as its only spacing.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
No contract change. `GET /api/version` keeps its TEST-09 shape, for example `{"version": "0.1.0", "commit": "0123456789ab"}`, and the frontend client `getBackendBuildInfo()` is untouched.

## Technology Selection
- No net-new component, module or dependency: the item records a decision in an existing artifact file and changes no code, so there is nothing for the ladder to substitute.

## File Manifest
### New files
- [G] e2e/uat/scenarios/CHORE-03_test_10_follow_up.feature: Gherkin scenarios, one per criterion plus one edge case (the commit span's computed style equals the footer's), produced because UAT Generation is ENABLED; validated for well-formedness only
- [G] e2e/uat/scripts/CHORE-03_test_10_follow_up_uat_script.md: manual UAT script expanded from this plan's Manual verification plan (build-feature Section 14 writes it on every build)
- [G] .claude/artifacts/CHORE-03/uat_script.md: the copy of the manual UAT script build-feature Section 14 step 3 writes

### Modified files
No application, test or configuration file is modified (criterion 2). The decision-log entry criterion 1 names is appended to `.claude/artifacts/CHORE-03/decisions.md` by the planner at plan time and ships in the plan commit, so it is not a build-phase entry.
No dependency change, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit (build-feature Section 15's condition is not met).

## Testing Strategy
No new test is written: neither criterion adds behaviour, so no tier of `testing_standards.md` Section 6 is warranted by this item (no service logic, no repository or model, no endpoint, no new user-facing interaction). The existing suite executes over the unchanged footer.
- Unit tests: none new. Not warranted: no service-layer or utility code changes. The existing `frontend/src/components/AppFooter.test.tsx` (co-located Vitest, the frontend convention; `backend/tests/unit/` with `test_{module}_unit.py` is the backend's and is untouched) keeps running and is criterion 2's executed check.
  - Directory: frontend/src/ (co-located `*.test.tsx`)
  - Naming: `{Module}.test.tsx`
- Integration tests: none new. Not warranted: no repository, model, migration or router change (Integration Tests ENABLED, nothing to integrate).
  - Directory: backend/tests/integration/
- E2E tests: none new. Not warranted: no criterion needs navigation or interaction; the existing `e2e/tests/TEST-10_footer_build_commit.spec.ts` keeps running in CI unchanged.
  - Directory: e2e/tests/
  - File: none for this item (would be `CHORE-03_test_10_follow_up.spec.ts`)
- UAT scenarios: `e2e/uat/scenarios/CHORE-03_test_10_follow_up.feature`, one scenario per criterion plus the computed-style edge case.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The decision log records that the commit token inherits the footer's style under Design Reference NONE, with no token-specific values until a design reference supplies them | Static check (review-time `git grep -n "app-footer-commit" .claude/artifacts/CHORE-03/decisions.md` returns the entry, which names Design Reference mode NONE and the inherited footer style) | Verifying it needs no navigation or interaction: it is a documentation record with no runtime behaviour, so no test tier executes it; a grep is the observable check |
| 2 | No application, test or configuration file changes; the footer renders exactly as merged | Unit (existing `AppFooter.test.tsx`, unchanged, run by the test gate and CI) plus a review-time diff check (`git diff --name-only origin/main...HEAD` lists only `.claude/artifacts/CHORE-03/` and `e2e/uat/` paths) | Verifying it needs no navigation or interaction: it asserts the absence of a change; the existing component tests and TEST-10's existing E2E spec already cover the unchanged render, and a new spec would duplicate them |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Decision log records the inherited style | covered at Static check, see Criterion coverage | Given the CHORE-03 branch, When I read `.claude/artifacts/CHORE-03/decisions.md`, Then an entry says the commit token inherits the footer's style under Design Reference NONE and gets token-specific values only from a configured design reference |
| 2 | No application change; footer renders as merged | covered at Unit, see Criterion coverage | Given the stack runs with BUILD_COMMIT `0123456789abcdef0123456789abcdef01234567`, When I open the landing page, Then the footer reads `Task Notes v0.1.0 · 0123456` |
| edge | Commit span has no style of its own | covered at Unit (existing render test) and review-time diff check | Given the landing page is open, When I inspect the `app-footer-commit` span, Then its computed font size, colour and font family equal the footer's |

## Manual verification plan
### Criterion 1: the decision log records that the commit token inherits the footer's style under Design Reference NONE
Prerequisites: a checkout of branch `feature/CHORE-03-test-10-follow-up`.
1. Open `.claude/artifacts/CHORE-03/decisions.md` → an entry tagged `[CHORE-03]` names the `app-footer-commit` token, states it inherits the footer's style (`fontSize 0.875rem`, `color #5f5f5f`) with no token-specific spacing, monospace or emphasis, and states that token-specific values come only from a configured design reference.
2. Open `CLAUDE.md` and read `## Design Reference` → `Mode: NONE`, matching the condition the entry names.

### Criterion 2: no application change; the footer renders exactly as merged
Prerequisites: Docker running; from the repository root, the stack built with a known commit: `BUILD_COMMIT=0123456789abcdef0123456789abcdef01234567 docker compose up -d --build` (frontend `http://localhost:5183`, backend `http://localhost:8010`).
1. From the repository root run `git diff --name-only origin/main...HEAD` → only paths under `.claude/artifacts/CHORE-03/` and `e2e/uat/` are listed; nothing under `frontend/`, `backend/`, `e2e/tests/` or the repository root.
2. Open `http://localhost:5183/` and scroll to the footer → it reads exactly `Task Notes v0.1.0 · 0123456`.
3. In DevTools Elements select the `span` with `data-testid="app-footer-commit"`, open Computed → `font-size` is `14px`, `color` is `rgb(95, 95, 95)`, and `font-family` and `font-weight` equal those of the parent `footer` (`data-testid="app-footer"`); the span has no inline `style` attribute.
4. Run `npm --prefix frontend test -- AppFooter` from the repository root → every AppFooter case passes, including the success case showing `Task Notes v9.8.7 · abc123d`.
