Feature: TEST-06 Echo endpoint
  As a caller of the Task Notes API
  I want GET /api/echo?msg={text} to return the text I sent
  So that I can prove the API is reachable and that query-string handling works end to end

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A message is echoed back with status 200 (criterion 1)
    When a client sends a GET request to "/api/echo?msg=hello"
    Then the response status code is 200
    And the response body is exactly {"echo": "hello"}

  Scenario: A missing msg parameter answers 422, not 500 or an empty 200 (criterion 2)
    When a client sends a GET request to "/api/echo" with no query string
    Then the response status code is 422
    And the response body carries a "detail" list whose first entry has type "missing"
    And that entry's location is "query" then "msg"

  Scenario: A msg longer than 200 characters answers 422 with the bound declared in the schema (criterion 3)
    When a client sends a GET request to "/api/echo" with a "msg" of 201 characters
    Then the response status code is 422
    And the first "detail" entry has type "string_too_long"
    And that entry's location is "query" then "msg"
    And that entry's context states a max_length of 200
    And the OpenAPI document declares "msg" on GET "/api/echo" as a required query parameter with maxLength 200

  Scenario: The response body is defined by a Pydantic schema (criterion 4)
    When I open the OpenAPI document at "/openapi.json"
    Then the 200 response of GET "/api/echo" references the "EchoResponse" schema
    And the "EchoResponse" schema has one string property "echo"
    And the schema is defined in "backend/app/schemas/echo.py"
    And the unit and integration tests in "backend/tests/unit/test_echo_unit.py", "backend/tests/unit/test_main_unit.py" and "backend/tests/integration/test_echo_integration.py" report "0 failed"

  Scenario: A msg of exactly 200 characters is accepted (edge case)
    When a client sends a GET request to "/api/echo" with a "msg" of 200 characters
    Then the response status code is 200
    And the response body field "echo" holds the same 200 characters unchanged
