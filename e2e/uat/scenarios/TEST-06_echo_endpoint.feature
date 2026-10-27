Feature: TEST-06 Echo endpoint
  As an API caller
  I want GET /api/echo?msg={text} to return the text I sent
  So that I can prove the API is reachable and query-string handling works end to end

  Background:
    Given the stack is running with "docker compose up -d"
    And the backend answers at "http://localhost:8010"

  # Criterion 1
  Scenario: A request with msg returns 200 and the echoed text
    When a client requests "/api/echo?msg=hello"
    Then the status is 200
    And the body is {"echo": "hello"}

  # Criterion 2
  Scenario: A request without msg returns the standard 422
    When a client requests "/api/echo" with no query string
    Then the status is 422
    And the body has a "detail" list whose first entry has loc ["query", "msg"] and type "missing"

  # Criterion 3
  Scenario: A msg longer than 200 characters returns 422
    When a client requests "/api/echo" with a msg of 201 characters
    Then the status is 422
    And the body has a "detail" list whose first entry has loc ["query", "msg"] and type "string_too_long"

  # Criterion 3, boundary edge case
  Scenario: A msg of exactly 200 characters is accepted and echoed
    When a client requests "/api/echo" with a msg of exactly 200 characters
    Then the status is 200
    And the body "echo" value equals the 200 characters that were sent

  # Criterion 4
  Scenario: The response body is defined by the EchoResponse schema
    When a reader opens the OpenAPI document at "http://localhost:8010/docs" and expands "GET /api/echo"
    Then the 200 response schema is "EchoResponse"
    And it has one string property "echo"

  # Criterion 4, schema-level check
  Scenario: The schema, router and registration tests report no failures
    When the tests in "backend/tests/unit/test_echo_schema_unit.py", "backend/tests/unit/test_main_unit.py" and "backend/tests/integration/test_echo_integration.py" are run
    Then the run reports 0 failed
