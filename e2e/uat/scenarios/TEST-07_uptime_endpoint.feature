Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes app
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with uptime_seconds and started_at
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response body has exactly the fields "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is a JSON string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    And the client waits one second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are 0 or greater
    And the second "uptime_seconds" is greater than the first

  Scenario: started_at is captured once at startup and carries an explicit UTC offset
    Given the backend is running
    When a client sends a GET request to "/api/uptime" twice, a few seconds apart
    Then "started_at" is identical in both responses
    And "uptime_seconds" differs between them
    And "started_at" ends in "+00:00"

  Scenario: The response body is defined by the UptimeResponse Pydantic schema
    Given the backend is running
    When an operator opens "http://localhost:8010/docs" and expands "GET /api/uptime"
    Then the 200 response schema is named "UptimeResponse"
    And the schema lists the fields "uptime_seconds" and "started_at"
    And the schema is defined in "backend/app/schemas/uptime.py"

  Scenario: A backend restart produces a new started_at (edge case)
    Given the backend has answered "GET /api/uptime" with a "started_at" value
    When the "backend" service is restarted and reports running again
    And a client sends a GET request to "/api/uptime"
    Then "started_at" is later than the value seen before the restart
    And "uptime_seconds" is small, a few seconds at most

  Scenario: A non-GET method is rejected (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405
