# Implementation Plan, CHORE-01: TEST-09 follow-up: known-improvements

## Feature
> - OPTIONAL: `backend/tests/integration/test_version_integration.py:1` — the module docstring names only TEST-05, though most of the file now tests TEST-09 behaviour; change it to "(TEST-05, TEST-09)". Source pull request: https://github.com/bemayker/framework-improvement/pull/94

Type: chore (tracker-resident, ClickUp 123k99cx6hc, created by run deliver-20261005T151552Z). Depends on TEST-09 (done, merged at aa17015).

## Acceptance Criteria
- [ ] 1. The module docstring on line 1 of `backend/tests/integration/test_version_integration.py` names both items it covers, reading `"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle."""`, and no other line of the file changes.

## Re-Plan Feedback (if applicable)
- Assumption (no comment carried; recorded per `user_story_alignment.md` Section 4, autonomous run): the work item has no criteria list, so the single criterion above is derived from its one bullet. The tracker text marks the item OPTIONAL; this run has scheduled it, so the plan treats it as in scope. Only the parenthetical changes; the rest of the docstring ("Integration tests for GET /api/version", ", full HTTP request/response cycle.") is kept verbatim, because the item asks for the item list to change and nothing else.
- Merged since the last plan: n/a (fresh plan; `origin/main` is at aa17015, which already contains TEST-09 and the file as described).

## Plan Overview
A one-line, behaviour-free edit to a backend test module's docstring so it names TEST-09 alongside TEST-05. Verified on `origin/main` at aa17015: line 1 reads `"""Integration tests for GET /api/version (TEST-05), full HTTP request/response cycle."""`. Of the file's eight tests, three exist only for TEST-09 (the `BUILD_COMMIT` set, unset and blank paths), four more assert TEST-09's `commit` field (the 200 body, the no-`DATABASE_URL` body, the exact-keys test and the OpenAPI schema test), and one is TEST-05 alone (`POST` returns 405) — so the item's premise holds. No application code, no test logic, no fixtures, no configuration change. Layer: backend tests only.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; and there is no UI in this item).

## Backend Plan
- Endpoints: none added or changed (`GET /api/version` is untouched).
- Service layer: none.
- Repository layer: none.
- Migrations: none.
- Test module edit: change the parenthetical on line 1 of `backend/tests/integration/test_version_integration.py` from `(TEST-05)` to `(TEST-05, TEST-09)`. Nothing else in the file moves; the per-test docstrings ("Criterion 1: ...", "Criterion 3: ...") stay as they are, since the item does not ask for them.

## API Integration Plan
No external API integration.

## API Contract
No contract change. `GET /api/version` keeps its TEST-09 response shape, for example `{"version": "0.1.0", "commit": "unknown"}`.

## Technology Selection
- No net-new component, module or dependency: the item edits one string literal in an existing file, so there is nothing for the ladder to substitute.

## File Manifest
### New files
- [G] e2e/uat/scripts/CHORE-01_test_version_docstring_uat_script.md: manual UAT script expanded from this plan's Manual verification plan (build-feature Section 14 writes it on every build)
- [G] .claude/artifacts/CHORE-01/uat_script.md: the copy of the manual script that build-feature Section 14 step 3 writes
- [G] e2e/uat/scenarios/CHORE-01_test_version_docstring.feature: Gherkin scenario for the one criterion plus one edge case (no other line changed); produced because UAT Generation is ENABLED, validated for well-formedness only

### Modified files
- [B] backend/tests/integration/test_version_integration.py: line 1 module docstring `(TEST-05)` becomes `(TEST-05, TEST-09)`; no other line changes
No dependency change, so no lockfile entry. No change to project structure, run configuration, dependencies or test infrastructure, so neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit (build-feature Section 15's condition is not met).

## Testing Strategy
No new test is written: the change is a string literal with no behaviour, so no tier of `testing_standards.md` Section 6 is warranted by it (no service logic, no repository or model, no endpoint, no user-facing interaction). The existing suite is what executes over the edited file.
- Unit tests: none new. Not warranted: no service-layer or utility code changes.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: none new; the existing `backend/tests/integration/test_version_integration.py` (all eight tests) must still be collected and pass, which proves the edited module still parses and imports. Run with the project gate `uv run --directory backend pytest -q` (the full gate also runs `npm --prefix frontend test`, untouched here).
  - Directory: backend/tests/integration/
- E2E tests: none. Toggle is ENABLED but not warranted: the criterion involves no navigation or interaction through the UI (`testing_standards.md` Section 6, fourth question, answered per criterion below), so no spec file is planned and no edge-case spec applies.
  - Directory: e2e/tests/
  - File: none (would be CHORE-01_test_version_docstring.spec.ts)
- UAT scenarios: toggle ENABLED, so build-feature Section 14 writes one Gherkin scenario for the criterion plus one edge case (no other line changed); they are validated for well-formedness only, never executed, and duplicate no E2E interaction (there is none).
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Line 1 docstring of `test_version_integration.py` names `(TEST-05, TEST-09)` and no other line changes | Integration | verifying it needs no navigation or interaction: the docstring has no runtime behaviour, so the executed coverage is the existing integration module being collected and passing (a malformed edit fails collection); the wording and the one-line scope are checked against the diff (`git diff origin/main -- backend/tests/integration/test_version_integration.py` shows exactly one changed line) |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Line 1 docstring names `(TEST-05, TEST-09)`, no other line changes | covered at Integration, see Criterion coverage | Given the repository at the CHORE-01 branch, When I read line 1 of backend/tests/integration/test_version_integration.py, Then it reads "Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle." and the diff against main changes only that line |

## Manual verification plan
### Criterion 1: Line 1 docstring names both items, and nothing else changes
This criterion cannot be verified through the UI: it is a comment in a backend test file. The observable checks, run from the repository root on the CHORE-01 branch:
Prerequisites: the CHORE-01 branch checked out, `uv` installed, and the backing database recipe from `CLAUDE.md` → Backing Services available for the integration tier.
1. Run `sed -n 1p backend/tests/integration/test_version_integration.py` → prints exactly `"""Integration tests for GET /api/version (TEST-05, TEST-09), full HTTP request/response cycle."""`
2. Run `git diff --stat origin/main -- backend/tests/integration/test_version_integration.py` → reports `1 file changed, 1 insertion(+), 1 deletion(-)`
3. Run `git diff origin/main -- backend/tests/integration/test_version_integration.py` → the only removed line is the `(TEST-05)` docstring and the only added line is the `(TEST-05, TEST-09)` docstring
4. Run `uv run --directory backend pytest -q tests/integration/test_version_integration.py` → `8 passed`, no collection errors
