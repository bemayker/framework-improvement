Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: GET /api/time answers 200 with now and timezone (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the keys "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: now is computed per request, in UTC, with an explicit offset (criterion 2)
    When a client sends a GET request to "/api/time"
    And one second later the client sends a second GET request to "/api/time"
    Then the two "now" values differ and the second is later than the first
    And both "now" values end in "+00:00" and never in "Z"
    And both "now" values have exactly six digits after the decimal point
    And the latest "now" matches the current UTC date, hour and minute

  Scenario: The response body is defined by a Pydantic schema (criterion 3)
    When a client opens the OpenAPI document at "/openapi.json"
    Then the 200 response of "GET /api/time" refers to the schema "ServerTimeResponse"
    And the schema field "now" is a string with format "date-time"
    And the schema field "timezone" is a string whose only value is "UTC"

  Scenario: The tests cover the shape, the offset and the per-request freshness (criterion 4)
    When the files "tests/unit/test_server_time_schema_unit.py", "tests/unit/test_main_unit.py" and "tests/integration/test_server_time_integration.py" are run with pytest under "backend"
    Then the summary reports no failed or errored test
    And the command exits 0

  Scenario: A wrong method is answered with 405 (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
