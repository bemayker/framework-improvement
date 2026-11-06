Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text it was given
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A message is echoed back with status 200
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: A request with no msg is rejected with status 422
    Given the backend is running
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response status code is neither 500 nor an empty 200
    And the "detail" entry has type "missing"
    And the "detail" entry locates the problem at "query" and "msg"

  Scenario: A msg longer than 200 characters is rejected with status 422
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the "detail" entry has type "string_too_long"
    And the "detail" entry carries a max_length of 200
    And the published OpenAPI document declares "msg" on GET "/api/echo" as required with maxLength 200

  Scenario: The response body is defined by a Pydantic schema
    Given the backend's published OpenAPI document at "/openapi.json"
    When a reader looks up the 200 response of GET "/api/echo"
    Then it references the "EchoResponse" schema
    And that schema has one property "echo" of type string
    And the "EchoResponse" class lives in "backend/app/schemas/echo.py"
    And the unit tests "backend/tests/unit/test_echo_unit.py" and "backend/tests/unit/test_main_unit.py" and the integration tests "backend/tests/integration/test_echo_integration.py" report 0 failed

  Scenario: A msg of exactly 200 characters is accepted and echoed verbatim (edge case)
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response body field "echo" equals the 200 characters that were sent, unchanged
