Feature: FEAT-1 Server time endpoint

  Background:
    Given the backend is running at "http://localhost:8010"

  Scenario: Criterion 1, GET /api/time returns the server time and timezone
    When a client requests GET "/api/time"
    Then the response status is 200
    And the response body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"

  Scenario: Criterion 2, now is computed per request in UTC with an explicit offset
    When a client requests GET "/api/time" and notes "now"
    And the client waits one second
    And the client requests GET "/api/time" again and notes the second "now"
    Then the two "now" values differ
    And the second "now" is later than the first
    And both values end in "+00:00"

  Scenario: Criterion 3, the response body is defined by a Pydantic schema
    When a client requests GET "/openapi.json"
    Then the 200 response of GET "/api/time" references the "ServerTimeResponse" component
    And the "ServerTimeResponse" component lists "now" and "timezone"

  Scenario: Criterion 4, the server time tests pass
    Given the backend test suite
    When the tests in "backend/tests/unit/test_server_time_unit.py", "backend/tests/unit/test_main_unit.py", "backend/tests/integration/test_server_time_integration.py" and "backend/tests/integration/test_echo_integration.py" run
    Then the summary reports 0 failed

  Scenario: Criterion 5, GET /api/echo returns the message
    When a client requests GET "/api/echo?msg=hello"
    Then the response status is 200
    And the response body is {"echo": "hello"}

  Scenario: Criterion 6, the offset is pinned to +00:00
    When a client requests GET "/api/time"
    Then "now" ends with "+00:00"
    And "now" contains no "Z"

  Scenario: Edge case, a naive datetime is rejected by the schema
    Given the "ServerTimeResponse" schema
    When it is built with a "now" value that has no UTC offset
    Then validation fails

  Scenario: Edge case, GET /api/echo without msg is rejected
    When a client requests GET "/api/echo" without a "msg" query parameter
    Then the response status is 422
    And the first error has type "missing" and location "query", "msg"
