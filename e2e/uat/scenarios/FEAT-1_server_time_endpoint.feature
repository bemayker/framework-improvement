Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current UTC time so a client can detect clock skew.
  Verified by HTTP request against the backend, not through a UI: no screen consumes this endpoint.

  Background:
    Given the backend is running at "http://localhost:8010"

  Scenario: Criterion 1, the endpoint returns 200 with now and timezone
    When a client sends GET /api/time
    Then the status is 200
    And the content type is "application/json"
    And the body has exactly the keys "now" and "timezone"
    And "timezone" equals "UTC"

  Scenario: Criterion 2, now is computed per request in UTC with an explicit offset
    When a client sends GET /api/time
    And the client waits one second
    And the client sends GET /api/time again
    Then both "now" values end in "+00:00"
    And neither "now" value is naive
    And the second "now" is later than the first
    And the second "now" matches the current UTC time to within a few seconds

  Scenario: Criterion 3, the response body is defined by a Pydantic schema
    When a client reads the OpenAPI document at /openapi.json
    Then the 200 response of GET /api/time references the "ServerTimeResponse" schema
    And "ServerTimeResponse" is defined in "backend/app/schemas/server_time.py"

  Scenario: Criterion 4, the unit and integration tests cover shape, offset and freshness
    When the files "backend/tests/unit/test_server_time_service_unit.py", "backend/tests/unit/test_server_time_schema_unit.py", "backend/tests/integration/test_server_time_integration.py" and "backend/tests/unit/test_main_unit.py" are run with pytest
    Then the summary reports 0 failed

  Scenario: Edge case, a non-GET method is rejected
    When a client sends POST /api/time
    Then the status is 405
