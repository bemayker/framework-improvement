Feature: FEAT-2 Notes total length endpoint
  As a caller of the Task Notes API
  I want GET /api/notes/total-length to report the summed character length of all stored notes
  So that I can know how much text is stored without fetching the whole list

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: An empty notes table has a total length of 0 (AC1)
    Given no notes are stored
    When a client sends a GET request to "/api/notes/total-length"
    Then the response status code is 200
    And the response body is {"total_length": 0}

  Scenario: The total length sums the text of every note (AC2)
    Given no notes are stored
    And a note "ab" was created with "POST /api/notes"
    And a note "cde" was created with "POST /api/notes" and received the id N
    When a client sends a GET request to "/api/notes/total-length"
    Then the response status code is 200
    And the response body is {"total_length": 5}
    When a client sends a DELETE request to "/api/notes/N"
    And a client sends a GET request to "/api/notes/total-length"
    Then the response body is {"total_length": 2}

  Scenario: The total-length route does not shadow GET /api/notes/{id} (AC3)
    Given a note "ab" was created with "POST /api/notes" and received the id N
    When a client sends a GET request to "/api/notes/total-length"
    Then the response status code is 200
    And the response body has a "total_length" field and is not a 422 error
    When a client sends a GET request to "/api/notes/N"
    Then the response status code is 200
    And the response body is {"id": N, "text": "ab"}

  Scenario: The full backend test suite passes with the new tests included (AC3)
    Given the branch "feature/FEAT-2-notes-total-length-endpoint" is checked out and a PostgreSQL database is reachable
    When the command "uv run --directory backend pytest -q" is run
    Then the summary reports 0 failed
    And the run includes the tests in "backend/tests/unit/test_note_service_unit.py" and "backend/tests/integration/test_notes_integration.py"

  Scenario: Characters are counted, not bytes (edge case)
    Given no notes are stored
    And a note "café" was created with "POST /api/notes"
    When a client sends a GET request to "/api/notes/total-length"
    Then the response status code is 200
    And the response body is {"total_length": 4}
