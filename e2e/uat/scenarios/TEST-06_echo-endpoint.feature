Feature: TEST-06 Echo endpoint

  Background:
    Given the backend is running at "http://localhost:8010"

  Scenario: Criterion 1, msg is echoed back
    When I request "/api/echo?msg=hello"
    Then the status is 200
    And the body is {"echo": "hello"}

  Scenario: Criterion 1 edge, a URL-encoded message is decoded
    When I request "/api/echo?msg=hello%20world"
    Then the status is 200
    And the body is {"echo": "hello world"}

  Scenario: Criterion 2, a missing msg is a validation error
    When I request "/api/echo" without msg
    Then the status is 422
    And the first detail entry has type "missing" and loc ["query", "msg"]

  Scenario: Criterion 3, a 201-character msg is rejected
    When I request "/api/echo" with a msg of 201 letter "a" characters
    Then the status is 422
    And the first detail entry has type "string_too_long"

  Scenario: Criterion 3 edge, a 200-character msg is accepted
    When I request "/api/echo" with a msg of exactly 200 letter "a" characters
    Then the status is 200
    And the echo field holds the same 200 characters

  Scenario: Criterion 4, the response schema is published as EchoResponse
    When I open "/docs" and expand "GET /api/echo"
    Then the 200 response schema is named "EchoResponse"
    And it has one string property "echo"

  Scenario: Automated tests cover the endpoint
    When I run "uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py"
    Then the summary reports 0 failed
