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
    And the response body has exactly the fields "uptime_seconds" and "started_at"
    And "uptime_seconds" is a number
    And "started_at" is a string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart (criterion 2)
    Given the backend is running
    When a client sends a GET request to "/api/uptime" and notes "uptime_seconds"
    And the client waits one second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are at least 0
    And the second "uptime_seconds" is greater than the first

  Scenario: started_at is captured once and serialised in UTC with an explicit offset (criterion 3)
    Given the backend is running
    When a client sends a GET request to "/api/uptime" twice, a few seconds apart
    Then "started_at" is the identical string in both responses
    And "started_at" ends in "+00:00"

  Scenario: A backend restart changes started_at and resets uptime_seconds (criterion 3)
    Given a client has read "started_at" from "/api/uptime"
    When the "backend" service is restarted and answers again
    And the client sends a GET request to "/api/uptime"
    Then "started_at" is a later instant than before the restart
    And "uptime_seconds" is small, a few seconds at most

  Scenario: The response body is defined by the UptimeResponse Pydantic schema (criterion 4)
    Given the backend is running
    When a client reads the OpenAPI document at "/openapi.json"
    Then the 200 response of "GET /api/uptime" references the "UptimeResponse" schema
    And "UptimeResponse" has the properties "uptime_seconds" and "started_at"
    And the class "UptimeResponse" is defined in "backend/app/schemas/uptime.py"

  Scenario: Other methods on the path are rejected with 405 (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405

  Scenario: The tests covering the endpoint pass
    Given the backend dependencies are synced with uv
    When the tests in "backend/tests/unit/test_uptime_service_unit.py" and "backend/tests/integration/test_uptime_integration.py" are run
    Then the run reports no failed or errored test
    And the command exits 0
