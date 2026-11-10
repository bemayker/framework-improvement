Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current UTC time so a client can detect
  clock skew against the API.

  Background:
    Given the backend is running at "http://localhost:8010"

  Scenario: AC1 - the endpoint returns 200 with now and timezone
    When a client sends GET /api/time
    Then the status is 200
    And the content type is "application/json"
    And the body has exactly the keys "now" and "timezone"
    And "timezone" equals "UTC"

  Scenario: AC2 - now is computed per request, in UTC, with an explicit offset
    When a client calls GET /api/time twice, a second apart
    Then the two "now" values differ
    And the second "now" is about one second later than the first
    And both "now" values end with "+00:00"
    And neither "now" value ends with "Z" or lacks an offset

  Scenario: AC3 - the response body is defined by a Pydantic schema
    Given the API docs at "http://localhost:8010/docs"
    When the reader opens GET /api/time
    Then its 200 response schema is named "ServerTimeResponse"
    And the schema is defined in "backend/app/schemas/server_time.py"
    And the router declares response_model "ServerTimeResponse" and returns no bare dict

  Scenario: AC4 - the unit and integration tests cover shape, offset and freshness
    When the tests in "backend/tests/unit/test_server_time_unit.py", "backend/tests/integration/test_server_time_integration.py" and "backend/tests/unit/test_main_unit.py" run
    Then 0 failed
    And each server time test file has a test for the shape, one for the exact "+00:00" suffix and one for per-request freshness

  Scenario: Edge case - a write method on /api/time is rejected
    When a client sends POST /api/time
    Then the status is 405
