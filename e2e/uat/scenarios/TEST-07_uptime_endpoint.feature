Feature: TEST-07 Uptime endpoint
  As an operator
  I want GET /api/uptime to report how long the process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the backend is running and answers on http://localhost:8010

  # Criterion 1
  Scenario: Uptime endpoint returns 200 with uptime_seconds and started_at
    When I send GET /api/uptime
    Then the response status is 200
    And the content type is application/json
    And the body has exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is a string

  # Criterion 2
  Scenario: uptime_seconds is non-negative and increases between calls a second apart
    When I send GET /api/uptime and note "uptime_seconds"
    And I wait one second
    And I send GET /api/uptime again and note "uptime_seconds"
    Then both values are at least 0
    And the second value is greater than the first

  # Criterion 3
  Scenario: started_at is captured once and serialised in UTC with an explicit offset
    When I send GET /api/uptime twice, one to two seconds apart
    Then "started_at" is identical in both responses
    And "started_at" ends in "+00:00"
    And "uptime_seconds" has grown between the two responses

  Scenario: started_at moves forward after a restart
    Given I have noted "started_at" from GET /api/uptime
    When the backend is restarted and answers again
    And I send GET /api/uptime
    Then "started_at" is later than the noted value
    And "started_at" ends in "+00:00"

  # Criterion 4
  Scenario: The response body is defined by the UptimeResponse schema
    When I open http://localhost:8010/docs and expand GET /api/uptime
    Then the 200 response schema is named "UptimeResponse"
    And it lists "uptime_seconds" as a number and "started_at" as a date-time string
    And the schema is defined in backend/app/schemas/uptime.py

  Scenario: The uptime tests pass
    When I run "uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py tests/unit/test_main_unit.py"
    Then the run passes: its summary reports no failed or errored test and the command exits 0

  # Edge case
  Scenario: A non-GET method is rejected with 405
    When I send POST /api/uptime
    Then the response status is 405
