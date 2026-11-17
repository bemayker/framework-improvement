Feature: TEST-06 Echo endpoint
  As an API caller
  I want GET /api/echo?msg={text} to return the text I gave it
  So that I can prove the API is reachable and query-string handling works

  Background:
    Given the backend is running at http://localhost:8010

  Scenario: Criterion 1 - msg is echoed back
    When I GET "/api/echo?msg=hello"
    Then the status is 200
    And the body is {"echo": "hello"}

  Scenario: Criterion 1 edge - an URL-encoded message is decoded
    When I GET "/api/echo?msg=hello%20world"
    Then the status is 200
    And the body is {"echo": "hello world"}

  Scenario: Criterion 2 - missing msg is rejected with 422
    When I GET "/api/echo" with no query string
    Then the status is 422
    And the body has a "detail" entry with type "missing" and loc ["query", "msg"]

  Scenario: Criterion 3 - msg over 200 characters is rejected with 422
    When I GET "/api/echo" with a 201-character msg
    Then the status is 422
    And the body has a "detail" entry with type "string_too_long" and loc ["query", "msg"]

  Scenario: Criterion 3 edge - msg of exactly 200 characters is accepted
    When I GET "/api/echo" with a 200-character msg
    Then the status is 200
    And the "echo" value is the same 200 characters

  Scenario: Criterion 4 - the response body is defined by a Pydantic schema
    When I open "/openapi.json"
    Then the 200 response of GET /api/echo references the "EchoResponse" schema
    And running the tests in backend/tests/unit/test_echo_unit.py, backend/tests/integration/test_echo_integration.py and backend/tests/unit/test_main_unit.py gives a passing run with no failed or errored test and exit code 0
