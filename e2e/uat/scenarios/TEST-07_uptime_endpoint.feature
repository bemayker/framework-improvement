Feature: TEST-07 Uptime endpoint
  As an operator
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the backend is running and reachable at http://localhost:8010

  Scenario: Criterion 1 - GET /api/uptime returns 200 with uptime_seconds and started_at
    When a client requests GET /api/uptime
    Then the response status is 200
    And the response body has exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is an ISO 8601 string

  Scenario: Criterion 2 - uptime_seconds is non-negative and increases between two calls a second apart
    When a client requests GET /api/uptime
    And the client waits one second
    And the client requests GET /api/uptime again
    Then both "uptime_seconds" values are 0 or greater
    And the second "uptime_seconds" is greater than the first

  Scenario: Criterion 3 - started_at is captured once at startup and serialised in UTC with an explicit offset
    When a client requests GET /api/uptime twice
    Then "started_at" is identical in both responses
    And "started_at" ends with "+00:00"
    When the backend is restarted
    And a client requests GET /api/uptime
    Then "started_at" is later than the value seen before the restart
    And "uptime_seconds" is small

  Scenario: Criterion 4 - the response body is defined by a Pydantic schema in backend/app/schemas/
    Given the codebase
    When a reviewer opens backend/app/schemas/uptime.py
    Then UptimeResponse declares "uptime_seconds" and "started_at"
    And the router in backend/app/routers/uptime.py uses UptimeResponse as its response_model

  Scenario: Edge case - a method other than GET is not allowed
    When a client requests POST /api/uptime
    Then the response status is 405
