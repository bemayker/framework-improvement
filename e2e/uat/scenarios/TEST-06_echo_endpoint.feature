Feature: TEST-06 Echo endpoint
  GET /api/echo?msg={text} returns the text it was given, so a caller can prove
  the API is reachable and that query-string handling works end to end.
  There is no UI for this endpoint, so the steps are HTTP requests and responses.

  Background:
    Given the backend is running at http://localhost:8010

  Scenario: Criterion 1 - a message is echoed with status 200
    When I request GET /api/echo?msg=hello
    Then the status is 200
    And the JSON body is exactly {"echo": "hello"}

  Scenario: Criterion 1 edge - a URL-encoded message is decoded
    When I request GET /api/echo?msg=hello%20world
    Then the status is 200
    And the JSON field echo is "hello world"

  Scenario: Criterion 2 - a missing msg returns 422
    When I request GET /api/echo with no query string
    Then the status is 422
    And the JSON field detail has one entry whose type is "missing"
    And that entry's loc is ["query", "msg"]

  Scenario: Criterion 3 - a msg of 201 characters returns 422
    When I request GET /api/echo with msg set to 201 letters "a"
    Then the status is 422
    And the JSON field detail has one entry whose type is "string_too_long"
    And that entry's ctx.max_length is 200

  Scenario: Criterion 3 edge - a msg of exactly 200 characters is accepted
    When I request GET /api/echo with msg set to 200 letters "a"
    Then the status is 200
    And the JSON field echo holds the same 200 letters

  Scenario: Criterion 3 - the bound is declared, not hand-checked
    When I read backend/app/routers/echo.py
    Then msg is declared with Query(max_length=MAX_ECHO_MSG_LENGTH)
    And the handler body contains no len( call
    And backend/app/schemas/echo.py defines MAX_ECHO_MSG_LENGTH = 200

  Scenario: Criterion 4 - the response body is defined by a Pydantic schema
    When I read the OpenAPI document at http://localhost:8010/openapi.json
    Then GET /api/echo responds with the schema EchoResponse
    And EchoResponse has one required string property "echo"

  Scenario: Automated tests for the feature pass
    When I run uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py
    Then the summary line reports 0 failed
