Feature: TEST-06 Echo endpoint
  GET /api/echo?msg={text} returns the text it was given, so a caller can prove
  the API is reachable and that query-string handling works end to end.

  Background:
    Given the backend is running

  Scenario: Criterion 1, a message is echoed back
    When a client sends GET /api/echo?msg=hello
    Then the status is 200
    And the body is {"echo": "hello"}

  Scenario: Criterion 2, a missing message is rejected with the standard validation response
    When a client sends GET /api/echo with no query string
    Then the status is 422
    And the first detail entry has type "missing" and location ["query", "msg"]

  Scenario: Criterion 3, a message longer than 200 characters is rejected
    When a client sends GET /api/echo with a msg of 201 characters
    Then the status is 422
    And the first detail entry has type "string_too_long" and location ["query", "msg"]
    And the handler performs no length check of its own

  Scenario: Criterion 4, the response body is defined by a Pydantic schema
    When a client reads /openapi.json
    Then the 200 response of GET /api/echo references the "EchoResponse" schema
    And the "msg" parameter is required and declares maxLength 200

  Scenario: Edge case, a message of exactly 200 characters is accepted
    When a client sends GET /api/echo with a msg of exactly 200 characters
    Then the status is 200
    And the echo value equals the 200 characters sent

  Scenario: Verification, the echo tests pass
    When the tests in backend/tests/integration/test_echo_integration.py and backend/tests/unit/test_main_unit.py are run
    Then the run reports 0 failed
