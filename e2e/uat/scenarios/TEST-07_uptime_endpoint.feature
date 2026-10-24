Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes API
  I want GET /api/uptime to report how long the process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend is running
    And its API is reachable at "http://localhost:8010"

  Scenario: GET /api/uptime returns 200 with uptime_seconds and started_at (criterion 1)
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response body has exactly the fields "uptime_seconds" and "started_at"
    And the response body field "uptime_seconds" is a number
    And the response body field "started_at" is an ISO 8601 date-time string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart (criterion 2)
    When a client sends a GET request to "/api/uptime"
    And the client waits about 1 second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are at least 0
    And the second "uptime_seconds" is larger than the first by roughly 1 second

  Scenario: started_at is captured once at startup and serialised in UTC with an explicit offset (criterion 3)
    When a client sends a GET request to "/api/uptime"
    And the client waits a few seconds
    And the client sends a second GET request to "/api/uptime"
    Then the "started_at" values of both responses are identical
    And "started_at" ends with "+00:00"
    When the backend is restarted
    And a client sends a GET request to "/api/uptime"
    Then "started_at" is later than the earlier value and still ends with "+00:00"
    And "uptime_seconds" is only a few seconds

  Scenario: The response body is defined by the UptimeResponse schema (criterion 4)
    When a client sends a GET request to "/openapi.json"
    Then the schema "UptimeResponse" has the properties "uptime_seconds" and "started_at"
    And "uptime_seconds" is of type "number"
    And "started_at" is of type "string"
    And the 200 response of "GET /api/uptime" references "#/components/schemas/UptimeResponse"

  Scenario: POST to the uptime endpoint is not allowed (edge case)
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405
