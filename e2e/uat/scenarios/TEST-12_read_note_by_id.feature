Feature: TEST-12 Read one note by id
  As a caller of the Task Notes API
  I want GET /api/notes/{id} to return one stored note
  So that I can read a single note without listing all of them

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A stored note is returned with status 200 (AC1)
    Given a note "Buy milk" was created with "POST /api/notes" and received the id N
    When a client sends a GET request to "/api/notes/N"
    Then the response status code is 200
    And the response body is {"id": N, "text": "Buy milk"}

  Scenario: An id that does not exist returns 404 (AC2)
    Given no note has the id 999999
    When a client sends a GET request to "/api/notes/999999"
    Then the response status code is 404
    And the response body is {"detail": "Note not found"}

  Scenario: A non-integer id returns 422 (AC3)
    Given the backend is running
    When a client sends a GET request to "/api/notes/abc"
    Then the response status code is 422
    And the response body "detail" names the path parameter "note_id" in its "loc"
    And the response is neither a 404 nor a 500 error

  Scenario: The full backend test suite passes with the new tests included (AC4)
    Given the branch "feature/TEST-12-read-note-by-id" is checked out and a PostgreSQL database is reachable
    When the command "uv run --directory backend pytest -q" is run
    Then the summary reports 0 failed
    And the run includes the tests in "backend/tests/unit/test_note_service_unit.py" and "backend/tests/integration/test_notes_integration.py"

  Scenario: An integer id above the BIGINT range answers 404, not 500 (edge case)
    Given the backend is running
    When a client sends a GET request to "/api/notes/99999999999999999999"
    Then the response status code is 404
    And the response body is {"detail": "Note not found"}
    And the response is not a 500 error

  Scenario: Zero and a decimal id are handled as miss and validation error respectively (edge case)
    Given the backend is running
    When a client sends a GET request to "/api/notes/0"
    Then the response status code is 404
    When a client sends a GET request to "/api/notes/1.5"
    Then the response status code is 422
