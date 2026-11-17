Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that a CDN in front of the API never serves an old server time

  Background:
    Given the Task Notes backend is running

  Scenario: The time response carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "now" is an ISO 8601 UTC time with an explicit offset
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header (criterion 2)
    When the server-time integration tests are run
    Then the test "test_get_server_time_returns_no_store_cache_control" passes

  Scenario: Two requests a second apart return different times on the deployed environment (criterion 3)
    Given the backend is deployed behind its CDN
    When a client sends a GET request to "/api/time"
    And the client waits one second
    And the client sends a second GET request to "/api/time"
    Then the two "now" values differ
    And each response carries the header "Cache-Control" with value "no-store"

  Scenario: A non-GET method is not served (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
