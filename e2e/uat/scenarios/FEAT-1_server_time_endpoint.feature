Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current UTC time so a client can detect
  clock skew against the API.

  Background:
    Given the backend is running and reachable at http://localhost:8010

  Scenario: Criterion 1 - the endpoint returns now and timezone
    When I request GET /api/time
    Then the status is 200
    And the content type is application/json
    And the body has exactly the keys "now" and "timezone"
    And "timezone" equals "UTC"

  Scenario: Criterion 2 - now is computed per request in UTC with an explicit offset
    When I request GET /api/time
    And I wait one second
    And I request GET /api/time again
    Then the two "now" values differ
    And the second "now" is later than the first
    And each "now" ends with "+00:00"
    And each "now" is not naive and does not end with "Z"

  Scenario: Criterion 3 - the body is defined by a Pydantic schema
    Given the backend source code
    When I open backend/app/schemas/server_time.py
    Then ServerTimeResponse defines "now" and "timezone"
    And backend/app/routers/server_time.py declares response_model=ServerTimeResponse

  Scenario: Criterion 4 - unit and integration tests cover shape, offset and freshness
    Given the backend test suite
    When I run the server-time unit tests in backend/tests/unit/test_server_time_unit.py and backend/tests/unit/test_main_unit.py
    And I run the server-time integration tests in backend/tests/integration/test_server_time_integration.py
    Then the output reports 0 failed

  Scenario: Edge case - a non-GET method is rejected
    When I request POST /api/time
    Then the status is 405
