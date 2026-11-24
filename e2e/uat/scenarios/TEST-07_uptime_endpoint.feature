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
    And "uptime_seconds" is a number
    And "started_at" is an ISO 8601 date-time string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart
    Given the backend is running
    When a client sends a GET request to "/api/uptime" and notes "uptime_seconds"
    And the client waits about one second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are at least 0
    And the second value is larger than the first by roughly 1
    And running "uv run --directory backend pytest -q tests/unit/test_uptime_service_unit.py tests/integration/test_uptime_integration.py" passes, with no failed or errored test and exit code 0

  Scenario: started_at is captured once at startup and is UTC with an explicit offset
    Given the backend is running
    When a client sends two GET requests to "/api/uptime" a few seconds apart
    Then both responses carry the identical "started_at" string
    And "started_at" ends in "+00:00"
    And "started_at" matches the moment the backend container started, in UTC

  Scenario: Restarting the backend resets started_at and uptime_seconds
    Given the backend answered "/api/uptime" with a "started_at" value
    When the backend service is restarted with "docker compose restart backend"
    And a client sends a GET request to "/api/uptime" once the backend answers again
    Then "started_at" is a later time than before the restart
    And "uptime_seconds" is small, a few seconds

  Scenario: The response body is defined by the UptimeResponse Pydantic schema
    Given the backend is running
    When a client opens "/openapi.json" and "/docs"
    Then the 200 response of "GET /api/uptime" references "#/components/schemas/UptimeResponse"
    And that schema has "uptime_seconds" of type number and "started_at" of type string with format date-time
    And the schema is defined in "backend/app/schemas/uptime.py"

  Scenario: A POST to the endpoint is rejected with 405 (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405
    And the response body is FastAPI's own "Method Not Allowed" error
