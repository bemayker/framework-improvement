Feature: TEST-07 Uptime endpoint
  GET /api/uptime reports how long the backend process has been running, so an
  operator can tell a restart from a long-lived process. There is no UI for it,
  so the scenarios are phrased as HTTP requests and responses.

  Background:
    Given the backend is running and reachable at http://localhost:8010

  Scenario: Criterion 1 - uptime responds with 200 and the two fields
    When a client requests GET /api/uptime
    Then the response status is 200
    And the response content type is application/json
    And the body is a JSON object with exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is an ISO 8601 string

  Scenario: Criterion 2 - uptime_seconds is non-negative and increases
    When a client requests GET /api/uptime
    And the client waits one second
    And the client requests GET /api/uptime again
    Then both "uptime_seconds" values are at least 0
    And the second "uptime_seconds" is at least 1 greater than the first

  Scenario: Criterion 3 - started_at is captured once, in UTC with an explicit offset
    When a client requests GET /api/uptime twice
    Then "started_at" is identical in both responses
    And "started_at" ends in "+00:00"

  Scenario: Criterion 3 edge case - started_at changes after a backend restart
    Given a client has read "started_at" and "uptime_seconds" from GET /api/uptime
    When the backend is restarted and becomes reachable again
    And the client requests GET /api/uptime
    Then "started_at" is a later value than before the restart
    And "uptime_seconds" is close to 0

  Scenario: Criterion 4 - the response body is defined by a Pydantic schema
    When a client opens the OpenAPI document at /openapi.json
    Then the 200 response of GET /api/uptime references the schema "UptimeResponse"
    And "uptime_seconds" is declared as a number with minimum 0
    And "started_at" is declared as a string with format "date-time"
    And both fields are required

  Scenario: Edge case - a method other than GET is rejected
    When a client requests POST /api/uptime
    Then the response status is 405
