Feature: TEST-06 Echo endpoint
  As a caller of the API
  I want GET /api/echo?msg={text} to return the text I gave it
  So that I can prove the API is reachable and query-string handling works end to end

  Background:
    Given the backend is running and reachable at http://localhost:8010

  # Criterion 1
  Scenario: A msg is echoed back
    When I GET /api/echo?msg=hello
    Then the status is 200
    And the body is {"echo": "hello"}

  # Criterion 1 (query-string handling)
  Scenario: A URL-encoded msg round-trips unchanged
    When I GET /api/echo with msg "hello world & more" URL-encoded
    Then the status is 200
    And the body is {"echo": "hello world & more"}

  # Criterion 2
  Scenario: A missing msg is rejected with the standard validation response
    When I GET /api/echo with no query string
    Then the status is 422
    And the first detail entry has type "missing" and location ["query", "msg"]

  # Criterion 3
  Scenario: A msg over 200 characters is rejected
    When I GET /api/echo with a msg of 201 characters
    Then the status is 422
    And the first detail entry has type "string_too_long" and location ["query", "msg"]

  # Criterion 3 edge case: the boundary
  Scenario: A msg of exactly 200 characters is accepted
    When I GET /api/echo with a msg of exactly 200 characters
    Then the status is 200
    And the body echoes the same 200 characters

  # Criterion 4
  Scenario: The response body is defined by a Pydantic schema
    Given the backend source
    When I open backend/app/schemas/echo.py and backend/app/routers/echo.py
    Then the schema module defines EchoResponse with the single field echo
    And the router returns EchoResponse and builds no dict
    And the length bound is declared on the msg parameter, not checked in the handler

  # Test run for all criteria
  Scenario: The echo tests pass
    When I run "uv run --directory backend pytest -q tests/unit/test_echo_unit.py tests/integration/test_echo_integration.py tests/unit/test_main_unit.py"
    Then the run reports 0 failed
