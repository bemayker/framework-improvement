Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I gave it
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A given msg is echoed back with status 200
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: A URL-encoded msg arrives decoded
    When a client sends a GET request to "/api/echo?msg=hello%20world"
    Then the response status code is 200
    And the response body is {"echo": "hello world"}

  Scenario: A missing msg is rejected with the standard validation 422
    When a client sends a GET request to "/api/echo" with no "msg" parameter
    Then the response status code is 422
    And the response body "detail" list has an entry of type "missing"
    And that entry's "loc" is ["query", "msg"]

  Scenario: A msg longer than 200 characters is rejected with 422
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the response body "detail" list has an entry of type "string_too_long"
    And that entry's "loc" is ["query", "msg"]
    And that entry's "ctx" names a max_length of 200

  Scenario: The 200-character bound is declared in the schema, not hand-rolled
    When a reviewer reads "/openapi.json" at paths "/api/echo", "get", "parameters"
    Then the "msg" parameter is required
    And the "msg" parameter schema has "maxLength" 200

  Scenario: The response body is defined by a Pydantic schema
    When a reviewer reads "backend/app/schemas/echo.py" and "backend/app/routers/echo.py"
    Then "EchoResponse" is a Pydantic model with one string field "echo"
    And the route is declared with "response_model=EchoResponse"
    And the handler returns an "EchoResponse" instance, not a dict literal
    And the echo unit and integration tests pass, with no failed or errored test and exit code 0

  Scenario: A msg of exactly 200 characters is still accepted (edge case)
    When a client sends a GET request to "/api/echo" with a "msg" of 200 characters
    Then the response status code is 200
    And the response body "echo" equals the 200 characters sent
