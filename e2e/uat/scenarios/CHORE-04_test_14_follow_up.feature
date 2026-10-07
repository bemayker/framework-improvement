Feature: CHORE-04 TEST-14 follow-up: known-improvements
  As a maintainer of the Task Notes app
  I want the note repository's module docstring re-wrapped to at most 79 characters per line
  So that the docstring reads consistently, with no behaviour change

  Background:
    Given the CHORE-04 branch is checked out
    And a terminal is open at the repository root

  Scenario: The docstring is re-wrapped and the wording is unchanged (criterion 1)
    When I run "awk 'NR<=7 && length > 79' backend/app/repositories/note_repository.py"
    Then no line is printed
    And lines 3 to 6 of "backend/app/repositories/note_repository.py" read:
      """
      Raw parameterized SQL via psycopg: one table with an insert, two selects (list
      and get by id) and a delete needs neither an ORM nor a query builder. The
      connection is supplied by the caller (the `get_connection` dependency in
      app/core/db.py), so the repository owns no transaction boundary of its own.
      """
    And "git diff --word-diff=porcelain origin/main -- backend/app/repositories/note_repository.py" shows no added or removed words, only line-break changes

  Scenario: No behaviour change, only the docstring differs (criterion 2)
    When I run "git diff -w --stat origin/main -- backend/"
    Then only "backend/app/repositories/note_repository.py" is listed
    And every changed line in "git diff origin/main -- backend/app/repositories/note_repository.py" lies between the opening and closing triple quotes of the module docstring
    And the "INSERT_NOTE_SQL", "LIST_NOTES_SQL", "GET_NOTE_SQL" and "DELETE_NOTE_SQL" constants and "class NoteRepository" are not changed lines

  Scenario: The backend test suite still passes (criterion 3)
    Given Docker is running and the test database is available per CLAUDE.md Backing Services
    When I run "uv run --directory backend pytest -q tests/unit/test_note_service_unit.py tests/integration/test_notes_integration.py"
    Then it reports 0 failed
    And running "uv run --directory backend pytest -q" also reports 0 failed

  Scenario: No docstring line is over 79 characters, including the unchanged first line (edge case)
    When I run "awk 'NR<=7 && length > 79' backend/app/repositories/note_repository.py"
    Then no line is printed
    And line 1 is still '"""Data access for notes (TEST-03).', line 2 is blank and line 7 is the closing '"""'
