Feature: BUG-01 Server time is not cached at the edge
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that the CDN in front of the deployed API never serves a stale server time

  Background:
    Given the Task Notes backend is running and published on the host at "http://localhost:8010"

  Scenario: Criterion 1, the time response carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body has exactly the fields "now" and "timezone"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends in "+00:00"

  Scenario: Criterion 2, a test asserts the header on the response
    Given the backend test suite is installed
    When the server-time integration, service unit and app unit tests are run
    Then no test fails
    And the integration test "test_get_time_sets_cache_control_no_store" asserts that the "cache-control" header equals "no-store"

  Scenario: Criterion 3, the deployed reproduction returns two different values (human-verified)
    Given the fix is deployed to the environment behind the CDN
    When a human requests GET "/api/time" on the deployed host, waits one second, and requests it again
    Then the two "now" values differ
    And the response carries "Cache-Control: no-store"
    And no CDN cache-status header reports a HIT

  Scenario: Edge case, the fix is scoped to the time route and other methods are rejected
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
    And a GET request to "/api/version" carries no "Cache-Control" header added by this fix
