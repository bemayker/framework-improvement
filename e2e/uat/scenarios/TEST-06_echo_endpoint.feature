Feature: TEST-06 Echo endpoint
  As an API client
  I want GET /api/echo?msg={text} to return the text I sent
  So that I can prove the API is reachable and query-string handling works end to end

  Background:
    Given the backend API is running and reachable at its base URL

  Scenario: A message is echoed back (criterion 1)
    When a client sends GET /api/echo?msg=hello
    Then the response status is 200
    And the response body is {"echo": "hello"}

  Scenario: An encoded message comes back decoded (criterion 1, edge case)
    When a client sends GET /api/echo?msg=hello%20world
    Then the response status is 200
    And the response body is {"echo": "hello world"}

  Scenario: A missing msg parameter is rejected (criterion 2)
    When a client sends GET /api/echo with no query string
    Then the response status is 422
    And the first entry of the "detail" list has type "missing"
    And that entry's loc is ["query", "msg"]

  Scenario: A msg of 201 characters is rejected (criterion 3)
    When a client sends GET /api/echo with a msg of 201 characters
    Then the response status is 422
    And the first entry of the "detail" list has type "string_too_long"
    And that entry's ctx max_length is 200

  Scenario: A msg of exactly 200 characters is accepted (criterion 3, boundary edge case)
    When a client sends GET /api/echo with a msg of exactly 200 characters
    Then the response status is 200
    And the "echo" value equals the 200 characters sent

  Scenario: The response body is defined by the EchoResponse schema (criterion 4)
    When a client reads /openapi.json
    Then the 200 response of GET /api/echo references the schema "EchoResponse"
    And the "msg" query parameter is required
    And the "msg" query parameter declares maxLength 200
