Feature: TEST-06 Echo endpoint
  GET /api/echo?msg={text} returns the text it was given, so a caller can
  prove the API is reachable and that query-string handling works end to end.

  Background:
    Given the backend is running and reachable at its base URL

  Scenario: A msg is echoed back (criterion 1)
    When a client sends GET /api/echo?msg=hello
    Then the response status is 200
    And the response body is {"echo": "hello"}

  Scenario: A missing msg is rejected with the standard validation response (criterion 2)
    When a client sends GET /api/echo with no query string
    Then the response status is 422
    And the detail of the response body names the missing query field msg

  Scenario: A msg longer than 200 characters is rejected (criterion 3)
    When a client sends GET /api/echo with a msg of 201 characters
    Then the response status is 422
    And the first detail entry of the response body has the type string_too_long

  Scenario: A msg of exactly 200 characters is accepted (criterion 3, edge case)
    When a client sends GET /api/echo with a msg of 200 characters
    Then the response status is 200
    And the echo in the response body equals the msg that was sent

  Scenario: The response body is defined by a Pydantic schema (criterion 4)
    When a client reads /openapi.json
    Then the 200 response of GET /api/echo references the EchoResponse schema
