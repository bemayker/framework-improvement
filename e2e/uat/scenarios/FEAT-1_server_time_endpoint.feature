Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: GET /api/time answers 200 with now and timezone
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the keys "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: now is computed per request and is always UTC with an explicit offset
    When a client sends a GET request to "/api/time"
    And the client waits one second
    And the client sends a second GET request to "/api/time"
    Then the two "now" values differ
    And the second "now" is later than the first
    And both "now" values end with "+00:00"
    And neither "now" value ends with "Z"
    And both "now" values parse as timezone-aware ISO 8601 timestamps with a zero UTC offset

  Scenario: The response body is defined by a Pydantic schema
    Given the backend source in the repository
    When a reviewer opens "backend/app/schemas/server_time.py"
    Then "ServerTimeResponse" defines the fields "now" and "timezone"
    And its docstring states the "+00:00" offset choice
    And "backend/app/routers/server_time.py" declares "response_model=ServerTimeResponse"
    And the handler returns a "ServerTimeResponse", not a dict

  Scenario: The FEAT-1 unit and integration tests pass
    Given the backend dependencies are installed
    When the tests in "backend/tests/unit/test_server_time_unit.py" and "backend/tests/integration/test_server_time_integration.py" are run with pytest
    Then the summary line reports no failed or errored test
    And the command exits 0

  Scenario: A POST to /api/time is refused with 405 (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
