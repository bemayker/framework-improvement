Feature: FEAT-1 Server time endpoint
  As an API client
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend API is running and published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with now and timezone UTC (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response body has exactly the fields "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: now is computed per request and always ends in +00:00 (criterion 2)
    When a client sends a GET request to "/api/time"
    And the client waits about one second
    And the client sends a second GET request to "/api/time"
    Then the two "now" values differ, the second being later than the first
    And both "now" values end with "+00:00"
    And neither "now" value ends with "Z" or lacks an offset

  Scenario: The response body is defined by the ServerTimeResponse schema (criterion 3)
    When a client opens the OpenAPI document at "/openapi.json"
    Then the 200 response of "GET /api/time" references the schema "ServerTimeResponse"
    And that schema declares the fields "now" and "timezone"

  Scenario: The server-time tests cover shape, offset and freshness (criterion 4)
    Given a checkout of this branch with uv installed
    When the tests in "backend/tests/unit/test_server_time_unit.py", "backend/tests/integration/test_server_time_integration.py" and "backend/tests/unit/test_main_unit.py" are run with pytest
    Then the run passes: its summary line reports no failed or errored test and the command exits 0

  Scenario: A non-GET method is rejected with 405 (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
