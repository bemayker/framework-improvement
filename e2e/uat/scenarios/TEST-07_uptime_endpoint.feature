Feature: TEST-07 Uptime endpoint
  GET /api/uptime reports how long the backend process has been running,
  so an operator can tell a restart from a long-lived process.

  Background:
    Given the compose stack is running with the backend published on http://localhost:8010

  Scenario: Criterion 1 - the endpoint returns 200 with uptime_seconds and started_at
    When I send GET /api/uptime
    Then the response status is 200
    And the content-type is application/json
    And the body is one JSON object with exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is an ISO 8601 date-time string

  Scenario: Criterion 2 - uptime_seconds is non-negative and increases between calls a second apart
    When I send GET /api/uptime
    And I wait 1 second
    And I send GET /api/uptime again
    Then both "uptime_seconds" values are at least 0
    And the second "uptime_seconds" is greater than the first by at least 1.0

  Scenario: Criterion 3 - started_at is captured once and serialised in UTC with an explicit offset
    When I send GET /api/uptime
    And I wait 3 seconds
    And I send GET /api/uptime again
    Then "started_at" is identical in both responses
    And "uptime_seconds" has grown between the responses
    And "started_at" ends in "+00:00"

  Scenario: Criterion 4 - the response body is defined by a Pydantic schema in backend/app/schemas/
    Given the repository checkout
    When I open backend/app/schemas/uptime.py
    Then it defines "UptimeResponse" with the fields "uptime_seconds" and "started_at"
    And backend/app/routers/uptime.py declares response_model=UptimeResponse on the route
    And running tests/unit/test_uptime_schema_unit.py ends with 0 failed

  Scenario: Edge case - a backend restart yields a new started_at and a small uptime_seconds
    Given I have read "started_at" from GET /api/uptime
    When I restart the backend service
    And GET /api/uptime answers again
    Then "started_at" is later than the value read before the restart
    And "uptime_seconds" is a few seconds
