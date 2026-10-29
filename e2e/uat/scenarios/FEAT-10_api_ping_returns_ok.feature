Feature: FEAT-10 API ping returns ok
  As an operator of the Task Notes app
  I want GET /api/ping to answer with a constant ok status
  So that a client can tell the backend process is alive without touching the database

  Background:
    Given the Task Notes backend is running
    And no database is required for the ping route

  Scenario: GET /api/ping answers 200 with status ok
    When a client sends a GET request to "/api/ping"
    Then the response status code is 200
    And the response body is exactly {"status": "ok"}

  Scenario: The ping route lives in its own module and is registered on the app
    Given the app is created by create_app in "backend/app/main.py"
    When the app's routes are listed
    Then "/api/ping" is among them
    And the route is defined in "backend/app/ping.py"

  Scenario: A pytest test asserts the 200 response and the body
    Given the backend test suite contains "test_ping_integration.py"
    When the ping integration tests run
    Then 0 tests fail
    And one of them asserts status 200 and the body {"status": "ok"}

  Scenario: POST /api/ping is rejected (edge case)
    When a client sends a POST request to "/api/ping"
    Then the response status code is 405
