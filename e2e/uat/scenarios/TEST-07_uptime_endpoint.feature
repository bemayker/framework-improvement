Feature: TEST-07 Uptime endpoint
  As an operator
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the backend is running

  # Criterion 1
  Scenario: Uptime endpoint returns 200 with both fields
    When I request GET /api/uptime
    Then the response status is 200
    And the response body has exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a number
    And "started_at" is an ISO 8601 string

  # Criterion 2
  Scenario: Uptime is non-negative and increases between two calls a second apart
    When I request GET /api/uptime
    And I wait 1 second
    And I request GET /api/uptime again
    Then both "uptime_seconds" values are at least 0
    And the second "uptime_seconds" exceeds the first by about 1

  # Criterion 3
  Scenario: Start time is captured once and reported in UTC with an explicit offset
    When I request GET /api/uptime twice, a few seconds apart
    Then "started_at" is identical in both responses
    And "started_at" ends with "+00:00"
    And "started_at" is earlier than the current UTC time

  # Criterion 3, edge case
  Scenario: A restart gives a later start time and a small uptime
    Given I have noted "started_at" from GET /api/uptime
    When the backend restarts
    And I request GET /api/uptime
    Then "started_at" is later than the value I noted
    And "uptime_seconds" is a small non-negative number

  # Criterion 4
  Scenario: The response body is the UptimeResponse schema
    Given the API docs page is available
    When I inspect GET /api/uptime in the API docs
    Then its 200 response schema is named "UptimeResponse"
    And "UptimeResponse" lists "uptime_seconds" and "started_at"
