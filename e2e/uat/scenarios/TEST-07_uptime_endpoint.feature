Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes app
  I want GET /api/uptime to report when the backend started and how long it has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes stack runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with uptime_seconds and started_at
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the keys "uptime_seconds" and "started_at"
    And the response body field "uptime_seconds" is a JSON number
    And the response body field "started_at" is a string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    And the client waits about one second
    And the client sends a second GET request to "/api/uptime"
    Then both responses have status code 200
    And the "uptime_seconds" of the first response is at least 0
    And the "uptime_seconds" of the second response is larger than the first by roughly one second

  Scenario: started_at is fixed at startup, is UTC with an explicit offset, and moves on restart
    Given the backend is running
    When a client sends two GET requests to "/api/uptime" a few seconds apart
    Then both responses carry the identical "started_at" string
    And that string ends with "+00:00"
    When the "backend" service is restarted and answers again
    And a client sends a GET request to "/api/uptime"
    Then the response "started_at" is later than the value seen before the restart
    And the response "uptime_seconds" is a small number of seconds

  Scenario: The response body is defined by the UptimeResponse schema
    Given the backend is running
    When a client reads the generated OpenAPI document at "/openapi.json"
    Then the 200 response of "GET /api/uptime" refers to the schema named "UptimeResponse"
    And the "UptimeResponse" schema has the properties "uptime_seconds" and "started_at"
    And the schema is defined in "backend/app/schemas/uptime.py"
    And the router "backend/app/routers/uptime.py" declares "UptimeResponse" as its response model

  Scenario: A POST to the endpoint answers 405 (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405

  Scenario: The unit and integration tests for the endpoint pass
    Given the backend dependencies are synced with uv
    When I run "uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py"
    Then the run ends with "0 failed"
