Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes API
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The uptime endpoint returns 200 with uptime_seconds and started_at
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response body has exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is an ISO 8601 string

  Scenario: uptime_seconds is non-negative and increases between two calls
    Given the backend is running
    When a client sends a GET request to "/api/uptime" and records "uptime_seconds"
    And the client waits about one second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are at least 0
    And the second value is larger than the first by roughly one second

  Scenario: started_at is captured once and serialised in UTC with an explicit offset
    Given the backend is running
    When a client sends several GET requests to "/api/uptime"
    Then "started_at" ends in "+00:00"
    And "started_at" is identical in every response
    And "started_at" plus "uptime_seconds" is approximately the current UTC time

  Scenario: The response body is documented by a Pydantic schema
    Given the backend is running
    When a reader opens the OpenAPI docs at "/docs" for "GET /api/uptime"
    Then the 200 response is documented as the "UptimeResponse" schema
    And "UptimeResponse" has the required properties "uptime_seconds" (number, minimum 0) and "started_at" (string)

  Scenario: A backend restart resets started_at and uptime_seconds (edge case)
    Given the backend is running and "started_at" has been recorded
    When the backend service is restarted and answers again
    And a client sends a GET request to "/api/uptime"
    Then "started_at" is later than the recorded value and still ends in "+00:00"
    And "uptime_seconds" is small, a few seconds at most
