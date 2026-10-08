Feature: TEST-15 Count notes
  As a caller of the Task Notes API
  I want GET /api/notes/count to report how many notes are stored
  So that I can know the number of notes without fetching the whole list

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: An empty notes table counts 0 (AC1)
    Given no notes are stored
    When a client sends a GET request to "/api/notes/count"
    Then the response status code is 200
    And the response body is {"count": 0}

  Scenario: The count follows creates and deletes (AC2)
    Given no notes are stored
    And a note "Buy milk" was created with "POST /api/notes" and received the id N
    And a note "Walk dog" was created with "POST /api/notes"
    When a client sends a GET request to "/api/notes/count"
    Then the response status code is 200
    And the response body is {"count": 2}
    When a client sends a DELETE request to "/api/notes/N"
    And a client sends a GET request to "/api/notes/count"
    Then the response body is {"count": 1}

  Scenario: The count route does not shadow GET /api/notes/{id} (AC3)
    Given a note "Buy milk" was created with "POST /api/notes" and received the id N
    When a client sends a GET request to "/api/notes/count"
    Then the response status code is 200
    And the response body has a "count" field and is not a 422 error
    When a client sends a GET request to "/api/notes/N"
    Then the response status code is 200
    And the response body is {"id": N, "text": "Buy milk"}

  Scenario: The full backend test suite passes with the new tests included (AC3)
    Given the branch "feature/TEST-15-count-notes" is checked out and a PostgreSQL database is reachable
    When the command "uv run --directory backend pytest -q" is run
    Then the summary reports 0 failed
    And the run includes the tests in "backend/tests/unit/test_note_service_unit.py" and "backend/tests/integration/test_notes_integration.py"

  Scenario: A failed delete of a missing id leaves the count unchanged (edge case)
    Given a note "Buy milk" was created with "POST /api/notes"
    And a GET request to "/api/notes/count" answers {"count": 1}
    When a client sends a DELETE request to "/api/notes/999999"
    Then the response status code is 404
    And a GET request to "/api/notes/count" still answers {"count": 1}
