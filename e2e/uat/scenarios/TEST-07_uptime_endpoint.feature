Feature: TEST-07 Uptime endpoint
  GET /api/uptime reports how long the backend process has been running, so an
  operator can tell a restart from a long-lived process. There is no UI: every
  step is an HTTP request against the running backend.

  Background:
    Given the backend is running and reachable at its base URL

  # Criterion 1
  Scenario: Uptime endpoint returns 200 with uptime_seconds and started_at
    When I request GET /api/uptime
    Then the response status is 200
    And the content type is application/json
    And the body has exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is a string

  # Criterion 2
  Scenario: uptime_seconds is non-negative and increases between calls a second apart
    When I request GET /api/uptime and note "uptime_seconds" as A
    And I wait about one second
    And I request GET /api/uptime and note "uptime_seconds" as B
    Then A is at least 0
    And B is greater than A by roughly 1 second

  # Criterion 3
  Scenario: started_at is captured once and serialised in UTC with an explicit offset
    When I request GET /api/uptime twice, a few seconds apart
    Then "started_at" is the identical string in both responses
    And "started_at" ends with "Z", the explicit UTC zero offset
    And "uptime_seconds" grew between the two responses

  Scenario: started_at moves forward after the backend restarts
    Given I have noted "started_at" from GET /api/uptime
    When the backend is restarted and answers again
    And I request GET /api/uptime
    Then "started_at" is a later instant than the one I noted
    And "uptime_seconds" is only a few seconds

  # Criterion 4
  Scenario: The response body is defined by the UptimeResponse schema
    When I open the OpenAPI documentation for the backend
    Then the 200 response of GET /api/uptime references the schema "UptimeResponse"
    And the schema has "uptime_seconds" (number) and "started_at" (string, date-time)

  # Edge case
  Scenario: Other methods on the uptime path are rejected
    When I request POST /api/uptime
    Then the response status is 405

  # Automated coverage
  Scenario: The uptime unit and integration tests pass
    When I run the tests in backend/tests/unit/test_uptime_service_unit.py and backend/tests/integration/test_uptime_integration.py
    Then the run reports no failed or errored test
    And the command exits 0
