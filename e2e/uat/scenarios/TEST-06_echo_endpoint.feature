Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I sent
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A message is echoed back with 200 (criterion 1)
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: A URL-encoded message is decoded and echoed unchanged (criterion 1)
    When a client sends a GET request to "/api/echo?msg=hello%20world"
    Then the response status code is 200
    And the response body field "echo" is "hello world"

  Scenario: A request without msg is rejected with the standard 422 (criterion 2)
    When a client sends a GET request to "/api/echo" with no "msg" query parameter
    Then the response status code is 422
    And the response body "detail" list has an entry of type "missing" located at "query", "msg"
    And the response is neither a 500 nor an empty 200

  Scenario: A message longer than 200 characters is rejected with 422 (criterion 3)
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the response body "detail" list has an entry of type "string_too_long" located at "query", "msg"
    And that entry's context states "max_length" is 200

  Scenario: A message of exactly 200 characters is accepted (edge case, criterion 3)
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response body field "echo" holds the same 200 characters

  Scenario: The 200-character bound is stated in the schema, not in the handler (criterion 3)
    When a reviewer opens "backend/app/schemas/echo.py" and "backend/app/routers/echo.py"
    Then the limit 200 appears in the schema as "MAX_ECHO_MESSAGE_LENGTH" used by "Field(max_length=...)"
    And the router contains no "len(" call and no condition on the message length

  Scenario: The response body is defined by a Pydantic schema (criterion 4)
    When a client reads "/openapi.json"
    Then the 200 response of "GET /api/echo" references the "EchoResponse" schema
    And "EchoResponse" has one string property "echo"
    And the route in "backend/app/routers/echo.py" declares response_model "EchoResponse"

  Scenario: The echo tests pass (criterion 4)
    When the tests in "backend/tests/unit/test_echo_unit.py", "backend/tests/integration/test_echo_integration.py" and "backend/tests/unit/test_main_unit.py" are run
    Then the run reports 0 failed
