Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I sent
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A given msg is echoed back with status 200
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: A request with no msg is rejected with 422
    Given the backend is running
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response body "detail" names the missing "msg" query parameter
    And the response is neither a 500 error nor an empty 200

  Scenario: A msg longer than 200 characters is rejected with 422
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the response body "detail" reports a "string_too_long" error for the "msg" query parameter
    And the 200 character bound is declared on the parameter, not checked inside the handler

  Scenario: The response body is documented by a Pydantic schema
    Given the backend is running
    When a reader opens the OpenAPI docs at "/docs" for "GET /api/echo"
    Then the 200 response is documented as the "EchoResponse" schema
    And "EchoResponse" has one required string property "echo"

  Scenario: A msg of exactly 200 characters is accepted (edge case)
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response body field "echo" carries the same 200 characters unchanged
