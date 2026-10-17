Feature: BUG-01 Server time is served stale from the edge cache
  GET /api/time carries a Cache-Control: no-store header, so the CDN in front
  of the deployed API does not store the response and two requests a second
  apart return different "now" values.

  Background:
    Given the backend is running and answers on its API base URL

  Scenario: Criterion 1 - GET /api/time responses carry Cache-Control no-store
    When a client sends GET /api/time
    Then the response status is 200
    And the response header "Cache-Control" is "no-store"
    And the body has "timezone" equal to "UTC"
    And "now" is an ISO 8601 date-time string ending in "+00:00"

  Scenario: Criterion 2 - tests assert the header on the response
    Given the backend test suite
    When the server time unit and integration tests run: backend/tests/unit/test_server_time_router_unit.py and backend/tests/integration/test_server_time_integration.py
    Then the summary reports 0 failed
    And the test "test_get_server_time_sets_cache_control_no_store" is selected by the filter "cache_control"
    And the test "test_get_time_response_carries_cache_control_no_store" is selected by the filter "cache_control"

  Scenario: Criterion 3 - after deploy, two calls a second apart return different values
    Given the fix is deployed behind the CDN at the deployed host
    When a client sends GET /api/time
    And the client waits one second
    And the client sends GET /api/time again
    Then the two "now" values differ
    And the second "now" is at least one second later than the first
    And the response header "Cache-Control" is "no-store"
    And no CDN cache-status header reports a hit

  Scenario: Edge case - a non-GET method on /api/time is still rejected
    When a client sends POST /api/time
    Then the response status is 405
    And no requirement is placed on the "Cache-Control" header of that response
