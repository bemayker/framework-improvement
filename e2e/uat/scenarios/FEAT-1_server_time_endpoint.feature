Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current UTC time so a client can detect
  clock skew against the API.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  Scenario: Criterion 1 - the endpoint returns the time as ISO 8601 UTC with timezone UTC
    When a client sends GET "/api/time"
    Then the response status is 200
    And the response content type is "application/json"
    And the body has exactly the fields "now" and "timezone"
    And "timezone" is the string "UTC"
    And "now" is an ISO 8601 timestamp ending in "+00:00"

  Scenario: Criterion 2 - now is computed per request
    When a client sends GET "/api/time" and notes "now"
    And the client waits at least one second
    And the client sends GET "/api/time" again and notes "now"
    Then the two "now" values differ
    And the second "now" is later than the first
    And both "now" values end in "+00:00"

  Scenario: Criterion 2 - now is never naive and never uses Z
    When a client sends GET "/api/time"
    Then "now" carries the explicit offset "+00:00"
    And "now" does not end in "Z"

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    Given the API documentation is open at "http://localhost:8010/docs"
    When the "GET /api/time" operation is expanded
    Then its 200 response schema is "ServerTimeResponse"
    And the schema has the fields "now" and "timezone"

  Scenario: Criterion 4 - the unit and integration tests pass
    When the tests in "backend/tests/unit/test_server_time_unit.py", "backend/tests/unit/test_main_unit.py" and "backend/tests/integration/test_server_time_integration.py" are run
    Then 0 tests fail

  Scenario: Edge case - a non-GET method is rejected
    When a client sends POST "/api/time"
    Then the response status is 405
