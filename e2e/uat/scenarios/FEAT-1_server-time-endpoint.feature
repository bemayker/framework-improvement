Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend is running and reachable at "http://localhost:8000"
    And no database is needed for this endpoint

  Scenario: GET /api/time answers 200 with exactly now and timezone (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the keys "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: now is computed per request and always carries the +00:00 offset (criterion 2)
    When a client sends a GET request to "/api/time"
    And about one second passes
    And the client sends a second GET request to "/api/time"
    Then the two "now" values differ
    And the second "now" is later than the first
    And both "now" values end with exactly "+00:00"
    And neither "now" value ends with "Z" or lacks an offset
    And the time part of each "now" matches the machine's UTC time to within a few seconds

  Scenario: The response body is defined by a Pydantic schema, not a bare dict (criterion 3)
    Given the backend's OpenAPI document at "/openapi.json"
    When a reader opens the "/api/time" GET operation
    Then its 200 response references the "ServerTimeResponse" schema
    And that schema declares the properties "now" and "timezone"
    And "backend/app/schemas/server_time.py" defines the class "ServerTimeResponse"
    And "backend/app/routers/server_time.py" returns that class rather than a dict

  Scenario: The server-time unit and integration tests cover shape, offset and freshness (criterion 4)
    Given the repository is checked out on the feature branch
    When the tests in "backend/tests/unit/test_server_time_unit.py", "backend/tests/integration/test_server_time_integration.py" and "backend/tests/unit/test_main_unit.py" are run
    Then 0 failed
    And one test asserts the body's keys
    And one test asserts the exact "+00:00" suffix
    And one test asserts two calls return different "now" values

  Scenario: POST /api/time is rejected with 405 (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
    And no "now" value is returned
