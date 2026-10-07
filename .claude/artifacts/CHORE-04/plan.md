# Implementation Plan, CHORE-04: TEST-14 follow-up: known-improvements

## Feature
> - OPTIONAL (self-review): `backend/app/repositories/note_repository.py:4`, the docstring edit left one line far longer than its neighbours: "(list and get by id) and a delete needs neither an ORM nor a query builder. The connection is supplied by the". Fix: re-wrap the paragraph at lines 3 to 6 to the original width. This is cosmetic only.
> Source pull request: #119.

## Acceptance Criteria
- [ ] 1. The module docstring paragraph of `backend/app/repositories/note_repository.py` (currently lines 3 to 6) is re-wrapped so no line exceeds 79 characters, with the wording unchanged word for word.
- [ ] 2. No behaviour change: the edit touches the module docstring only, and no SQL constant, import, class or method changes.
- [ ] 3. The backend test suite still passes (`0 failed`).

Assumption (recorded per `user_story_alignment.md` Section 4, autonomous mode): the item states no acceptance criteria beyond its body, so the three above are derived as the minimal set. "The original width" is read as the width of the neighbouring docstring lines (72 to 77 characters; the file before TEST-14 already carried one 96-character line, so its literal width is not a usable target). The target is therefore at most 79 characters per line, the PEP 8 limit, which every neighbouring line already satisfies. The repository has no `line-length` setting in `backend/pyproject.toml`, so nothing project-specific overrides 79.

## Re-Plan Feedback (if applicable)
None. Tracker comments: 0 read. No PR review comments (fresh plan, no plan PR in autonomous mode). No `[merged-since]` lines: the branch is cut from current main ae1bbd8.

## Plan Overview
One backend file, one docstring paragraph. Replace lines 3 to 6 of `backend/app/repositories/note_repository.py` with the same words wrapped at 79 columns. The exact target text, produced by a 79-column greedy wrap of the current paragraph, is these four lines (line lengths 78, 73, 72, 75):

    Raw parameterized SQL via psycopg: one table with an insert, two selects (list
    and get by id) and a delete needs neither an ORM nor a query builder. The
    connection is supplied by the caller (the `get_connection` dependency in
    app/core/db.py), so the repository owns no transaction boundary of its own.

Line 1 (`"""Data access for notes (TEST-03).`), line 2 (blank) and the closing `"""` stay as they are. Nothing below the docstring changes. No frontend, no API, no migration, no dependency.

## Frontend Plan
No frontend changes required.
- Design reference notes: AI freestyle (Design Reference mode NONE; this item has no UI)

## Backend Plan
- Endpoints: none added or changed.
- Service layer: no change.
- Repository layer: docstring-only edit of `backend/app/repositories/note_repository.py` lines 3 to 6, re-wrapped to the text in Plan Overview. `INSERT_NOTE_SQL`, `LIST_NOTES_SQL`, `GET_NOTE_SQL`, `DELETE_NOTE_SQL` and `NoteRepository` are untouched.
- Migrations: none.

## API Integration Plan
No external API integration.

## API Contract
No API change. Existing note endpoints keep their current contract.

## Technology Selection
- No net-new component, module or dependency: the change re-wraps an existing docstring, so no rung of the ladder applies.

## File Manifest
### New files
- [G] e2e/uat/scenarios/CHORE-04_test_14_follow_up.feature: Gherkin scenarios for the three criteria (UAT Generation ENABLED), naming as the earlier CHORE items
- [G] e2e/uat/scripts/CHORE-04_test_14_follow_up_uat_script.md: manual UAT script expanded from the Manual verification plan below
- [G] .claude/artifacts/CHORE-04/uat_script.md: copy of the manual UAT script (build-feature Section 14 step 3)

### Modified files
- [B] backend/app/repositories/note_repository.py: re-wrap the module docstring paragraph (lines 3 to 6) to at most 79 characters per line, wording unchanged

No dependency changes, so no lockfile is regenerated. Neither `README.md` nor `docs/DEVELOPMENT.md` needs an edit: the item changes no project structure, run configuration, dependency or test infrastructure.

