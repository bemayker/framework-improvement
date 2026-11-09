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
    And the response content type is "application/json"
    And the response body has exactly the keys "uptime_seconds" and "started_at"
    And the response body field "uptime_seconds" is a number
    And the response body field "started_at" is a string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart
    Given the backend is running
    When a client sends a GET request to "/api/uptime" and records "uptime_seconds" as A
    And the client waits about one second
    And the client sends a GET request to "/api/uptime" and records "uptime_seconds" as B
    Then A is greater than or equal to 0
    And B is greater than A

  Scenario: started_at is fixed at startup and expressed in UTC with an explicit offset
    Given the backend is running
    When a client sends a GET request to "/api/uptime" twice, a few seconds apart
    Then the "started_at" string is identical in both responses
    And the "uptime_seconds" values differ
    And "started_at" ends with "Z", the ISO 8601 UTC designator

  Scenario: A backend restart changes started_at and resets uptime_seconds
    Given the backend answered "/api/uptime" with a "started_at" value S1
    When the "backend" service is restarted and answers "/api/version" again
    And a client sends a GET request to "/api/uptime"
    Then the response body field "started_at" is later than S1
    And the response body field "uptime_seconds" is a few seconds

  Scenario: The response body is defined by the UptimeResponse Pydantic schema
    Given the source tree of the repository
    When I open "backend/app/schemas/uptime.py"
    Then it defines "UptimeResponse" with the fields "uptime_seconds" and "started_at"
    And the generated "/openapi.json" lists both fields as properties of "UptimeResponse"
    And the GET operation of "/api/uptime" references "UptimeResponse" in its 200 response

  Scenario: Other methods are rejected (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405

  Scenario: The automated tests for the endpoint pass
    Given the backend dependencies are synced with uv
    When I run the tests in "backend/tests/unit/test_uptime_unit.py" and "backend/tests/integration/test_uptime_integration.py"
    Then the summary reports 0 failed
