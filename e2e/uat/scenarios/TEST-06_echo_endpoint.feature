Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I gave it
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A message is echoed back with status 200 (criterion 1)
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is exactly {"echo": "hello"}

  Scenario: A URL-encoded message is decoded and echoed (criterion 1, encoding)
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=hello%20world"
    Then the response status code is 200
    And the response body field "echo" is "hello world"

  Scenario: A request with no msg is rejected with 422 (criterion 2)
    Given the backend is running
    When a client sends a GET request to "/api/echo"
    Then the response status code is 422
    And the response body field "detail[0].type" is "missing"
    And the response body field "detail[0].loc" is ["query", "msg"]
    And the response is neither a 500 nor an empty 200

  Scenario: A message of 201 characters is rejected with 422 (criterion 3)
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the response body field "detail[0].type" is "string_too_long"
    And the response body field "detail[0].loc" is ["query", "msg"]
    And the response body field "detail[0].ctx.max_length" is 200

  Scenario: A message of exactly 200 characters is accepted (edge case, criterion 3 boundary)
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response body field "echo" is the same 200 characters, unchanged

  Scenario: An empty message is echoed as an empty string (edge case)
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg="
    Then the response status code is 200
    And the response body is exactly {"echo": ""}

  Scenario: The response body is defined by a Pydantic schema (criterion 4)
    Given the backend is running
    When a client reads "/openapi.json"
    Then the 200 response of "GET /api/echo" references the "EchoResponse" schema
    And the "EchoResponse" schema has one string property "echo"
    And the "msg" parameter of "GET /api/echo" declares "maxLength" 200
