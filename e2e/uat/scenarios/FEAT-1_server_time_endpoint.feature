Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: GET /api/time answers 200 with now and timezone UTC
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the fields "now" and "timezone"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 date-time

  Scenario: now is computed per request, in UTC with an explicit offset, never naive
    When a client sends a GET request to "/api/time"
    And the client waits one second
    And the client sends a second GET request to "/api/time"
    Then the two "now" values differ
    And the second "now" is about one second later than the first
    And both "now" values end with "+00:00"
    And neither "now" value ends with "Z"
    And neither "now" value is missing its offset

  Scenario: The response body is defined by the ServerTimeResponse Pydantic schema
    When a reader opens the OpenAPI document of the backend at "/openapi.json"
    Then the 200 response of "GET /api/time" references the "ServerTimeResponse" schema
    And that schema has the properties "now" and "timezone"

  Scenario: The unit and integration tests cover shape, offset and freshness
    When the tests in "backend/tests/unit/test_server_time_unit.py", "backend/tests/integration/test_server_time_integration.py" and "backend/tests/unit/test_main_unit.py" are run
    Then the run reports no failed or errored test
    And the command exits with status 0

  Scenario: A POST to /api/time is rejected with 405 (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
