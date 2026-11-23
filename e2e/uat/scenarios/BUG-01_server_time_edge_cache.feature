Feature: BUG-01 Server time is not served from the edge cache
  As a client of the Task Notes API
  I want GET /api/time to carry a Cache-Control: no-store directive
  So that a CDN never serves a stale server time

  Background:
    Given the Task Notes backend API is running at "http://localhost:8000"

  Scenario: The time endpoint responds with Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 timestamp with an explicit UTC offset

  Scenario: A test asserts the Cache-Control header on the response
    Given the backend test suite is checked out on the feature branch
    When the server time integration tests are run
    Then the test "test_get_time_sets_cache_control_no_store" passes
    And no test fails or errors

  Scenario: The deployed API behind its CDN returns a different time on each request
    Given the change is merged and deployed
    And the API is reachable behind its CDN at "https://<deployed-host>"
    When a client sends a GET request to "/api/time"
    And the client waits one second
    And the client sends a second GET request to "/api/time"
    Then the "now" values of the two responses differ
    And both responses carry the header "Cache-Control" with value "no-store"

  Scenario: A second request is not served from the cache (edge case)
    Given the deployed API behind its CDN has answered one request to "/api/time"
    When a client sends a second GET request to "/api/time" one second later
    Then the response does not report a CDN cache hit
    And the response header "Age" is absent or "0"
