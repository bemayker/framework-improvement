Feature: TEST-14 Delete a note by id
  As a caller of the Task Notes API
  I want DELETE /api/notes/{id} to remove one stored note
  So that I can discard a single note without touching the others

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: Deleting a stored note returns 204 and it leaves the list (AC1)
    Given a note "Buy milk" was created with "POST /api/notes" and received the id N
    And a note "Walk dog" was created with "POST /api/notes"
    When a client sends a DELETE request to "/api/notes/N"
    Then the response status code is 204
    And the response body is empty
    And a GET request to "/api/notes" lists "Walk dog"
    And a GET request to "/api/notes" does not list a note with the id N

  Scenario: Deleting an id that does not exist returns 404 (AC2)
    Given no note has the id 999999
    When a client sends a DELETE request to "/api/notes/999999"
    Then the response status code is 404
    And the response body is {"detail": "Note not found"}

  Scenario: The full backend test suite passes with the new tests included (AC3)
    Given the branch "feature/TEST-14-delete-note-by-id" is checked out and a PostgreSQL database is reachable
    When the command "uv run --directory backend pytest -q" is run
    Then the summary reports 0 failed
    And the run includes the tests in "backend/tests/unit/test_note_service_unit.py" and "backend/tests/integration/test_notes_integration.py"

  Scenario: Deleting the same note twice answers 404 the second time (edge case)
    Given a note "Buy milk" was created with "POST /api/notes" and received the id N
    When a client sends a DELETE request to "/api/notes/N"
    Then the response status code is 204
    When a client sends a DELETE request to "/api/notes/N" again
    Then the response status code is 404
    And the response body is {"detail": "Note not found"}

  Scenario: An integer id above the BIGINT range answers 404, not 500 (edge case)
    Given the backend is running
    When a client sends a DELETE request to "/api/notes/99999999999999999999"
    Then the response status code is 404
    And the response body is {"detail": "Note not found"}
    And the response is not a 500 error
