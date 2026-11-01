Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I gave it
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A message is echoed back with status 200
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is exactly {"echo": "hello"}

  Scenario: A request with no msg parameter is rejected with 422
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response is FastAPI's standard validation response, not a 500 and not an empty 200
    And the first entry of the response body's "detail" list has type "missing" and location "query", "msg"

  Scenario: A message longer than 200 characters is rejected with 422
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the first entry of the response body's "detail" list has type "string_too_long"
    And that entry's context states a max_length of 200
    And the bound is declared in the schema module and not checked by hand in the handler

  Scenario: The response body is defined by a Pydantic schema
    When a client sends a GET request to "/openapi.json"
    Then the 200 response of "/api/echo" references the "EchoResponse" schema
    And "EchoResponse" has a single string field "echo"

  Scenario: A message of exactly 200 characters is accepted while 201 is rejected (edge case)
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response field "echo" equals the 200-character input
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
