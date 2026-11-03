Feature: TEST-06 Echo endpoint
  As an API caller
  I want GET /api/echo to return the text I give it
  So that I can prove the API is reachable and query-string handling works end to end

  Background:
    Given the backend is running and reachable on host port 8010

  # Criterion 1
  Scenario: A given msg is echoed back
    When I request "GET /api/echo?msg=hello"
    Then the status is 200
    And the body is {"echo": "hello"}

  # Criterion 2
  Scenario: A missing msg is rejected with the standard validation response
    When I request "GET /api/echo" with no query string
    Then the status is 422
    And the error detail has type "missing" for the query parameter "msg"

  # Criterion 3
  Scenario: A msg over 200 characters is rejected
    When I request "GET /api/echo" with a msg of 201 characters
    Then the status is 422
    And the error detail has type "string_too_long" for the query parameter "msg"

  # Criterion 3, edge case
  Scenario: A msg of exactly 200 characters is accepted
    When I request "GET /api/echo" with a msg of exactly 200 characters
    Then the status is 200
    And the "echo" value equals the 200 characters sent

  # Criterion 4
  Scenario: The response body is defined by the EchoResponse schema
    When I open the OpenAPI schema at "/openapi.json"
    Then the 200 response of "GET /api/echo" references the "EchoResponse" schema
    And "EchoResponse" has one string property "echo"
