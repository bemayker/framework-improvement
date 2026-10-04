Feature: TEST-11 Echo endpoint trims surrounding whitespace
  GET /api/echo?msg={text} returns the text with leading and trailing whitespace
  removed. The 200-character limit applies to the message as sent, before trimming.

  Background:
    Given the backend is running and reachable at http://localhost:8010

  Scenario: Criterion 1 - surrounding spaces are removed
    When a client sends GET /api/echo?msg=%20%20hello%20%20
    Then the response status is 200
    And the response body is {"echo": "hello"}

  Scenario: Criterion 2 - a whitespace-only msg returns an empty echo
    When a client sends GET /api/echo?msg=%20%20%20
    Then the response status is 200
    And the response body is {"echo": ""}

  Scenario: Criterion 3 - the 200-character limit applies before trimming
    When a client sends GET /api/echo with a msg of 201 characters as sent (1 space, 199 letters, 1 space)
    Then the response status is 422
    And the first validation detail has type "string_too_long" and location ["query", "msg"]

  Scenario: Criterion 4 - unit and integration tests cover criteria 1 to 3
    Given the repository with the TEST-11 changes
    When the backend test suite runs for the echo unit and integration tests
    Then every test passes, including the trimming tests for criteria 1 to 3

  Scenario: Edge case - exactly 200 characters as sent is accepted and trimmed
    When a client sends GET /api/echo with a msg of exactly 200 characters as sent (1 space, 198 letters, 1 space)
    Then the response status is 200
    And the "echo" value is the 198 letters with no surrounding spaces

  Scenario: Edge case - inner whitespace is preserved
    When a client sends GET /api/echo?msg=%09hello%20%20world%0A
    Then the response status is 200
    And the response body is {"echo": "hello  world"}
