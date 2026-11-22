# Implementation Plan, CHORE-91: VERIFY MDF-365: add a one-line note to docs/VALIDATION-SANDBOX.md (docs only)

## Feature
> Docs only. Append one line to `docs/VALIDATION-SANDBOX.md` saying that the file was touched by a verify run. No code, no tests.

## Acceptance Criteria
- [ ] `docs/VALIDATION-SANDBOX.md` ends with one new line that says a verify run touched it.

## Plan Overview
A documentation-only change to one existing file. No frontend, backend, API, database, dependency or test-infrastructure change.

`docs/VALIDATION-SANDBOX.md` currently has 21 lines and ends with a trailing newline after `... where the answer will be.` The build appends exactly one line, so the file has 22 lines and still ends with a trailing newline. The line's text is fixed here so the build has nothing to choose:

`This file was touched by a verify run (CHORE-91).`

Assumptions, recorded because the item does not settle them:
1. "One new line" is read literally: one appended line of text, with no blank separator line before it. Markdown renders it as the last sentence of the preceding paragraph; the criterion is about the file's text, not its rendering, so that is accepted rather than adding a second line.
2. "No code, no tests" is honoured: this plan adds no unit, integration or E2E test. That conflicts with the framework floor that every criterion is covered by an executed test (see `## Testing Strategy` and the push-gate consequence stated there). The item's explicit instruction wins here because it is a verify item whose title marks it docs only; the plan PR reviewer decides whether to keep that or to add one unit test (the alternative is spelled out under `### Criterion coverage`).
3. The build's mandated UAT artifacts (manual script, its artifact copy, and the Gherkin scenarios since UAT Generation is ENABLED) are listed in the manifest because build-feature produces them regardless of this item's "no tests" line.

## Frontend Plan
No frontend changes required.

## Backend Plan
No backend changes required.

## API Integration Plan
No external API integration.

## API Contract
No API change: this item adds, removes and modifies no endpoint.

## Technology Selection
- This item introduces no net-new component, module or dependency: it appends one line of text to an existing Markdown file.

## File Manifest
### New files
- [G] e2e/uat/scripts/CHORE-91_verify-note_uat_script.md: manual UAT script expanded from `## Manual verification plan` (build-feature Section 14, always written)
- [G] .claude/artifacts/CHORE-91/uat_script.md: the artifact copy of the manual UAT script (build-feature Section 14 step 3, always written)
- [G] e2e/uat/scenarios/CHORE-91_verify-note.feature: Gherkin scenario for the one criterion (UAT Generation is ENABLED)

### Modified files
- [Docs] docs/VALIDATION-SANDBOX.md: append the single line `This file was touched by a verify run (CHORE-91).` as line 22, keeping the trailing newline

No dependency manifest changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the item changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
- Unit tests: none. The item adds no business logic and explicitly asks for no tests.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: none. No repository, model, migration or endpoint changes (tier enabled in CLAUDE.md, not warranted here).
  - Directory: backend/tests/integration/
- E2E tests: none. The criterion involves no navigation or interaction through the UI (tier enabled in CLAUDE.md, not warranted here).
  - Directory: e2e/tests/
  - File: not created
- UAT scenarios: one scenario stating that the file's last line is the verify note, plus the manual script.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Test ids | Why not E2E |
|---|---|---|---|---|
| 1 | `docs/VALIDATION-SANDBOX.md` ends with one new line that says a verify run touched it. | Manual check (no executable tier, per the item's "no tests") | none: the item forbids tests | Verifying it needs no navigation or interaction: it is the content of a file in the repository. The cheaper executable tier would be one unit test, which the item excludes. |

Consequence the reviewer must weigh before approving: `hooks/test-gate.sh` skips a push whose every path is under `docs/`, `.claude/`, `.github/` or ends in `.md`, and that skip runs before its planned-test-id check. The Gherkin file `e2e/uat/scenarios/CHORE-91_verify-note.feature` is none of those, so the build's push is not docs-only, the planned-test-id check runs, and a row with no test id blocks the push. Two ways out, decided on the plan PR, not by the build:
1. Keep the item as written, and treat the blocked push as a framework finding for MDF-365's verify (the floor and a docs-only item have no shape that satisfies both).
2. Add one unit test, `test_validation_sandbox_doc_ends_with_verify_note` in `backend/tests/unit/test_validation_sandbox_doc_unit.py`, tagged `[B]` with a Backend Plan entry, which reads the file and asserts its last line; this contradicts the item's "no tests".

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | `docs/VALIDATION-SANDBOX.md` ends with one new line that says a verify run touched it. | covered by a manual check, see Criterion coverage | Given the repository at the branch head, When a reader opens `docs/VALIDATION-SANDBOX.md`, Then its last line is `This file was touched by a verify run (CHORE-91).` and the line before it is `... where the answer will be.` |

## Manual verification plan
### Criterion 1: `docs/VALIDATION-SANDBOX.md` ends with one new line that says a verify run touched it.
This criterion cannot be verified through the application UI: it is the content of a repository file. The observable check is the file itself, on the PR's "Files changed" tab or in a local checkout.
Prerequisites: the `feature/CHORE-91-verify-note` branch checked out, or its PR open in the browser.
1. Open the PR's "Files changed" tab and find `docs/VALIDATION-SANDBOX.md` → exactly one added line and no removed line in that file.
2. Read the added line → it reads `This file was touched by a verify run (CHORE-91).`
3. In a local checkout, run `tail -n 2 docs/VALIDATION-SANDBOX.md` from the repository root → the first printed line ends with `where the answer will be.` and the second is `This file was touched by a verify run (CHORE-91).`
4. Run `wc -l docs/VALIDATION-SANDBOX.md` → it prints `22`, one more than the 21 lines on `main` at `749e9626`.
5. Confirm no other file outside `e2e/uat/` and `.claude/artifacts/CHORE-91/` appears in the PR's "Files changed" tab → no code or test file was added.
