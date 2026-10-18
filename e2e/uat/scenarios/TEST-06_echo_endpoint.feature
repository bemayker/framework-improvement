Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I sent
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A msg is echoed back with status 200 (criterion 1)
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body has exactly one field "echo"
    And the response body field "echo" is "hello"

  Scenario: A request with no msg is rejected with the standard 422 (criterion 2)
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response body "detail" list has one entry of type "missing"
    And that entry's "loc" is "query" followed by "msg"

  Scenario: A msg of 201 characters is rejected with 422 (criterion 3)
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the response body "detail" list has one entry of type "string_too_long"
    And that entry's "ctx.max_length" is 200

  Scenario: The 200-character bound is declared in the schema, not checked in the handler (criterion 3)
    Given the source file "backend/app/schemas/echo.py"
    Then "EchoQuery.msg" is declared with "Field(max_length=ECHO_MSG_MAX_LENGTH)"
    And "ECHO_MSG_MAX_LENGTH" equals 200
    And the handler in "backend/app/routers/echo.py" contains no "len(" call, no length comparison and no "HTTPException"

  Scenario: The response body is defined by a Pydantic schema (criterion 4)
    Given the source file "backend/app/routers/echo.py"
    Then the route declares response_model "EchoResponse" imported from "app.schemas.echo"
    And the handler returns an "EchoResponse" instance, not a dict literal
    And the OpenAPI document at "/docs" shows the 200 response schema as "EchoResponse" with field "echo"

  Scenario: A msg of exactly 200 characters is accepted (edge case)
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response body field "echo" equals the 200-character "msg"

  Scenario: An empty msg is echoed as an empty string (edge case)
    When a client sends a GET request to "/api/echo?msg="
    Then the response status code is 200
    And the response body field "echo" is ""

  Scenario: A URL-encoded msg is echoed decoded (edge case)
    When a client sends a GET request to "/api/echo?msg=hello%20world%26more"
    Then the response status code is 200
    And the response body field "echo" is "hello world&more"

  Scenario: The criteria are covered by the automated tests (verification)
    When the tests "tests/unit/test_echo_unit.py", "tests/unit/test_main_unit.py" and "tests/integration/test_echo_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run reports 0 failed
