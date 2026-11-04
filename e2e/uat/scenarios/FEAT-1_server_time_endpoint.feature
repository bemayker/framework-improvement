Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current time in UTC
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: GET /api/time answers 200 with now and timezone
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the fields "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: now is computed per request
    When a client sends a GET request to "/api/time"
    And the client waits one second
    And the client sends a second GET request to "/api/time"
    Then the two "now" values differ
    And the second "now" is later than the first

  Scenario: now is serialised in UTC with the explicit offset +00:00
    When a client sends a GET request to "/api/time"
    Then the response body field "now" parses as an ISO 8601 date and time
    And the value ends with exactly "+00:00"
    And the value does not end with "Z"
    And the value is not naive, it carries an offset
    And the value matches the current UTC time to within a few seconds

  Scenario: The response body is defined by the ServerTimeResponse Pydantic schema
    When a client reads the OpenAPI document at "/openapi.json"
    Then the 200 response of "GET /api/time" references "#/components/schemas/ServerTimeResponse"

  Scenario: The FEAT-1 unit and integration tests pass
    When the tests in "backend/tests/unit/test_server_time_unit.py", "backend/tests/integration/test_server_time_integration.py" and "backend/tests/unit/test_main_unit.py" are run
    Then the run reports 0 failed

  Scenario: A POST request to /api/time is rejected with 405 (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
