Feature: TEST-06 Echo endpoint
  A client can send a message to GET /api/echo and receive it back.

  Scenario: Criterion 1 - the endpoint echoes the message
    Given the backend is running
    When a client sends GET /api/echo?msg=hello
    Then the status is 200
    And the body is {"echo": "hello"}

  Scenario: Criterion 2 - a missing message is rejected with the standard 422
    Given the backend is running
    When a client sends GET /api/echo with no query string
    Then the status is 422
    And the body's "detail" names the missing query parameter "msg"

  Scenario: Criterion 3 - a message over 200 characters is rejected with 422
    Given the backend is running
    When a client sends GET /api/echo with a "msg" of 201 characters
    Then the status is 422
    And the body's "detail" reports the 200-character limit

  Scenario: Criterion 4 - the response is described by the EchoResponse schema
    Given the API's OpenAPI document at /openapi.json
    When a reader looks up the GET /api/echo 200 response
    Then it references the "EchoResponse" schema

  Scenario: Edge case - a message of exactly 200 characters is accepted
    Given the backend is running
    When a client sends GET /api/echo with a "msg" of exactly 200 characters
    Then the status is 200
    And the "echo" value equals the message sent
