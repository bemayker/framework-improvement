Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I sent
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A msg is echoed back with status 200 (criterion 1)
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is exactly {"echo": "hello"}

  Scenario: A URL-encoded msg is decoded before it is echoed (criterion 1)
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=hello%20world"
    Then the response status code is 200
    And the response body field "echo" is "hello world"

  Scenario: A request with no msg is rejected with FastAPI's standard 422 (criterion 2)
    Given the backend is running
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the first entry of the response body field "detail" has type "missing"
    And the first entry of the response body field "detail" has loc ["query", "msg"]

  Scenario: A msg of 201 characters is rejected with 422 (criterion 3)
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of 201 letters "a"
    Then the response status code is 422
    And the first entry of the response body field "detail" has type "string_too_long"
    And the first entry of the response body field "detail" has loc ["query", "msg"]
    And the first entry of the response body field "detail" has ctx {"max_length": 200}

  Scenario: A msg of exactly 200 characters is still accepted (edge case, criterion 3)
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of 200 letters "a"
    Then the response status code is 200
    And the response body field "echo" is the same 200 letters "a"

  Scenario: The 200-character bound is declared in the published schema (criterion 3)
    Given the backend is running
    When a client reads "/openapi.json"
    Then the "msg" parameter of GET "/api/echo" is required
    And the "msg" parameter schema has "maxLength" 200

  Scenario: The response body is defined by the EchoResponse schema (criterion 4)
    Given the backend is running
    When a client reads "/openapi.json"
    Then the 200 response of GET "/api/echo" references the "EchoResponse" schema
    And "EchoResponse" is listed under "components.schemas"
