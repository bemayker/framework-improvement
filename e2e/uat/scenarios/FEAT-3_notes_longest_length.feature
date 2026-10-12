Feature: FEAT-3 Notes longest body length endpoint
  GET /api/notes/longest-length returns the character length of the longest
  stored note text, or 0 when no notes exist. The feature is backend only, so
  every scenario is phrased as an API call and no data-testid is involved.

  Background:
    Given the stack is running and the backend answers at "http://localhost:8010"

  Scenario: AC1 No notes stored gives a max_length of 0
    Given no notes are stored
    When I GET "/api/notes/longest-length"
    Then the status is 200
    And the JSON body is {"max_length": 0}

  Scenario: AC2 Notes "ab" and "cde" give a max_length of 3
    Given no notes are stored
    And I created a note with text "ab"
    And I created a note with text "cde"
    When I GET "/api/notes/longest-length"
    Then the status is 200
    And the JSON body is {"max_length": 3}

  Scenario: AC3 The new route does not shadow GET /api/notes/{id}
    Given no notes are stored
    And I created a note with text "cde"
    When I GET "/api/notes/longest-length"
    Then the status is 200
    And the JSON body is {"max_length": 3}
    When I GET "/api/notes/" followed by the id of the created note
    Then the status is 200
    And the JSON body has the created note's id and the text "cde"
    When I GET "/api/notes/abc"
    Then the status is 422
    And the error detail names the path parameter "note_id"

  Scenario: AC3 The backend test suite passes with the new tests included
    When I run "uv run --directory backend pytest tests/unit/test_note_service_unit.py tests/integration/test_notes_integration.py -q" with a reachable PostgreSQL
    Then pytest reports 0 failed

  Scenario: Edge case, length counts characters and not bytes
    Given no notes are stored
    And I created a note with text "éé"
    And I created a note with text "abc"
    When I GET "/api/notes/longest-length"
    Then the status is 200
    And the JSON body is {"max_length": 3}
