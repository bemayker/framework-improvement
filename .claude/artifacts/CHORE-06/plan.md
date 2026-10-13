# Implementation Plan, CHORE-06: BUG-01 follow-up: known-improvements

## Feature
> Follow-up filed by autonomous delivery run deliver-20261013T010031Z (Section W, wave 2 boundary). Source: BUG-01, known-improvements.
>
> OPTIONAL: `backend/tests/unit/test_server_time_unit.py` changed but was not in the plan's File Manifest; the change is forced by the handler signature and asserts unchanged behaviour. (Self-review: `test_server_time_unit.py:6,74-75`; the plan's Testing Strategy said unit tests were not warranted and missed this file. Fix: no code change; note so the plan/diff gap can be audited.)
>
> Source pull request: https://github.com/bemayker/framework-improvement/pull/149
>
> Depends on: BUG-01.

## Acceptance Criteria
- [ ] 1. The BUG-01 plan/diff gap is auditable: a record reachable from main names `backend/tests/unit/test_server_time_unit.py`, states it changed in BUG-01 (commit f7889c2, squash 11722a8, lines 6 and 74-75) although BUG-01's File Manifest omitted it, and states why (the `get_server_time` signature gained `response: Response`, so the existing FEAT-1 unit test had to pass `Response()`).
- [ ] 2. No code change: `backend/app/` and `backend/tests/` are untouched by this item, and `backend/tests/unit/test_server_time_unit.py` still passes with 0 failed, asserting the unchanged clock-read behaviour.

## Re-Plan Feedback (if applicable)
- Comment (tracker): none on the item (0 comments, 0 threaded replies).
- Assumption (no comment): criteria 1 and 2 are derived from the item's single OPTIONAL finding, whose own text sets the fix as "no code change; note so the plan/diff gap can be audited". Nothing beyond that note is in scope (`user_story_alignment.md` Section 3).
- Finding (verified in the worktree at 5703562 and on GitHub): the note the item asks for already exists in three places reachable from main. (a) PR #149's merged body names the file as "forced by the signature change; not in the plan's File Manifest, flagged OPTIONAL by the self-review" and repeats the OPTIONAL finding. (b) `.claude/artifacts/BUG-01/decisions.md`, 6.4 line: "Phase B f7889c2 (deviation: test_server_time_unit.py updated for the new Response parameter)" plus the review verdict naming the same gap. (c) `.claude/artifacts/BUG-01/review_scope.md` lists `M backend/tests/unit/test_server_time_unit.py` among the changed files. This plan adds the fourth, consolidated record: itself, merged with the CHORE-06 plan commit.
- Assumption (no comment): BUG-01's own `plan.md` is NOT amended. It is the contract BUG-01 was built and reviewed against; rewriting it after merge would erase exactly the gap an auditor needs to see. The gap stays visible as plan-versus-diff, and this plan is the cross-reference.
- Assumption (no comment): no test change. The modified unit test is correct (it passes `Response()` and asserts the same two clock instants as before); adding a header assertion there would duplicate BUG-01's integration test `test_get_time_sets_cache_control_no_store` and is gold plating.
- Recommendation to the orchestrator: the item closes on this plan artifact alone. No build phase has work (File Manifest below is empty by decision), so dispatching a build would only produce UAT artifacts about a document, which is noise rather than verification.

## Plan Overview
Documentation-only resolution, and the documentation is this plan. No application code, test, configuration or docs file changes. The item is closed by recording the BUG-01 plan/diff gap in one auditable place (this file) that cross-references the three records already on main, and by confirming the existing unit test still passes. No build phase is dispatched.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; no UI in this item)

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
No API change. `GET /api/time` is unchanged from BUG-01 (header `Cache-Control: no-store`, body unchanged).

## Technology Selection
- No net-new component, module or dependency is introduced; the item is resolved by a plan artifact and needs no technology choice.

## File Manifest
### New files
No new repository files. The only file this item adds is this plan (and its `shared_risks.md`), written at plan time under `.claude/artifacts/CHORE-06/` and committed with the plan commit, not by any build phase.

### Modified files
No modified files. No dependency change, so no lockfile. No change to project structure, run configuration, dependencies or test infrastructure, so neither README.md nor docs/DEVELOPMENT.md needs an edit. No UAT artifacts (manual script, its `.claude/artifacts/CHORE-06/uat_script.md` copy, or Gherkin scenarios) are planned, because no build phase is dispatched for a documentation-only item; if the orchestrator nevertheless runs a build, those three [G] files would be its only output and should be judged as noise.

