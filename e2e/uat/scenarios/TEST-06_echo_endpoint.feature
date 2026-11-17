Feature: TEST-06 Echo endpoint
  As an API caller
  I want GET /api/echo?msg={text} to return the text I gave it
  So that I can prove the API is reachable and query-string handling works

  Background:
    Given the backend is running at "http://localhost:8010"

  Scenario: Criterion 1 - echo returns the given message
    When I request "GET /api/echo?msg=hello"
    Then the status is 200
    And the body is {"echo": "hello"}

  Scenario: Criterion 2 - missing msg is a standard validation error
    When I request "GET /api/echo" with no query string
    Then the status is 422
    And the first error in "detail" has type "missing" and location ["query", "msg"]

  Scenario: Criterion 3 - msg over 200 characters is rejected
    When I request "GET /api/echo" with a 201-character "msg"
    Then the status is 422
    And the first error in "detail" has type "string_too_long" and location ["query", "msg"]

  Scenario: Criterion 4 - the response body is defined by a Pydantic schema
    When I open the OpenAPI document at "/openapi.json"
    Then the 200 response of "GET /api/echo" references the "EchoResponse" schema

  Scenario: Edge case - msg of exactly 200 characters is accepted
    When I request "GET /api/echo" with a 200-character "msg"
    Then the status is 200
    And the "echo" field holds all 200 characters
