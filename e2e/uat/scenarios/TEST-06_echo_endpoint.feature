Feature: TEST-06 Echo endpoint
  As a caller of the API
  I want GET /api/echo to return the text I give it
  So that I can prove the API is reachable and query-string handling works end to end

  Background:
    Given the backend is running

  Scenario: Criterion 1, a message is echoed back
    When I request "/api/echo?msg=hello"
    Then the status is 200
    And the body is {"echo": "hello"}

  Scenario: Criterion 2, a missing msg is rejected with the standard validation response
    When I request "/api/echo" with no query string
    Then the status is 422
    And the detail entry has type "missing" and location "query", "msg"

  Scenario: Criterion 3, a msg longer than 200 characters is rejected
    When I request "/api/echo" with a "msg" of 201 characters
    Then the status is 422
    And the detail entry has type "string_too_long" and location "query", "msg"

  Scenario: Criterion 4, the response body is defined by a Pydantic schema
    When I read "/openapi.json"
    Then the 200 response of GET "/api/echo" references the "EchoResponse" schema

  Scenario: Edge case, a msg of exactly 200 characters is accepted
    When I request "/api/echo" with a "msg" of 200 characters
    Then the status is 200
    And the "echo" field equals the 200 characters I sent
