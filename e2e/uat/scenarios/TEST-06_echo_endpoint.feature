Feature: TEST-06 Echo endpoint returns the text it was given

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  Scenario: Criterion 1 - a msg is echoed back
    When a client requests "GET /api/echo?msg=hello"
    Then the response status is 200
    And the response body is {"echo": "hello"}

  Scenario: Criterion 1 - an URL-encoded msg is decoded end to end
    When a client requests "GET /api/echo?msg=a%26b%3Dc%20d"
    Then the response status is 200
    And the response body is {"echo": "a&b=c d"}

  Scenario: Criterion 2 - a missing msg is rejected with 422
    When a client requests "GET /api/echo" with no query string
    Then the response status is 422
    And the first entry of the body's "detail" has type "missing" and loc ["query", "msg"]

  Scenario: Criterion 3 - a msg of 201 characters is rejected with 422
    When a client requests "GET /api/echo" with a "msg" of 201 characters
    Then the response status is 422
    And the first entry of the body's "detail" has type "string_too_long" and loc ["query", "msg"]

  Scenario: Criterion 3 - the bound is declared on the query parameter, not hand-checked
    When a reader opens "/openapi.json"
    Then the "msg" query parameter of "GET /api/echo" is required with maxLength 200

  Scenario: Edge case - a msg of exactly 200 characters is accepted
    When a client requests "GET /api/echo" with a "msg" of 200 characters
    Then the response status is 200
    And the "echo" field of the body equals the 200 characters sent

  Scenario: Edge case - an empty msg is accepted
    When a client requests "GET /api/echo?msg="
    Then the response status is 200
    And the response body is {"echo": ""}

  Scenario: Criterion 4 - the response body is defined by a Pydantic schema
    When a reader opens "/openapi.json"
    Then the 200 response of "GET /api/echo" references the "EchoResponse" schema
    And the "EchoResponse" schema has one string property "echo"

  Scenario: Criterion 4 - the echo test files pass
    When the tests are run with "uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py"
    Then the run reports 0 failed
