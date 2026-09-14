Feature: TEST-06 Echo endpoint
  As a client of the Task Notes API
  I want GET /api/echo to return the text I send it
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"
    And the backend is running
    And the endpoint opens no database connection, so the state of the "db" service does not affect any scenario below

  Scenario: A msg query parameter is echoed back verbatim with HTTP 200
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body is exactly {"echo":"hello"}
    When the client sends a GET request to "/api/echo?msg=hello%20world"
    Then the response status code is 200
    And the response body is exactly {"echo":"hello world"}
    And the percent-encoded space was decoded and the text returned unchanged, with no trimming or escaping

  Scenario: A request with no msg is rejected as HTTP 422 by the framework's own validation
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422, neither a 500 nor an empty 200
    And the response body carries a "detail" list with a single entry
    And that entry's "loc" is ["query", "msg"]
    And that entry's "type" is "missing"
    And the 422 is FastAPI's standard validation response rather than a body the handler built

  Scenario: A msg longer than the 200-character maximum is rejected as HTTP 422
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the response body's "detail" entry has "type" "string_too_long"
    And that entry's "loc" is ["query", "msg"]
    And that entry's "ctx" reports a "max_length" of 200
    And the bound is declared as parameter metadata in the router, sourced from ECHO_MESSAGE_MAX_LENGTH in the schema module, not as a length check in the handler

  Scenario: The 200 response body is documented by the EchoResponse schema component
    When a client sends a GET request to "/openapi.json"
    Then the response status code is 200
    And the 200 response of "GET /api/echo" references the schema component "#/components/schemas/EchoResponse"
    And the "EchoResponse" component has exactly one property, "echo", of type "string"
    And the router returns that Pydantic model rather than a bare dict

  Scenario: A msg of exactly 200 characters is accepted (boundary edge case)
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response body echoes all 200 characters unchanged
    And 200 is therefore the last accepted length and 201 the first rejected one
