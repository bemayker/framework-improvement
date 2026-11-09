Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I sent
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"
    And the backend is running

  Scenario: A message is echoed back with status 200 (criterion 1)
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is exactly {"echo": "hello"}

  Scenario: An encoded query string is decoded before it is echoed (criterion 1)
    When a client sends a GET request to "/api/echo?msg=hello%20world"
    Then the response status code is 200
    And the response body is exactly {"echo": "hello world"}

  Scenario: A request with no msg is rejected with the standard 422 (criterion 2)
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response status code is neither 500 nor 200
    And the first entry of the response body field "detail" has type "missing"
    And that entry's "loc" is ["query", "msg"]

  Scenario: A msg of 201 characters is rejected with 422 (criterion 3)
    When a client sends a GET request to "/api/echo" with a msg of 201 characters
    Then the response status code is 422
    And the first entry of the response body field "detail" has type "string_too_long"
    And that entry's "loc" is ["query", "msg"]

  Scenario: A msg of exactly 200 characters is accepted (edge case, criterion 3)
    When a client sends a GET request to "/api/echo" with a msg of exactly 200 characters
    Then the response status code is 200
    And the response body field "echo" is that same 200 character msg

  Scenario: The 200 character bound is declared on the parameter, not checked in the handler (criterion 3)
    When a client reads the OpenAPI document at "/openapi.json"
    Then the "msg" query parameter of GET "/api/echo" is marked required
    And its schema carries "maxLength" 200

  Scenario: The response body is defined by a Pydantic schema (criterion 4)
    When a client reads the OpenAPI document at "/openapi.json"
    Then the 200 response of GET "/api/echo" references the "EchoResponse" schema
    And the "EchoResponse" schema has a required string property "echo"

  Scenario: The echo tests pass (criteria 1 to 4)
    When the command "uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/unit/test_main_unit.py tests/integration/test_echo_integration.py" is run from the repository root
    Then the run reports "0 failed"
