Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes app
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with uptime_seconds and started_at (criterion 1)
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the keys "uptime_seconds" and "started_at"
    And the response body field "uptime_seconds" is a JSON number
    And the response body field "started_at" is a JSON string

  Scenario: uptime_seconds is non-negative and increases between calls a second apart (criterion 2)
    Given the backend is running
    When a client sends a GET request to "/api/uptime" and reads "uptime_seconds"
    And the client waits one second
    And the client sends a second GET request to "/api/uptime" and reads "uptime_seconds"
    Then both values are 0 or greater
    And the second value is at least 1 greater than the first value

  Scenario: started_at is captured once at startup and serialised in UTC with an explicit offset (criterion 3)
    Given the backend is running
    When a client sends a GET request to "/api/uptime" and reads "started_at"
    And the client waits 2 seconds
    And the client sends a second GET request to "/api/uptime" and reads "started_at"
    Then the two "started_at" strings are identical character for character
    And the "started_at" string is an ISO 8601 timestamp ending in "+00:00"
    And the "started_at" string does not end in "Z"

  Scenario: A backend restart is visible as a later started_at and a small uptime_seconds (criterion 3)
    Given the backend answered "/api/uptime" with a "started_at" value
    When the "backend" service is restarted and is running again
    And a client sends a GET request to "/api/uptime"
    Then the "started_at" value is later than the value read before the restart
    And the "uptime_seconds" value is a few seconds

  Scenario: The response body is defined by a Pydantic schema (criterion 4)
    Given the repository is checked out on the feature branch
    When I open "backend/app/schemas/uptime.py"
    Then "UptimeResponse" is a Pydantic model with the fields "uptime_seconds" and "started_at"
    And the route in "backend/app/routers/uptime.py" declares "UptimeResponse" as its response model

  Scenario: A non-GET method on the endpoint returns 405 (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405
