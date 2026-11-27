Feature: TEST-07 Uptime endpoint
  As an operator
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the backend is running at "http://localhost:8010"

  Scenario: Criterion 1, the endpoint returns 200 with both fields
    When I request GET "/api/uptime"
    Then the response status is 200
    And the response is JSON with exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a number
    And "started_at" is an ISO 8601 string

  Scenario: Criterion 2, uptime_seconds is non-negative and increases
    When I request GET "/api/uptime"
    And I wait one second
    And I request GET "/api/uptime" again
    Then both "uptime_seconds" values are zero or greater
    And the second "uptime_seconds" is larger than the first by roughly one second

  Scenario: Criterion 3, started_at is captured once and is UTC with an explicit offset
    When I request GET "/api/uptime" twice, a few seconds apart
    Then "started_at" is identical in both responses
    And "started_at" ends in "+00:00"
    When the backend restarts
    And I request GET "/api/uptime"
    Then "started_at" is later than before the restart
    And "uptime_seconds" is only a few seconds

  Scenario: Criterion 4, the response is defined by a Pydantic schema
    Given the API docs are open at "/docs"
    When I open the GET "/api/uptime" operation
    Then its 200 response is documented as "UptimeResponse"
    And "uptime_seconds" is a number with minimum 0 and "started_at" is a string, both required
    And "backend/app/schemas/uptime.py" defines the class "UptimeResponse"
    When I run the tests in "backend/tests/unit/test_uptime_schema_unit.py", "backend/tests/unit/test_uptime_service_unit.py" and "backend/tests/integration/test_uptime_integration.py"
    Then the run passes: the summary line reports no failed or errored test and the command exits 0

  Scenario: Edge case, a non-GET method is rejected with 405
    When I request POST "/api/uptime"
    Then the response status is 405
