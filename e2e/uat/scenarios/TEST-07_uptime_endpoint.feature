Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes app
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with uptime_seconds and started_at
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response body has exactly the fields "uptime_seconds" and "started_at"
    And the response body field "uptime_seconds" is a number
    And the response body field "started_at" is an ISO 8601 timestamp string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart
    Given a client has sent a GET request to "/api/uptime" and noted "uptime_seconds"
    When the client waits one second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are greater than or equal to 0
    And the second "uptime_seconds" value is greater than the first

  Scenario: started_at is fixed at startup and carries an explicit UTC offset
    Given a client has sent a GET request to "/api/uptime" and noted "started_at"
    When the client sends a second GET request to "/api/uptime"
    Then the second "started_at" is identical to the first
    And "started_at" ends in "+00:00"
    And "started_at" is not recomputed per request, so it only changes when the backend restarts

  Scenario: started_at moves forward after a backend restart
    Given a client has sent a GET request to "/api/uptime" and noted "started_at"
    When the backend is restarted and answers again
    And the client sends a GET request to "/api/uptime"
    Then "started_at" is later than the noted value
    And "uptime_seconds" is smaller than it was before the restart

  Scenario: The response body is defined by the UptimeResponse schema
    When a client opens "/docs" in a browser
    Then the "GET /api/uptime" operation documents a 200 response named "UptimeResponse"
    And the "UptimeResponse" schema lists "uptime_seconds" as a number and "started_at" as a date-time string
    And the schema is defined in "backend/app/schemas/uptime.py"

  Scenario: A POST to the endpoint is rejected with 405 (edge case)
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405
    And the response body does not contain "uptime_seconds"
