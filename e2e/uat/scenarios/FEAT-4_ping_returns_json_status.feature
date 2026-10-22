Feature: FEAT-4 GET /api/ping returns a JSON status
  GET /api/ping reports that the backend is up with a fixed JSON body, and any
  other method on the path is answered with 405.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  Scenario: Criterion 1 - GET /api/ping answers 200 with the status body
    When a client sends GET "/api/ping"
    Then the response status is 200
    And the response content type is "application/json"
    And the body is exactly {"status": "ok", "service": "backend"}

  Scenario: Criterion 2 - POST /api/ping answers 405 with the detail body
    When a client sends POST "/api/ping"
    Then the response status is 405
    And the "Allow" header is "GET"
    And the body is exactly {"detail": "Method Not Allowed"}

  Scenario: Criterion 3 - the pytest covers both responses
    When the tests in "backend/tests/integration/test_ping_integration.py", "backend/tests/unit/test_ping_unit.py" and "backend/tests/unit/test_main_unit.py" are run
    Then 0 tests fail

  Scenario: Edge case - a POST with a JSON body is still rejected the same way
    When a client sends POST "/api/ping" with the JSON body {"x": 1}
    Then the response status is 405
    And the body is exactly {"detail": "Method Not Allowed"}
