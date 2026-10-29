Feature: FEAT-1 Server time endpoint
  As an API client
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: Criterion 1 - GET /api/time answers 200 with now and timezone
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the keys "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: Criterion 2 - now is computed per request, in UTC, with an explicit offset
    When a client sends a GET request to "/api/time"
    And the client waits about 1 second
    And the client sends a second GET request to "/api/time"
    Then both "now" values end with "+00:00"
    And neither "now" value ends with "Z" or lacks an offset
    And the second "now" value differs from the first and is later

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    Given the API's OpenAPI document at "/openapi.json"
    When the 200 response schema of "GET /api/time" is read
    Then it is the component "ServerTimeResponse"
    And that schema has the properties "now" and "timezone"
    And the file "backend/app/schemas/server_time.py" defines "ServerTimeResponse"

  Scenario: Criterion 4 - unit and integration tests cover shape, offset and freshness
    When the test files "backend/tests/unit/test_server_time_unit.py", "backend/tests/integration/test_server_time_integration.py", "backend/tests/integration/test_echo_integration.py" and "backend/tests/unit/test_main_unit.py" are run with pytest
    Then the summary line reports "0 failed"

  Scenario: Criterion 5 - GET /api/echo returns the msg query parameter
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: Criterion 5 variant - msg is returned verbatim, including encoded spaces
    When a client sends a GET request to "/api/echo?msg=hello%20world"
    Then the response status code is 200
    And the response body is {"echo": "hello world"}

  Scenario: Edge case - GET /api/echo without msg answers 422 (edge case)
    When a client sends a GET request to "/api/echo" with no "msg" query parameter
    Then the response status code is 422
    And the response body names the missing "msg" query parameter

  Scenario: Edge case - a non-GET method on /api/time answers 405 (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
