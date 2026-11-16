Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text it was given
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A request with msg returns 200 and the echoed text (criterion 1)
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: A request with no msg returns the standard 422 (criterion 2)
    When a client sends a GET request to "/api/echo" without a "msg" query parameter
    Then the response status code is 422, not 500 and not 200
    And the first entry of the response body's "detail" list has type "missing"
    And that entry's "loc" is ["query", "msg"]

  Scenario: A msg of 201 characters returns 422 (criterion 3)
    When a client sends a GET request to "/api/echo" with a "msg" of 201 "a" characters
    Then the response status code is 422
    And the first entry of the response body's "detail" list has type "string_too_long"
    And that entry's "ctx" is {"max_length": 200}

  Scenario: A msg of exactly 200 characters is accepted (edge case, boundary)
    When a client sends a GET request to "/api/echo" with a "msg" of 200 "a" characters
    Then the response status code is 200
    And the response body field "echo" is the same 200 characters

  Scenario: An empty msg is accepted and echoed back (edge case)
    When a client sends a GET request to "/api/echo?msg="
    Then the response status code is 200
    And the response body is {"echo": ""}

  Scenario: The response body is defined by a Pydantic schema (criterion 4)
    Given the interactive API documentation at "http://localhost:8010/docs"
    When I open the "GET /api/echo" operation
    Then its 200 response schema is "EchoResponse" with a single string field "echo"
    And the route in "backend/app/routers/echo.py" declares response_model "EchoResponse" and returns an EchoResponse, not a dict literal

  Scenario: The echo tests all pass (criteria 1 to 4)
    When I run "uv run --directory backend pytest -q tests/unit/test_echo_schema_unit.py tests/integration/test_echo_integration.py"
    Then the summary line reports no failed or errored test
    And the command exits 0
