Feature: FEAT-5 GET /api/health returns a JSON health

  Background:
    Given the backend is running at "http://localhost:8010"

  Scenario: GET /api/health answers 200 with health green
    Given the database is reachable
    When a client sends GET "/api/health"
    Then the response status is 200
    And the response content type is "application/json"
    And the body field "health" is "green"
    And the body field "status" is "ok"

  Scenario: POST /api/health answers 405 with the method-not-allowed body
    When a client sends POST "/api/health"
    Then the response status is 405
    And the response header "allow" is "GET"
    And the body is {"detail": "Method Not Allowed"}

  Scenario: The health integration tests cover both responses
    Given the backend test suite and a running database
    When the health integration tests run
    Then they report 0 failed
    And no test is skipped

  Scenario: POST with a JSON body still answers the same 405
    When a client sends POST "/api/health" with the JSON body {"x": 1}
    Then the response status is 405
    And the body is {"detail": "Method Not Allowed"}

  Scenario: GET /api/health reports health red when the database is down
    Given the database is stopped
    When a client sends GET "/api/health"
    Then the response status is 503
    And the body field "status" is "degraded"
    And the body field "health" is "red"
