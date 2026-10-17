Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg=<text> to return the text I gave it
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A given message is echoed back with status 200
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body has exactly one key, "echo"
    And the response body field "echo" is "hello"

  Scenario: A request with no msg is rejected with the standard 422
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response body has a "detail" list with one entry
    And that entry has type "missing"
    And that entry has loc ["query", "msg"]

  Scenario: A msg longer than 200 characters is rejected with the standard 422
    When a client sends a GET request to "/api/echo" with "msg" set to 201 letters "a"
    Then the response status code is 422
    And the response body has a "detail" list with one entry
    And that entry has type "string_too_long"
    And that entry has loc ["query", "msg"]
    And that entry has ctx "max_length" equal to 200

  Scenario: The 200-character bound is stated in the published schema, not checked in the handler
    When a client opens the OpenAPI document at "/openapi.json"
    Then the "msg" query parameter of "GET /api/echo" is required
    And the "msg" query parameter has "maxLength" equal to 200

  Scenario: The response body is defined by the EchoResponse Pydantic schema
    When a client opens the OpenAPI document at "/openapi.json"
    Then the 200 response of "GET /api/echo" references the schema "EchoResponse"
    And the schema "EchoResponse" has one required string property "echo"

  Scenario: A msg of exactly 200 characters is accepted (edge case)
    When a client sends a GET request to "/api/echo" with "msg" set to 200 letters "a"
    Then the response status code is 200
    And the response body field "echo" is the same 200 letters

  Scenario: A present but empty msg is accepted (edge case)
    When a client sends a GET request to "/api/echo?msg="
    Then the response status code is 200
    And the response body field "echo" is the empty string
