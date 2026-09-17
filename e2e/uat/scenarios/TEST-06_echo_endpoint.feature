Feature: TEST-06 Echo endpoint
  As an operator of the Task Notes app
  I want GET /api/echo to return the msg query parameter it was given
  So that a caller can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A valid msg is echoed back unchanged
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is exactly {"echo": "hello"}

  Scenario: A missing msg answers 422, never 500 or an empty 200
    Given the backend is running
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response body is the framework's standard validation detail
    And the validation detail's single entry has "loc" equal to ["query", "msg"] and "type" equal to "missing"

  Scenario: A msg longer than 200 characters answers 422, with the bound declared in the schema
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a 201-character msg
    Then the response status code is 422
    And the validation detail's single entry has "type" equal to "string_too_long" and "ctx.max_length" equal to 200
    And the 200-character bound is declared as Query(max_length=200) on the route, not checked in the handler body

  Scenario: A msg of exactly 200 characters is accepted (boundary edge case)
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a msg of exactly 200 characters
    Then the response status code is 200
    And the response body echoes all 200 characters unchanged

  Scenario: The response body is defined by a Pydantic schema, not a bare dict
    Given the backend is running
    When a client sends a GET request to "/openapi.json"
    Then the response status code is 200
    And the "/api/echo" GET 200 response references a named "EchoResponse" schema
    And that schema declares a single property "echo" of type "string"
