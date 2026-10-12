Feature: TEST-11 Echo endpoint trims surrounding whitespace
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text without surrounding whitespace
  So that padding in the input never leaks into the echoed value

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: Surrounding spaces are removed from the echoed message
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=%20%20hello%20%20"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: A whitespace-only message echoes an empty string
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=%20%20%20"
    Then the response status code is 200
    And the response body is {"echo": ""}

  Scenario: The 200 character limit applies to the message as sent, before trimming
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of one space, 199 "a" characters and one space (201 characters as sent)
    Then the response status code is 422
    And the response body "detail" reports a "string_too_long" error for the "msg" query parameter
    And the message is rejected even though it would be 199 characters after trimming

  Scenario: A padded message of exactly 200 characters as sent is accepted and trimmed (edge case)
    Given the backend is running
    When a client sends a GET request to "/api/echo" with a "msg" of two spaces, 196 "a" characters and two spaces (200 characters as sent)
    Then the response status code is 200
    And the response body field "echo" is exactly the 196 "a" characters with no spaces

  Scenario: Interior whitespace is kept while surrounding whitespace is removed (edge case)
    Given the backend is running
    When a client sends a GET request to "/api/echo?msg=%20%20hello%20world%20%20"
    Then the response status code is 200
    And the response body is {"echo": "hello world"}
