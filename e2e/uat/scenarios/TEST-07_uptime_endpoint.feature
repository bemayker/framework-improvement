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
    And the response body field "uptime_seconds" is a number
    And the response body field "started_at" is a string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    And the client waits one second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are greater than or equal to 0
    And the second "uptime_seconds" value is greater than the first

  Scenario: started_at is captured once at startup and carries an explicit UTC offset
    Given the backend is running
    When a client sends two GET requests to "/api/uptime" a few seconds apart
    Then the "started_at" value is identical in both responses
    And the "started_at" value ends in "+00:00"

  Scenario: The response body is defined by a Pydantic schema in backend/app/schemas
    Given the repository is checked out at this branch
    Then the file "backend/app/schemas/uptime.py" defines the class "UptimeResponse"
    And the route "GET /api/uptime" declares "UptimeResponse" as its response model
    When the tests in "backend/tests/unit/test_uptime_schema_unit.py" are run
    Then the run passes with no failed or errored test and exits with code 0

  Scenario: A restarted backend reports a later started_at and a small uptime_seconds (edge case)
    Given the backend answered "GET /api/uptime" and the "started_at" value was noted
    When the "backend" service is restarted and is running again
    And a client sends a GET request to "/api/uptime"
    Then the "started_at" value is later than the noted value
    And the "uptime_seconds" value is small, a few seconds at most

  Scenario: A method other than GET is rejected (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405
