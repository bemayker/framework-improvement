Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current UTC time so a client can detect clock skew.
  There is no UI; scenarios are phrased against the HTTP response.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  Scenario: Criterion 1 - the endpoint returns 200 with now and timezone
    When a client sends GET /api/time
    Then the response status is 200
    And the response content type is "application/json"
    And the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"

  Scenario: Criterion 2 - now is per request, UTC, with an explicit offset
    When a client sends GET /api/time
    And the client waits one second
    And the client sends GET /api/time again
    Then both "now" values end in "+00:00"
    And the second "now" is about one second later than the first
    And the two "now" values are not identical
    And each "now" parses as a timezone-aware datetime with a zero UTC offset

  Scenario: Criterion 3 - the body is defined by the ServerTimeResponse schema
    When the OpenAPI document at "/openapi.json" is fetched
    Then the 200 response of GET /api/time references the "ServerTimeResponse" schema

  Scenario: Criterion 4 - the unit and integration tests cover shape, offset and freshness
    When the FEAT-1 test files are run:
      | backend/tests/unit/test_server_time_service_unit.py     |
      | backend/tests/unit/test_server_time_schema_unit.py      |
      | backend/tests/unit/test_main_unit.py                    |
      | backend/tests/integration/test_server_time_integration.py |
    Then the summary reports 0 failed

  Scenario: Edge case - the endpoint is read-only
    When a client sends POST /api/time
    Then the response status is 405

  Scenario: Edge case - the endpoint answers with no database configured
    Given the backend is started with DATABASE_URL unset
    When a client sends GET /api/time
    Then the response status is 200
    And the body has exactly the keys "now" and "timezone"
