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
    And the "content-type" header is "application/json"
    And the response body is a JSON object with exactly the keys "uptime_seconds" and "started_at"
    And the response body field "uptime_seconds" is a JSON number
    And the response body field "started_at" is a JSON string

  Scenario: uptime_seconds is non-negative and grows between two calls a second apart
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    And the client waits 1 second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are greater than or equal to 0
    And the second "uptime_seconds" is larger than the first
    And the difference between them is roughly 1 second, depending on request latency

  Scenario: started_at is captured once and is UTC with an explicit offset
    Given the backend is running
    When a client sends three GET requests to "/api/uptime" a few seconds apart
    Then the "started_at" string is identical in all three responses
    And "uptime_seconds" grows across the three responses
    And every "started_at" string ends with "+00:00"
    And no "started_at" string ends with "Z" or lacks an offset

  Scenario: A backend restart produces a later started_at and a small uptime_seconds
    Given the backend answered a GET request to "/api/uptime" with a "started_at" value
    When the "backend" service is restarted and answers requests again
    And a client sends a GET request to "/api/uptime"
    Then the new "started_at" is later than the earlier value
    And "uptime_seconds" is small, a few seconds

  Scenario: The response body is defined by a Pydantic schema
    Given the repository is checked out
    When the file "backend/app/schemas/uptime.py" is opened
    Then it defines a class "UptimeResponse" deriving from "BaseModel"
    And that class declares the fields "uptime_seconds" and "started_at"
    And the router in "backend/app/routers/uptime.py" declares it as the response model of "GET /api/uptime"

  Scenario: Any method other than GET is rejected with 405 (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405
