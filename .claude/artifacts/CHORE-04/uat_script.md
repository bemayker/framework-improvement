# UAT Script: CHORE-04 TEST-14 follow-up: known-improvements

This item has no UI. Every criterion is verified by an observable command from the repository root of the CHORE-04 checkout.

## Prerequisites

- A checkout of branch `feature/CHORE-04-test-14-follow-up`, terminal at the repository root.
- `origin/main` fetched (`git fetch origin main`).
- For criterion 3: Docker running and the test database available per `CLAUDE.md` Backing Services.

## Criterion 1: docstring paragraph re-wrapped to at most 79 characters, wording unchanged

| # | Step | Expected result | Result |
|---|------|-----------------|--------|
| 1 | Run `awk 'NR<=7 && length > 79' backend/app/repositories/note_repository.py` | No output (no docstring line, lines 1 to 7, exceeds 79 characters). Lines 26, 40 and 47 are pre-existing code lines outside the docstring and are deliberately out of scope | [ ] Pass [ ] Fail |
| 2 | Open `backend/app/repositories/note_repository.py` and read lines 1 to 7 | Line 1 is `"""Data access for notes (TEST-03).`, line 2 is blank, lines 3 to 6 read `Raw parameterized SQL via psycopg: one table with an insert, two selects (list` / `and get by id) and a delete needs neither an ORM nor a query builder. The` / `connection is supplied by the caller (the `get_connection` dependency in` / `app/core/db.py), so the repository owns no transaction boundary of its own.`, line 7 is the closing `"""` | [ ] Pass [ ] Fail |
| 3 | Run `git diff --word-diff=porcelain origin/main -- backend/app/repositories/note_repository.py` | Apart from the `---` and `+++` file headers, no line starts with `+` or `-` followed by a word: only line-break changes, the words are identical | [ ] Pass [ ] Fail |

## Criterion 2: no behaviour change

| # | Step | Expected result | Result |
|---|------|-----------------|--------|
| 4 | Run `git diff -w --stat origin/main -- backend/` | Only `backend/app/repositories/note_repository.py` is listed | [ ] Pass [ ] Fail |
| 5 | Run `git diff origin/main -- backend/app/repositories/note_repository.py` | Every changed line lies between the opening `"""` on line 1 and the closing `"""` on line 7; the four `*_NOTE_SQL` constants and `class NoteRepository` do not appear as changed lines | [ ] Pass [ ] Fail |

## Criterion 3: backend suite still passes

| # | Step | Expected result | Result |
|---|------|-----------------|--------|
| 6 | Run `uv run --directory backend pytest -q tests/unit/test_note_service_unit.py tests/integration/test_notes_integration.py` | `0 failed` | [ ] Pass [ ] Fail |
| 7 | Run the full gate `uv run --directory backend pytest -q` | `0 failed` | [ ] Pass [ ] Fail |

## Summary

| Criterion | Steps | Pass | Fail |
|-----------|-------|------|------|
| 1. Docstring re-wrapped, wording unchanged | 1-3 | | |
| 2. No behaviour change | 4-5 | | |
| 3. Backend suite still passes | 6-7 | | |

Tester: ______________  Date: ______________  Overall: [ ] Pass [ ] Fail
