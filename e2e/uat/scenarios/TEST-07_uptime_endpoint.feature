Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes app
  I want GET /api/uptime to report when the backend started and how long it has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with uptime_seconds and started_at
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly two fields, "uptime_seconds" and "started_at"
    And the response body field "uptime_seconds" is a JSON number
    And the response body field "started_at" is a JSON string holding an ISO 8601 timestamp

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    And the client waits one second
    And the client sends a second GET request to "/api/uptime"
    Then both responses have status code 200
    And the "uptime_seconds" value of the first response is 0 or greater
    And the "uptime_seconds" value of the second response is larger than the first by roughly one second
    And the second value is never smaller than the first

  Scenario: started_at is captured once at startup and serialised in UTC with an explicit offset
    Given the backend is running
    When a client sends two GET requests to "/api/uptime" a few seconds apart
    Then the "started_at" value is the identical string in both responses
    And the "uptime_seconds" value is larger in the second response
    And the "started_at" value ends in "+00:00"
    And the "started_at" value does not end in "Z"

  Scenario: The response body is defined by the UptimeResponse Pydantic schema
    Given the backend is running
    When an operator opens "http://localhost:8010/docs"
    Then the Swagger UI lists "GET /api/uptime" under the "uptime" tag
    And its 200 response names the "UptimeResponse" schema
    And that schema has a field "uptime_seconds" of type number with a minimum of 0
    And that schema has a field "started_at" of type string
    And the "started_at" field is shown as a plain string with no "date-time" format

  Scenario: A backend restart produces a later started_at and a small uptime_seconds (edge case)
    Given the backend has been running long enough for "uptime_seconds" to be well above a few seconds
    And a client has noted the "started_at" value from "/api/uptime"
    When the backend service is restarted
    And a client sends a GET request to "/api/uptime" once the endpoint answers again
    Then the response status code is 200
    And the "started_at" value is a later time than the value noted before the restart
    And the "uptime_seconds" value is small, a few seconds at most

  Scenario: A POST request to /api/uptime is rejected with 405 (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405
