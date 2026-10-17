Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current time as an ISO 8601 UTC
  timestamp with an explicit +00:00 offset, so a client can detect clock skew.

  Background:
    Given the backend is running and answers on its API base URL

  Scenario: Criterion 1 - GET /api/time returns 200 with now and timezone
    When a client sends GET /api/time
    Then the response status is 200
    And the response content type is application/json
    And the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"
    And "now" is an ISO 8601 date-time string ending in "+00:00"

  Scenario: Criterion 2 - now is computed per request and always UTC with an explicit offset
    When a client sends GET /api/time
    And the client waits one second
    And the client sends GET /api/time again
    Then the two "now" values differ
    And the second "now" is at least one second later than the first
    And both "now" values end in "+00:00"
    And neither "now" value ends in "Z"
    And neither "now" value is a naive timestamp without an offset

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    Given the published OpenAPI document of the backend
    When a reader inspects GET /api/time
    Then its 200 response references the "ServerTimeResponse" schema
    And "now" is a string with format "date-time"
    And "now" and "timezone" are both required

  Scenario: Criterion 4 - unit and integration tests cover shape, offset and freshness
    Given the backend test suite
    When the FEAT-1 test files run: backend/tests/unit/test_server_time_schema_unit.py, backend/tests/unit/test_server_time_router_unit.py, backend/tests/unit/test_main_unit.py and backend/tests/integration/test_server_time_integration.py
    Then the summary reports 0 failed

  Scenario: Edge case - a non-GET method on /api/time is rejected
    When a client sends POST /api/time
    Then the response status is 405
