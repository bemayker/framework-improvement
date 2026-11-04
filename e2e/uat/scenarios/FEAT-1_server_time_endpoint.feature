Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current time in UTC, so a client can
  detect clock skew against the API without a second service.

  Background:
    Given the backend is running and answers on http://localhost:8010

  Scenario: Criterion 1 - the endpoint returns the time and timezone
    When I request GET /api/time
    Then the status is 200
    And the content type is application/json
    And the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"

  Scenario: Criterion 2 - now is UTC with an explicit offset and computed per request
    When I request GET /api/time and note "now" as the first value
    And I wait one second
    And I request GET /api/time and note "now" as the second value
    Then both values end in "+00:00"
    And neither value ends in "Z"
    And the second value is at least one second later than the first
    And the first value is within a few seconds of the current UTC time

  Scenario: Criterion 3 - the body is defined by a Pydantic schema
    When I open the OpenAPI document at /openapi.json
    Then the 200 response of GET /api/time references "#/components/schemas/ServerTimeResponse"

  Scenario: Criterion 4 - unit and integration tests cover shape, offset and freshness
    Given the repository
    When I run the FEAT-1 unit and integration test files:
      | backend/tests/unit/test_server_time_unit.py                 |
      | backend/tests/unit/test_main_unit.py                        |
      | backend/tests/integration/test_server_time_integration.py   |
    Then the summary reports 0 failed

  Scenario: Edge case - the endpoint is read-only
    When I request POST /api/time
    Then the status is 405
