Feature: TEST-07 Uptime endpoint
  As an operator
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the backend is running and answers on http://localhost:8010

  # Criterion 1
  Scenario: Uptime endpoint returns 200 with uptime_seconds and started_at
    When I send GET /api/uptime
    Then the response status is 200
    And the response content type is application/json
    And the body has exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is an ISO 8601 date-time string

  # Criterion 2
  Scenario: uptime_seconds is non-negative and increases between two calls a second apart
    When I send GET /api/uptime and note "uptime_seconds" as A
    And I wait one second
    And I send GET /api/uptime and note "uptime_seconds" as B
    Then A is greater than or equal to 0
    And B is greater than A
    And B minus A is roughly one second

  # Criterion 3
  Scenario: started_at is captured once and identical across requests
    When I send GET /api/uptime twice, a few seconds apart
    Then "started_at" is character-for-character identical in both responses
    And "uptime_seconds" differs between the two responses

  Scenario: started_at is serialised in UTC with an explicit +00:00 offset
    When I send GET /api/uptime
    Then "started_at" ends in "+00:00"
    And "started_at" does not end in "Z"
    And "started_at" carries no local offset such as "+01:00"

  Scenario: A backend restart yields a later started_at and a small uptime_seconds
    Given I have noted "started_at" from GET /api/uptime
    When the backend service is restarted and answers again
    And I send GET /api/uptime
    Then "started_at" is later than the noted value
    And "uptime_seconds" is only a few seconds

  # Criterion 4
  Scenario: The response body is described by the UptimeResponse schema
    When I open the API documentation at /docs
    Then GET /api/uptime is listed under the "uptime" tag
    And its 200 response references the schema "UptimeResponse"
    And that schema has the properties "uptime_seconds" and "started_at"

  # Edge case
  Scenario: A non-GET method on the endpoint is rejected
    When I send POST /api/uptime
    Then the response status is 405
