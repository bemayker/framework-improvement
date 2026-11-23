Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: GET /api/time answers 200 with now and timezone UTC
    Given the backend is running
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response body has exactly the fields "now" and "timezone"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with "+00:00"

  Scenario: now is computed per request, in UTC, with an explicit offset
    Given the backend is running
    When a client sends a GET request to "/api/time"
    And the client waits about one second
    And the client sends a second GET request to "/api/time"
    Then the two "now" values differ
    And the second "now" is later than the first
    And both "now" values end with "+00:00"
    And both "now" values carry the current UTC hour, never the server's local hour

  Scenario: The response body is defined by the ServerTimeResponse Pydantic schema
    Given the backend is running
    When a client requests the OpenAPI schema at "/openapi.json"
    Then the 200 response of "GET /api/time" references the "ServerTimeResponse" component
    And that component declares the properties "now" and "timezone"

  Scenario: The unit and integration tests cover shape, offset and per-request freshness
    Given the repository is checked out at the FEAT-1 branch
    When the tests in "backend/tests/unit/test_server_time_unit.py", "backend/tests/unit/test_main_unit.py" and "backend/tests/integration/test_server_time_integration.py" are run with pytest
    Then the run passes, with no failed or errored test and exit code 0

  Scenario: A POST to /api/time is rejected with 405 (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
    And the response body carries no "now" field
