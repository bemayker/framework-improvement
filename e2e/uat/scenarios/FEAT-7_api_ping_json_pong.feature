Feature: FEAT-7 GET /api/ping returns a JSON pong
  GET /api/ping answers with a fixed JSON body so a client can check that the
  backend is up. There is no UI for this endpoint; scenarios are HTTP requests
  against the running backend.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  # Criterion 1
  Scenario: The endpoint returns 200 and the pong body
    When a client sends GET "/api/ping"
    Then the status is 200
    And the "content-type" header is "application/json"
    And the body is {"pong": true}

  # Criterion 1, edge case
  Scenario: The body carries only the pong field, as a boolean
    When a client sends GET "/api/ping"
    Then the body holds exactly the key "pong"
    And "pong" is the JSON boolean true, not the string "true"

  # Criterion 2
  Scenario: The ping test passes
    When the tests in "tests/integration/test_ping_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run collects one test, "test_get_ping_returns_200_with_pong_true"
    And the run reports 0 failed