## Testing Strategy
No new tests are written. Per `testing_standards.md` Section 6: no business logic changes (unit question: no new unit tests), repository code changes only in a docstring that carries no behaviour (integration question: the existing repository and router integration tests already exercise this module and are the regression guard), and there is no user-facing navigation or interaction (E2E question: no). A test asserting docstring layout would be gold plating (`user_story_alignment.md` Section 3).
- Unit tests: none new. Existing `backend/tests/unit/test_note_service_unit.py` runs unchanged.
  - Directory: backend/tests/unit/
  - Naming: test_{module}_unit.py
- Integration tests: none new. Existing `backend/tests/integration/test_notes_integration.py` imports and exercises `NoteRepository` against a real PostgreSQL and is the behaviour-preservation check.
  - Directory: backend/tests/integration/
- E2E tests: none. No criterion requires navigation or interaction through the UI, so no spec file is produced.
  - Directory: e2e/tests/
  - File: n/a, no spec warranted
- UAT scenarios: one scenario per criterion plus one edge-case scenario (no line over 79 characters anywhere in the docstring, including the unchanged first line), validated for well-formedness only.
  - Directory: e2e/uat/scenarios/

### Criterion coverage
| # | Acceptance Criterion | Covering tier | Why not E2E |
|---|---|---|---|
| 1 | Docstring paragraph re-wrapped to at most 79 characters, wording unchanged | Unit (existing suite imports the module, proving the docstring still parses) plus the static line-length check in the Manual verification plan | Verifying it needs no navigation or interaction: it is source layout, checked by reading the file; a dedicated layout test would be gold plating |
| 2 | No behaviour change | Integration (existing `test_notes_integration.py`) | Verifying it needs no navigation or interaction: it is repository behaviour, already covered by the existing round-trip tests |
| 3 | Backend suite still passes | Integration and Unit (whole backend suite, `0 failed`) | Verifying it needs no navigation or interaction: it is the suite result itself |

## Acceptance Test Outline
| # | Acceptance Criterion | E2E Strategy | UAT Scenario Sketch |
|---|---|---|---|
| 1 | Docstring re-wrapped, wording unchanged | covered at Unit, see Criterion coverage | Given the CHORE-04 branch, When I list lines of note_repository.py longer than 79 characters, Then none are listed, And the docstring words equal those on main |
| 2 | No behaviour change | covered at Integration, see Criterion coverage | Given the CHORE-04 branch, When I diff note_repository.py against main ignoring whitespace, Then only docstring lines differ |
| 3 | Backend suite still passes | covered at Integration, see Criterion coverage | Given a running test database, When I run the backend suite, Then it reports 0 failed |

## Manual verification plan
This item has no UI, so every criterion is verified by an observable check from the repository root of the CHORE-04 checkout instead of a click path.

### Criterion 1: Docstring paragraph re-wrapped to at most 79 characters, wording unchanged
Prerequisites: the CHORE-04 branch is checked out; a terminal at the repository root.
1. Run `awk 'length > 79 { print FILENAME ":" NR ": " length }' backend/app/repositories/note_repository.py` → no output (no line exceeds 79 characters).
2. Open `backend/app/repositories/note_repository.py` and read lines 1 to 8 → line 1 is `"""Data access for notes (TEST-03).`, line 2 is blank, lines 3 to 6 are exactly the four lines in the plan's Plan Overview, line 7 is the closing `"""`.
3. Run `git diff --word-diff=porcelain origin/main -- backend/app/repositories/note_repository.py` → no line starts with `+` or `-` followed by a word (only line-break changes); the words are identical.

### Criterion 2: No behaviour change
Prerequisites: as Criterion 1.
1. Run `git diff -w --stat origin/main -- backend/` → only `backend/app/repositories/note_repository.py` is listed.
2. Run `git diff origin/main -- backend/app/repositories/note_repository.py` → every changed line lies between the opening `"""` on line 1 and the closing `"""`; the four `*_NOTE_SQL` constants and `class NoteRepository` do not appear as changed lines.

### Criterion 3: Backend suite still passes
Prerequisites: Docker is running and the test database is available per `CLAUDE.md` → Backing Services.
1. Run `uv run --directory backend pytest -q backend/tests/unit/test_note_service_unit.py backend/tests/integration/test_notes_integration.py` (paths as the runner resolves them from `backend/`: `tests/unit/test_note_service_unit.py tests/integration/test_notes_integration.py`) → `0 failed`.
2. Run the full gate `uv run --directory backend pytest -q` → `0 failed`.
