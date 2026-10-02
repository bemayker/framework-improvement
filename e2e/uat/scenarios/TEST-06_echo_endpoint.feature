Feature: TEST-06 Echo endpoint
  GET /api/echo?msg={text} returns the text it was given, so a caller can prove
  the API is reachable and that query-string handling works end to end.

  Background:
    Given the backend is running and reachable at http://localhost:8010

  Scenario: Criterion 1 - msg is echoed back
    When a client sends GET /api/echo?msg=hello
    Then the response status is 200
    And the response body is {"echo": "hello"}

  Scenario: Criterion 2 - missing msg is rejected with the standard validation response
    When a client sends GET /api/echo with no query string
    Then the response status is 422
    And the first validation detail has type "missing" and location ["query", "msg"]

  Scenario: Criterion 3 - msg longer than 200 characters is rejected
    When a client sends GET /api/echo with a msg of 201 characters
    Then the response status is 422
    And the first validation detail has type "string_too_long" and location ["query", "msg"]

  Scenario: Criterion 4 - the response body is defined by the EchoResponse schema
    When a reader opens the OpenAPI document at /openapi.json
    Then the 200 response of GET /api/echo references the "EchoResponse" schema
    And the "EchoResponse" schema has a single required string property "echo"

  Scenario: Edge case - exactly 200 characters is accepted
    When a client sends GET /api/echo with a msg of exactly 200 characters
    Then the response status is 200
    And the "echo" value equals the 200 characters sent

  Scenario: Edge case - URL-encoded text round-trips unchanged
    When a client sends GET /api/echo with msg "hello world & more" URL-encoded
    Then the response status is 200
    And the response body is {"echo": "hello world & more"}
