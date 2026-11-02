Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current time in UTC
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with now and timezone
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the fields "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: now is UTC with an explicit offset, never naive
    When a client sends a GET request to "/api/time"
    Then the response body field "now" is an ISO 8601 timestamp
    And the response body field "now" ends with exactly "+00:00"
    And the response body field "now" does not end with "Z"
    And the hour in "now" agrees with the current UTC hour, not the server's local time

  Scenario: now is computed per request (edge case)
    Given a client has sent a GET request to "/api/time" and noted the value of "now"
    When the client waits about one second
    And the client sends a second GET request to "/api/time"
    Then the second "now" is different from the first
    And the second "now" is later than the first by roughly one second
    And both values end with "+00:00"

  Scenario: Other methods on the path are rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405

  Scenario: The response body is defined by a Pydantic schema
    Given the API's OpenAPI document is available at "http://localhost:8010/openapi.json"
    When a reviewer looks up GET "/api/time"
    Then its 200 response references the "ServerTimeResponse" schema
    And that schema is defined in "backend/app/schemas/server_time.py"

  Scenario: The server time tests pass
    Given the backend dependencies are synced with uv
    When the tests in "backend/tests/unit/test_server_time_unit.py", "backend/tests/integration/test_server_time_integration.py" and "backend/tests/unit/test_main_unit.py" are run
    Then the summary reports "0 failed"
    And the integration tests assert the exact "+00:00" suffix, the response keys and two different "now" values across two requests
