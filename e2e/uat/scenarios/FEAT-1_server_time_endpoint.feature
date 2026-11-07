Feature: FEAT-1 Server time endpoint
  As an API client
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API

  Background:
    Given the stack is running with the backend on http://localhost:8010

  Scenario: Criterion 1 - GET /api/time returns 200 with now and timezone
    When I send GET /api/time
    Then the status is 200
    And the content type is application/json
    And the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"

  Scenario: Criterion 2 - now is computed per request
    When I send GET /api/time
    And I wait one second
    And I send GET /api/time again
    Then the two "now" values differ
    And the second "now" is later than the first

  Scenario: Criterion 2 - now is UTC with an explicit offset
    When I send GET /api/time
    Then "now" ends with "+00:00"
    And "now" does not end with "Z"
    And "now" parses as an aware ISO 8601 datetime with a zero UTC offset

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    When I open /openapi.json
    Then the 200 response of GET /api/time references the "ServerTimeResponse" schema
    And the schema is defined in backend/app/schemas/server_time.py

  Scenario: Criterion 4 - unit and integration tests cover shape, offset and freshness
    When I run "uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py"
    Then the run reports 0 failed

  Scenario: Edge case - POST to /api/time is not allowed
    When I send POST /api/time
    Then the status is 405
