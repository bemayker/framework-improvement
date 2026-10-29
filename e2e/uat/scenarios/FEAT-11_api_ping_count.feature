Feature: FEAT-11 API ping count
  As an operator of the Task Notes app
  I want GET /api/ping/count to report how many pings were answered since start
  So that I can see how often the backend has been pinged without touching the database

  Background:
    Given the Task Notes backend is freshly started
    And no database is required for the ping routes

  Scenario: GET /api/ping/count answers 200 with a count body
    When a client sends a GET request to "/api/ping/count"
    Then the response status code is 200
    And the response body is exactly {"count": 0}

  Scenario: The count route lives in the ping module and is registered on the app
    Given the app is created by create_app in "backend/app/main.py"
    When the app's routes are listed
    Then "/api/ping/count" is among them
    And the route is defined in "backend/app/ping.py"

  Scenario: Two pings followed by a count request give 2
    When a client sends a GET request to "/api/ping"
    And a client sends a GET request to "/api/ping"
    And a client sends a GET request to "/api/ping/count"
    Then the response status code is 200
    And the response body is exactly {"count": 2}

  Scenario: A pytest test asserts that two pings give a count of 2
    Given the backend test suite contains "test_ping_integration.py"
    When the ping integration, ping service and app unit tests run
    Then 0 tests fail
    And one of them asserts the body {"count": 2} after two pings

  Scenario: The count is 0 before any ping and count requests are not pings (edge case)
    When a client sends a GET request to "/api/ping/count"
    And a client sends a GET request to "/api/ping/count"
    Then both response bodies are exactly {"count": 0}
