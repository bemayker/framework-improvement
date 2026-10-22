Feature: TEST-06 Echo endpoint
  GET /api/echo?msg={text} returns the text it was given, so a caller can
  prove the API is reachable and that query-string handling works end to end.
  There is no UI for this endpoint; scenarios are HTTP requests against the
  running backend.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  # Criterion 1
  Scenario: A message is echoed back
    When a client sends GET "/api/echo?msg=hello"
    Then the status is 200
    And the body is {"echo": "hello"}

  # Criterion 1, query-string decoding
  Scenario: An encoded message is decoded before it is echoed
    When a client sends GET "/api/echo?msg=hello%20world"
    Then the status is 200
    And the body is {"echo": "hello world"}

  # Criterion 2
  Scenario: A missing msg is rejected with the standard validation response
    When a client sends GET "/api/echo" with no query string
    Then the status is 422
    And "detail[0].type" is "missing"
    And "detail[0].loc" is ["query", "msg"]

  # Criterion 3
  Scenario: A msg longer than 200 characters is rejected
    When a client sends GET "/api/echo" with a msg of 201 characters
    Then the status is 422
    And "detail[0].type" is "string_too_long"
    And "detail[0].loc" is ["query", "msg"]

  # Criterion 3, edge case (boundary)
  Scenario: A msg of exactly 200 characters is accepted
    When a client sends GET "/api/echo" with a msg of 200 characters
    Then the status is 200
    And the body "echo" equals the 200 characters sent

  # Criterion 3, the bound is declared rather than hand-checked
  Scenario: The length bound is declared in the OpenAPI document
    When a reader opens "/openapi.json"
    Then the "msg" parameter of GET "/api/echo" has "in" "query" and "required" true
    And its schema has "maxLength" 200

  # Criterion 4
  Scenario: The response is defined by the EchoResponse schema
    When a reader opens "/openapi.json"
    Then the 200 response of GET "/api/echo" references "#/components/schemas/EchoResponse"
    And "EchoResponse" lists "echo" as a required string property

  # Regression guard for criteria 1 to 4
  Scenario: The echo tests pass
    When the tests in "tests/unit/test_echo_unit.py", "tests/unit/test_main_unit.py" and "tests/integration/test_echo_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run reports 0 failed
