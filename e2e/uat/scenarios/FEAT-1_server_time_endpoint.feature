Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current UTC time so a client can detect clock skew.
  This feature has no UI, so there are no data-testid references; scenarios exercise the HTTP API.

  Background:
    Given the stack is running with "docker compose up -d --build"
    And the API answers at "http://localhost:8010"

  Scenario: Criterion 1 - GET /api/time returns 200 with now and timezone
    When a client requests GET "/api/time"
    Then the status is 200
    And the body has exactly the keys "now" and "timezone"
    And "timezone" equals "UTC"
    And "now" is an ISO 8601 timestamp within a few seconds of the current UTC time

  Scenario: Criterion 2 - now is computed per request in UTC with an explicit offset
    When a client requests GET "/api/time"
    And waits at least one second
    And requests GET "/api/time" again
    Then the two "now" values differ
    And the second "now" is later than the first
    And each "now" ends with "+00:00"
    And no "now" ends with "Z" or lacks an offset

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    When a client reads the OpenAPI document at "/openapi.json"
    Then GET "/api/time" declares the "ServerTimeResponse" schema for its 200 response
    And "ServerTimeResponse" has "now" as a required string of format "date-time"
    And "ServerTimeResponse" has "timezone" restricted to the value "UTC"

  Scenario: Criterion 4 - unit and integration tests cover shape, offset and freshness
    Given the backend test files for FEAT-1
    When the developer runs "uv run --directory backend pytest -q tests/unit/test_server_time_schema_unit.py tests/unit/test_server_time_router_unit.py tests/unit/test_main_unit.py tests/integration/test_server_time_integration.py"
    Then 0 tests fail

  Scenario: Edge case - a non-GET method is rejected
    When a client requests POST "/api/time"
    Then the status is 405
