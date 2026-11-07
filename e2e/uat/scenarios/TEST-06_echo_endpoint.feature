Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I gave it
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A given msg is echoed back with status 200 (criterion 1)
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: A URL-encoded msg is decoded before it is echoed (edge case)
    When a client sends a GET request to "/api/echo?msg=a%26b%3Dc%20d"
    Then the response status code is 200
    And the response body field "echo" is "a&b=c d"

  Scenario: An empty msg is echoed as an empty string (edge case)
    When a client sends a GET request to "/api/echo?msg="
    Then the response status code is 200
    And the response body field "echo" is ""

  Scenario: A missing msg is rejected with 422 (criterion 2)
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the first entry of the body's "detail" has type "missing"
    And that entry's "loc" is ["query", "msg"]

  Scenario: A msg of 201 characters is rejected with 422 (criterion 3)
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the first entry of the body's "detail" has type "string_too_long"
    And that entry's "loc" is ["query", "msg"]

  Scenario: A msg of exactly 200 characters is accepted (criterion 3 boundary)
    When a client sends a GET request to "/api/echo" with a "msg" of 200 characters
    Then the response status code is 200
    And the response body field "echo" is those same 200 characters

  Scenario: The response body is defined by the EchoResponse schema (criterion 4)
    When a reader opens "/openapi.json"
    Then the 200 response of "GET /api/echo" references the "EchoResponse" schema
    And the "msg" query parameter is required with a maximum length of 200

  Scenario: Only GET is routed (edge case)
    When a client sends a POST request to "/api/echo?msg=hello"
    Then the response status code is 405
