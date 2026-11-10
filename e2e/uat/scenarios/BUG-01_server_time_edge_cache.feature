Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want every response of GET /api/time to forbid caching
  So that a CDN in front of the API never serves a stale "now" value

  Background:
    Given the Task Notes backend is running at "http://localhost:8000"

  Scenario: The time endpoint responds with Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body has exactly the keys "now" and "timezone"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with "+00:00"

  Scenario: A test asserts the Cache-Control header on the response
    Given the backend test suite is checked out on the BUG-01 branch
    When the server-time integration tests are run
    Then the run reports 0 failed
    And the test "test_get_server_time_sets_cache_control_no_store" asserts that the "cache-control" response header equals "no-store"

  Scenario: Two requests one second apart return different times on the deployed environment
    Given the fix is deployed to an environment with a CDN in front of the API
    When a client sends a GET request to "/api/time" through the CDN
    And the client waits one second
    And the client sends a second GET request to "/api/time" through the CDN
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" value of the second response differs from the "now" value of the first

  Scenario: Every response carries no-store, not only the first (edge case)
    Given the backend is running
    When a client sends two GET requests to "/api/time"
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the two "now" values differ

  Scenario: Other methods on the time endpoint are rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
