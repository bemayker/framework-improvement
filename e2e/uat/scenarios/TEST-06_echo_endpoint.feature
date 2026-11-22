Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I sent
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A msg is echoed back with status 200
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is {"echo": "hello"}

  Scenario: A missing msg is rejected with FastAPI's standard 422
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response body "detail" has an entry of type "missing" located at "query" and "msg"
    And the response is neither a 500 nor an empty 200

  Scenario: A msg longer than 200 characters is rejected with 422
    When a client sends a GET request to "/api/echo" with a msg of 201 characters
    Then the response status code is 422
    And the response body "detail" has an entry of type "string_too_long" located at "query" and "msg"

  Scenario: The response body is described by the EchoResponse Pydantic schema
    When a client reads "/openapi.json"
    Then the 200 response of GET "/api/echo" references the "EchoResponse" schema
    And that schema has one string property "echo"
    And the "msg" parameter of GET "/api/echo" is required with a maxLength of 200

  Scenario: A msg of exactly 200 characters is accepted (edge case)
    When a client sends a GET request to "/api/echo" with a msg of exactly 200 characters
    Then the response status code is 200
    And the response body field "echo" holds all 200 characters

  Scenario: A URL-encoded msg is echoed decoded (edge case)
    When a client sends a GET request to "/api/echo?msg=hello%20world"
    Then the response status code is 200
    And the response body is {"echo": "hello world"}

  Scenario: The echo tests pass
    When the tests in "backend/tests/unit/test_echo_unit.py", "backend/tests/integration/test_echo_integration.py" and "backend/tests/unit/test_main_unit.py" are run
    Then the run reports no failed or errored test
    And the command exits 0
