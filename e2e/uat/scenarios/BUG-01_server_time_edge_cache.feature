Feature: BUG-01 Server time is not cached by the edge
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that a CDN in front of the API never serves a stale server time

  Background:
    Given the Task Notes backend is running

  Scenario: The time response forbids caching (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body carries a "now" value and the "timezone" "UTC"

  Scenario: A test asserts the Cache-Control header (criterion 2)
    Given the backend test suite
    When the server-time integration tests run
    Then they pass
    And the test "test_get_time_sets_cache_control_no_store" asserts the "cache-control" header equals "no-store"

  @deployed
  Scenario: Two requests a second apart return different times on the deployed environment (criterion 3)
    Given the fix is deployed behind the CDN
    When a client sends a GET request to "/api/time" on the deployed host
    And the client waits one second
    And the client sends a second GET request to "/api/time" on the deployed host
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the two "now" values differ

  Scenario: A non-GET method is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
