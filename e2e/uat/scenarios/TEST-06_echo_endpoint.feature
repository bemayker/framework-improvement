Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I gave it
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend is running from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A message is echoed back with status 200
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: A request with no msg parameter is rejected with 422
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response status code is neither 500 nor an empty 200
    And the response body "detail" list has an entry with type "missing" and location "query", "msg"

  Scenario: A msg longer than 200 characters is rejected with 422
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the response body "detail" list has an entry with type "string_too_long" and location "query", "msg"
    And that entry carries the context max_length 200

  Scenario: The 200 character bound is stated in the schema, not in the handler (edge case)
    When a client sends a GET request to "/api/echo" with a "msg" of exactly 200 characters
    Then the response status code is 200
    And the response body field "echo" is the same 200 characters
    And the handler in "backend/app/routers/echo.py" contains no length check
    And "EchoQuery.msg" in "backend/app/schemas/echo.py" declares a max_length of 200

  Scenario: The response body is described by a Pydantic schema
    When I open "http://localhost:8010/docs"
    Then "GET /api/echo" is listed under the "echo" tag
    And its 200 response shows the "EchoResponse" schema with a single string field "echo"
    And its "msg" parameter is shown as required with a maximum length of 200
