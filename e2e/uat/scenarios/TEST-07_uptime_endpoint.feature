Feature: TEST-07 Uptime endpoint
  GET /api/uptime reports how long the application has been running, so an
  operator can tell a restart from a long-lived process without reading
  container logs. There is no UI for this endpoint, so the steps are HTTP
  requests and responses.

  Background:
    Given the backend is running at http://localhost:8010

  Scenario: Criterion 1 - the endpoint returns 200 with uptime_seconds and started_at
    When I request GET /api/uptime
    Then the status is 200
    And the JSON body has exactly the keys uptime_seconds and started_at
    And uptime_seconds is a JSON number
    And started_at is an ISO 8601 string

  Scenario: Criterion 2 - uptime_seconds is non-negative and increases a second apart
    When I request GET /api/uptime and note uptime_seconds
    And I wait one second
    And I request GET /api/uptime again
    Then both uptime_seconds values are at least 0
    And the second value is larger than the first by about 1

  Scenario: Criterion 3 - started_at is captured once and is UTC with an explicit offset
    When I request GET /api/uptime twice, a few seconds apart
    Then started_at is character-for-character identical in both responses
    And uptime_seconds differs between them
    And started_at ends in Z, the UTC offset designator

  Scenario: Criterion 3 edge - a restart resets started_at and uptime_seconds
    Given I have noted started_at from GET /api/uptime
    When I restart the backend with docker compose restart backend
    And I request GET /api/uptime once the backend is running again
    Then started_at is later than the value I noted
    And uptime_seconds is small, a few seconds

  Scenario: Criterion 4 - the response body is defined by a Pydantic schema
    When I read the OpenAPI document at http://localhost:8010/openapi.json
    Then GET /api/uptime responds with the schema UptimeResponse
    And uptime_seconds is a number with minimum 0
    And started_at is a string with format date-time
    And both properties are required

  Scenario: Automated tests for the feature pass
    When I run uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/unit/test_uptime_unit.py tests/integration/test_uptime_integration.py tests/unit/test_main_unit.py
    Then the summary line reports 0 failed
