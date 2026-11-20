# Implementation Plan, CHORE-90: VERIFY MDF-365: add a one-line note to docs/VALIDATION-SANDBOX.md (docs only)

## Feature
> Docs only. Append one line to `docs/VALIDATION-SANDBOX.md` saying that the file was touched by a verify run. No code, no tests.

## Acceptance Criteria
- [ ] `docs/VALIDATION-SANDBOX.md` ends with one new line that says a verify run touched it.

## Plan Overview
A single documentation edit. `docs/VALIDATION-SANDBOX.md` currently has 21 lines and ends with a trailing newline after the `## Measured runs` paragraph. The build appends exactly one line after line 21, keeping the file's trailing newline, so the file has 22 lines and line 22 is the new one.

The exact line to append (no leading blank line, no list marker, no heading):

`Touched by a verify run (CHORE-90).`

No frontend, backend, configuration, dependency or test change. Work item source is local (`docs/issues/CHORE-90.md`, hybrid source, no tracker row, no `feature_map.md` row); `depends_on` is empty and the item is not the scaffold item (TEST-01 is the scaffold and is done).

Assumptions (recorded here, none blocks the build):
1. "One new line" is read strictly: one line is appended and no blank separator line is added. Consequence: in rendered Markdown the line joins the final paragraph of `## Measured runs` as its last sentence. This is accepted because adding a blank line would make the change two lines, against the criterion's wording.
2. The line's wording is fixed by this plan (above) so the builder and the reviewer grade the same text. It names the item ID so a reader can trace it; it names nothing else.
3. The item says "No code, no tests". This plan honours that: no test file is created. The consequence for the framework's own coverage rule is stated in `## Testing Strategy` and is the one deliberate deviation in this plan.

## Frontend Plan
No frontend changes required.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
No API change: the item adds no endpoint and consumes none.

## Technology Selection
- No net-new component, module or dependency: the change is one appended line of Markdown in an existing file, so no stdlib call, native platform feature or installed dependency is in question.

## File Manifest
### New files
- [G] e2e/uat/scripts/CHORE-90_verify_note_uat_script.md: manual UAT script, expanded from `## Manual verification plan` (build-feature Section 14 writes it on every build)
- [G] .claude/artifacts/CHORE-90/uat_script.md: the artifact copy of the manual UAT script that build-feature Section 14 step 3 writes
- [G] e2e/uat/scenarios/CHORE-90_verify_note.feature: Gherkin scenario for the one criterion (UAT Generation is ENABLED in CLAUDE.md, so the build produces it)

### Modified files
- [Docs] docs/VALIDATION-SANDBOX.md: append exactly one line, `Touched by a verify run (CHORE-90).`, after the current last line, keeping the trailing newline

No dependency changes, so no lockfile is regenerated. `README.md` and `docs/DEVELOPMENT.md` need no edit: this item changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: none. The item states "No code, no tests", and there is no code to unit test.
  - Directory: backend/tests/unit/ (unused by this item)
  - Naming: test_{module}_unit.py (unused by this item)
- Integration tests: none. No repository, model, migration or endpoint changes (Integration Tests are ENABLED in CLAUDE.md, but no tier question is answered yes).
  - Directory: backend/tests/integration/ (unused by this item)
- E2E tests: none. The criterion involves no navigation or interaction through the UI.
  - Directory: e2e/tests/ (unused by this item)
  - File: no spec file for this item
- UAT scenarios: one scenario verifying the file's last line.
  - Directory: e2e/uat/scenarios/

Deviation, stated rather than hidden: the framework's floor is that every criterion keeps an executed test, and the item explicitly forbids tests. This plan follows the item (`user_story_alignment.md` Sections 1 and 3: the work item bounds the work). The criterion is a static property of one file's content and is verified by the manual check in `## Manual verification plan`. The `Test ids` cell below therefore names no test id. Mechanical effect: `hooks/lib/planned-tests.sh ids` reports this row as having no test id (exit 1). The push gate's non-code skip and CI's `code_changed` gate both run before the planned-test check, and this branch's whole diff is under `docs/`, `.claude/`, `e2e/uat/` Markdown and a `.feature` file, so that check is not expected to run on this item; if a reviewer or the plan-PR reviewer wants an executed check instead, the cheapest is a unit test reading the file's last line, which would be a scope change against the item's own text.

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `docs/VALIDATION-SANDBOX.md` ends with one new line that says a verify run touched it. | Manual (no executed test, per the item) | none: the item states "No code, no tests" | Verifying it needs no navigation or interaction: it is the content of one file's last line, read directly from the file |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `docs/VALIDATION-SANDBOX.md` ends with one new line that says a verify run touched it. | covered manually, see Criterion coverage; no browser spec | Given the branch feature/CHORE-90-verify-note is checked out, When I read the last line of docs/VALIDATION-SANDBOX.md, Then it reads "Touched by a verify run (CHORE-90)." and the file has exactly one more line than on main |

## Manual verification plan
### Criterion 1: `docs/VALIDATION-SANDBOX.md` ends with one new line that says a verify run touched it.
This criterion cannot be verified through the application UI: it is the content of a documentation file. The observable check is the file itself and its diff against main.
Prerequisites: a checkout of the repository on branch `feature/CHORE-90-verify-note` after the build has pushed, with `origin/main` fetched.
1. Open `docs/VALIDATION-SANDBOX.md` in an editor or on the PR's Files tab → the last line of the file reads exactly `Touched by a verify run (CHORE-90).`
2. Run `wc -l docs/VALIDATION-SANDBOX.md` from the repository root → it prints `22 docs/VALIDATION-SANDBOX.md` (main has 21 lines, so exactly one line was added and the file still ends with a newline).
3. Run `git diff origin/main -- docs/VALIDATION-SANDBOX.md` → the diff shows exactly one added line, `+Touched by a verify run (CHORE-90).`, at the end of the file, and no removed or changed lines.
4. Run `git diff --stat origin/main` → apart from `docs/VALIDATION-SANDBOX.md`, `docs/issues/CHORE-90.md` and the files under `.claude/artifacts/CHORE-90/` and `e2e/uat/`, no file is listed (no code and no test was added).
