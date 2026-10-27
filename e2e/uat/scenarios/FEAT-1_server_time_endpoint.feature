Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with now and timezone (AC1)
    Given the backend is running
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response body has exactly the fields "now" and "timezone"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 timestamp

  Scenario: now is computed per request in UTC with an explicit offset (AC2)
    Given the backend is running
    When a client sends a GET request to "/api/time"
    And the client waits one second
    And the client sends a second GET request to "/api/time"
    Then both "now" values end in "+00:00"
    And neither "now" value ends in "Z"
    And neither "now" value is a naive timestamp without an offset
    And the second "now" value is later than the first

  Scenario: The response body is defined by a Pydantic schema (AC3)
    Given the backend is running
    When a client sends a GET request to "/openapi.json"
    Then the 200 response of "GET /api/time" references the "ServerTimeResponse" schema
    And the "ServerTimeResponse" schema lists the properties "now" and "timezone"
    And the schema is defined in "backend/app/schemas/server_time.py"

  Scenario: Unit and integration tests cover shape, offset and freshness (AC4)
    Given the repository is checked out
    When the tests in "backend/tests/unit/test_server_time_unit.py", "backend/tests/integration/test_server_time_integration.py" and "backend/tests/unit/test_main_unit.py" are run
    Then the run reports 0 failed
    And no test in those files is reported skipped

  Scenario: A non-GET method is rejected with 405 (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