## Audit record: BUG-01 plan/diff gap
File: `backend/tests/unit/test_server_time_unit.py`.
Planned: absent from `.claude/artifacts/BUG-01/plan.md` File Manifest; its Testing Strategy said "Unit tests: not warranted".
Actual: modified in BUG-01 Phase B commit f7889c2 (squash-merged as 11722a8, PR #149). Line 6 adds `from fastapi import Response`; lines 74-75 change `server_time.get_server_time()` to `server_time.get_server_time(Response())`.
Cause: the plan's own Backend Plan changed the handler signature to `get_server_time(response: Response)`. The FEAT-1 unit test calls the handler directly, so it had to pass a `Response`. The plan missed a caller of the function it changed.
Behaviour: unchanged. The test still asserts the clock is read on every call (two instants, 08:00:00Z and 08:00:01Z); no assertion was added or removed.
Severity: OPTIONAL (review verdict PASS, blocking=0, recommended=0, optional=1).
Lesson for future plans: when a plan changes a function signature, list every direct caller, tests included, in the File Manifest.

## Testing Strategy
- Unit tests: no new tests. The existing `backend/tests/unit/test_server_time_unit.py` is the executed coverage for criterion 2 and runs in CI and the pre-push gate unchanged.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: none; no router, repository or migration change.
  - Directory: backend/tests/integration/
- E2E tests: not warranted. No criterion involves navigation or interaction through the UI.
  - Directory: e2e/tests/
  - File: none for this item
- UAT scenarios: not generated, because no build phase is dispatched (documentation-only item). The Manual verification plan below is the human check.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | The BUG-01 plan/diff gap is auditable from main | Manual (document check) | It is a record, not behaviour: verified by reading this plan's Audit record and the three cross-referenced records; no UI exists for it |
| 2 | No code change; `test_server_time_unit.py` still passes | Unit (existing test file) | It is the existing unit test of the router function plus an empty code diff; no navigation or interaction is involved |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | The BUG-01 plan/diff gap is auditable from main | covered at Manual (document check), see Criterion coverage | Given main after the CHORE-06 plan merge, When I open .claude/artifacts/CHORE-06/plan.md, Then its Audit record names the file, commit f7889c2, lines 6 and 74-75, and the signature-change cause |
| 2 | No code change; the unit test still passes | covered at Unit, see Criterion coverage | Given the CHORE-06 branch, When I diff it against origin/main and run the server time unit tests, Then only .claude/artifacts/CHORE-06/ differs and 0 failed |

## Manual verification plan
### Criterion 1: The BUG-01 plan/diff gap is auditable from main
Not verifiable through the UI: it is a written record. Observable check instead.
Prerequisites: repository checked out on `feature/CHORE-06-bug-01-follow-up` (or main after the plan merges).
1. Open `.claude/artifacts/CHORE-06/plan.md`, section `## Audit record: BUG-01 plan/diff gap` → it names `backend/tests/unit/test_server_time_unit.py`, commit f7889c2 (squash 11722a8, PR #149), lines 6 and 74-75, and the cause "the handler signature gained `response: Response`".
2. Open `.claude/artifacts/BUG-01/plan.md`, section `## File Manifest` → `backend/tests/unit/test_server_time_unit.py` is absent, confirming the gap the record describes.
3. Run `git show 11722a8 -- backend/tests/unit/test_server_time_unit.py` → the diff adds `from fastapi import Response` and changes both `get_server_time()` calls to `get_server_time(Response())`, and nothing else.
4. Open `.claude/artifacts/BUG-01/decisions.md` → the 6.4 line reads "deviation: test_server_time_unit.py updated for the new Response parameter".
5. Run `gh pr view 149 --repo bemayker/framework-improvement` → the body mentions `test_server_time_unit.py` as "not in the plan's File Manifest, flagged OPTIONAL by the self-review".

### Criterion 2: No code change; the unit test still passes
Not verifiable through the UI: it is a diff and a test run. Observable check instead.
Prerequisites: repository checked out on `feature/CHORE-06-bug-01-follow-up`, uv installed.
1. Run `git diff --name-only origin/main...HEAD` → every listed path starts with `.claude/artifacts/CHORE-06/`; nothing under `backend/`, `frontend/` or `e2e/`.
2. Run `uv run --directory backend pytest -q tests/unit/test_server_time_unit.py` → output ends with `0 failed`.
