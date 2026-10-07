Feature: TEST-13 Ping endpoint
  As an operator
  I want a liveness endpoint at GET /api/ping
  So that I can check the backend answers without touching the database

  Background:
    Given the backend is running and reachable at its base URL

  Scenario: AC1 GET /api/ping returns 200 with pong true
    When a client sends "GET /api/ping"
    Then the response status is 200
    And the response content type is "application/json"
    And the response body is exactly {"pong": true}
    And the value of "pong" is the JSON boolean true, not the string "true"

  Scenario: AC2 The endpoint is listed in the OpenAPI schema
    When a client fetches "/openapi.json"
    Then the "paths" object contains "/api/ping" with a "get" operation tagged "ping"
    And "components.schemas.PingResponse.properties.pong.type" is "boolean"
    And "pong" is listed in "components.schemas.PingResponse.required"

  Scenario: AC3 The backend test suite passes with the new tests included
    Given the branch "feature/TEST-13-ping-endpoint" is checked out
    When the backend suite is run with "uv run --directory backend pytest -q"
    Then the summary reports 0 failed
    And the run collects "test_ping_unit.py" and "test_ping_integration.py"

  Scenario: Edge case, a wrong method is rejected
    When a client sends "POST /api/ping"
    Then the response status is 405
