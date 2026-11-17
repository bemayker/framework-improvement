Feature: TEST-07 Uptime endpoint
  GET /api/uptime reports how long the backend process has been running.
  The feature has no UI, so every scenario is an HTTP request against the backend.

  Background:
    Given the backend is running at "http://localhost:8010"

  Scenario: Criterion 1 - the endpoint returns uptime and start time
    When I GET "/api/uptime"
    Then the response status is 200
    And the content type is "application/json"
    And the body has exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a number
    And "started_at" is a string

  Scenario: Criterion 2 - uptime is non-negative and increases
    When I GET "/api/uptime" and note "uptime_seconds" as A
    And I wait one second
    And I GET "/api/uptime" and note "uptime_seconds" as B
    Then A is greater than or equal to 0
    And B is greater than A

  Scenario: Criterion 2 - the covering tests pass
    When I run "uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/unit/test_uptime_schema_unit.py tests/integration/test_uptime_integration.py"
    Then the summary line reports no failed or errored test
    And the command exits 0

  Scenario: Criterion 3 - started_at is fixed at startup and carries a UTC offset
    When I GET "/api/uptime" twice, a few seconds apart
    Then "started_at" is identical in both responses
    And "started_at" ends in "+00:00"

  Scenario: Criterion 3 - a restart changes started_at and resets uptime
    Given I have noted "started_at" from a first call
    When I restart the backend container and wait until it is running
    And I GET "/api/uptime"
    Then "started_at" is a later instant than the noted one
    And "uptime_seconds" is small, a few seconds

  Scenario: Criterion 4 - the response is defined by the UptimeResponse schema
    When I GET "/openapi.json"
    Then the 200 response of GET "/api/uptime" references the "UptimeResponse" schema
    And "UptimeResponse" has "uptime_seconds" (number, minimum 0) and "started_at" (string, date-time)

  Scenario: Edge case - a non-GET method is rejected
    When I POST "/api/uptime"
    Then the response status is 405
