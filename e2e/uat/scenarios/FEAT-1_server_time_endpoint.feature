Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current UTC time
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

  Scenario: now is computed per request, in UTC, with an explicit offset
    When a client sends a GET request to "/api/time"
    And the client waits one second
    And the client sends a second GET request to "/api/time"
    Then both "now" values end in "+00:00"
    And neither "now" value ends in "Z"
    And the two "now" values differ
    And the second "now" value is later than the first
    And each "now" value is within a few seconds of the current UTC time

  Scenario: The response body is defined by a Pydantic schema
    When a client opens the OpenAPI schema at "/openapi.json"
    Then the 200 response of "GET /api/time" references the schema "ServerTimeResponse"
    And the schema "ServerTimeResponse" has the properties "now" and "timezone"
    And the property "now" is a string with the format "date-time"

  Scenario: Unit and integration tests cover the shape, the offset and the freshness
    Given a checkout of the feature branch with uv installed
    When the test files "backend/tests/unit/test_server_time_unit.py", "backend/tests/unit/test_main_unit.py" and "backend/tests/integration/test_server_time_integration.py" are run with pytest
    Then the run passes: the summary reports no failed or errored test and the command exits 0
    And the files contain tests named for the shape, the offset and the per-request freshness

  Scenario: A non-GET method is rejected with 405 (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
    And no "now" value is returned
