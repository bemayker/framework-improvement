Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I sent
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A given msg is echoed back (criterion 1)
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: A URL-encoded msg is decoded before it is echoed (criterion 1)
    When a client sends a GET request to "/api/echo?msg=hello%20world"
    Then the response status code is 200
    And the response body is {"echo": "hello world"}

  Scenario: A missing msg is rejected with 422 (criterion 2)
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response body has a "detail" entry of type "missing" located at "query" and "msg"
    And the response status code is neither 500 nor 200

  Scenario: A msg of 201 characters is rejected with 422 (criterion 3)
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the response body has a "detail" entry of type "string_too_long" located at "query" and "msg"
    And that entry's context states a max_length of 200

  Scenario: A msg of exactly 200 characters is accepted (criterion 3, boundary edge case)
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response body field "echo" equals the 200 characters that were sent

  Scenario: The length bound is stated in the schema, not checked in the handler (criterion 3)
    Given the file "backend/app/schemas/echo.py"
    Then "EchoQuery.msg" is declared with a max_length of 200
    And the handler in "backend/app/routers/echo.py" contains no length check, no condition on "msg" and no HTTPException

  Scenario: The response body is described by the EchoResponse Pydantic schema (criterion 4)
    When a client reads "/openapi.json"
    Then the 200 response of "GET /api/echo" references "#/components/schemas/EchoResponse"
    And "EchoResponse" has one string property "echo"
    And "EchoResponse" is defined in "backend/app/schemas/echo.py"

  Scenario: The echo tests pass
    When the command "uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py" is run
    Then the summary line reports no failed or errored test
    And the command exits 0
