Feature: FEAT-1 Server time endpoint
  As an API client
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API

  Background:
    Given the backend is running on "http://localhost:8010"

  Scenario: Criterion 1 - GET /api/time returns 200 with now and timezone
    When I request GET "/api/time"
    Then the status is 200
    And the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"
    And "now" ends with "+00:00"

  Scenario: Criterion 2 - now is computed per request, in UTC, never naive
    When I request GET "/api/time"
    And I wait one second
    And I request GET "/api/time" again
    Then the two "now" values differ
    And the second "now" is later than the first
    And both "now" values end with "+00:00" and not "Z"

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    Given the API's OpenAPI document at "/openapi.json"
    When I look up the 200 response of GET "/api/time"
    Then it references the "ServerTimeResponse" schema

  Scenario: Criterion 4 - unit and integration tests cover shape, offset and freshness
    When I run the tests in "backend/tests/unit/test_server_time_unit.py" and "backend/tests/integration/test_server_time_integration.py"
    Then the run passes: its summary line reports no failed or errored test and the command exits 0

  Scenario: Criterion 5 - GET /api/echo returns the message
    When I request GET "/api/echo?msg=hello%20world"
    Then the status is 200
    And the body is {"echo": "hello world"}

  Scenario: Edge case - echo without msg is rejected
    When I request GET "/api/echo" without a "msg" query parameter
    Then the status is 422
    And the validation body names the missing "msg" query parameter

  Scenario: Edge case - time endpoint rejects other methods
    When I request POST "/api/time"
    Then the status is 405
