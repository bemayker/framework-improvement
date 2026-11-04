Feature: BUG-01 Server time is never stored by an edge cache
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that a CDN in front of the API never serves a stale "now"

  Scenario: Criterion 1 - the response carries Cache-Control no-store
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "now" ends with "+00:00"
    And the response body field "timezone" is "UTC"

  Scenario: Criterion 2 - a test asserts the header on the response
    Given the server time integration tests exist in "backend/tests/integration/test_server_time_integration.py"
    When the server time unit and integration tests are run
    Then they report 0 failed
    And the test "test_get_time_returns_cache_control_no_store" asserts the "Cache-Control" header equals the router's NO_STORE constant

  Scenario: Criterion 3 - after deploy, two requests a second apart return different values (deployed environment only)
    Given the fix is merged and deployed behind the edge cache
    When a client sends a GET request to "/api/time" on the deployed host
    And the client waits one second
    And the client sends a second GET request to "/api/time" on the deployed host
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the two "now" values differ

  Scenario: The header is present on the second of two consecutive requests (edge case)
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"
    When a client sends a GET request to "/api/time"
    And the client sends a second GET request to "/api/time"
    Then both responses have status code 200
    And the second response header "Cache-Control" is "no-store"
