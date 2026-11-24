Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I gave it
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A message is echoed back with status 200
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: A URL-encoded message is decoded before it is echoed
    When a client sends a GET request to "/api/echo?msg=hello%20world"
    Then the response status code is 200
    And the response body is {"echo": "hello world"}

  Scenario: A missing msg is rejected with the standard validation response
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response body has a "detail" entry of type "missing" located at "query" and "msg"
    And the response body has no "echo" key

  Scenario: A msg longer than 200 characters is rejected
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the response body has a "detail" entry of type "string_too_long" located at "query" and "msg"
    And that entry's context states a max_length of 200

  Scenario: A msg of exactly 200 characters is accepted (edge case)
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response body field "echo" holds all 200 characters of the msg

  Scenario: The length bound and the response body are declared in the schema, not in handler code
    When I open "http://localhost:8010/docs" and expand "GET /api/echo"
    Then the "msg" parameter is marked required and shows a maximum length of 200
    And the 200 response shows the "EchoResponse" schema with one required string field "echo"

  Scenario: The echo tests pass
    When I run "uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py"
    Then the run passes: no test failed or errored and the command exits 0
