Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want every GET /api/time response to forbid caching
  So that the CDN in front of the deployed API never serves a stale "now"

  Background:
    Given the Task Notes backend is running

  Scenario: GET /api/time responses carry Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends in "+00:00"

  Scenario: A test asserts the header on the response
    Given the backend test suite
    When the server-time integration tests run
    Then "test_get_time_sets_cache_control_no_store" passes
    And it asserts that the "cache-control" response header equals "no-store"

  Scenario: The deployed reproduction returns two different values
    Given the fix is deployed and the deployed host is known
    When a client sends a GET request to "https://<deployed-host>/api/time"
    And waits one second
    And sends a second GET request to "https://<deployed-host>/api/time"
    Then the response header "Cache-Control" is "no-store"
    And the two "now" values differ

  Scenario: Two rapid requests against a local backend differ (edge case)
    When a client sends two GET requests to "/api/time" in quick succession
    Then each response carries the header "Cache-Control" with value "no-store"
    And each "now" is computed per request, so the two values are not served from a stored response
