Feature: TEST-07 Uptime endpoint
  As an operator
  I want GET /api/uptime to report how long the process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the backend is running

  Scenario: Criterion 1 - the endpoint returns 200 with uptime_seconds and started_at
    When I send GET /api/uptime
    Then the response status is 200
    And the response body has exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a number
    And "started_at" is an ISO 8601 string

  Scenario: Criterion 2 - uptime_seconds is non-negative and increases between calls a second apart
    When I send GET /api/uptime
    And I wait 1 second
    And I send GET /api/uptime again
    Then both "uptime_seconds" values are 0 or greater
    And the second "uptime_seconds" is greater than the first

  Scenario: Criterion 3 - started_at is captured once and serialised in UTC with an explicit offset
    When I send GET /api/uptime
    And I wait 2 seconds
    And I send GET /api/uptime again
    Then both "started_at" values are identical
    And "started_at" ends in "+00:00"

  Scenario: Criterion 4 - the response body is defined by a Pydantic schema
    When I open /docs
    Then GET /api/uptime is listed under the "uptime" tag
    And its 200 response documents the "UptimeResponse" schema with "uptime_seconds" and "started_at"

  Scenario: Edge case - a non-GET method is rejected
    When I send POST /api/uptime
    Then the response status is 405
