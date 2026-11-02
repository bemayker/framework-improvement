Feature: BUG-01 Server time is not cached by the edge
  As an API consumer of the Task Notes app
  I want GET /api/time to carry a no-store cache directive
  So that a CDN in front of the API never serves a stale time

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8000"

  Scenario: The time endpoint answers with Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "cache-control" is "no-store"
    And the response body field "now" is an ISO 8601 UTC time ending in "+00:00"
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the Cache-Control header on the response
    Given the backend test suite
    When the server time integration tests run
    Then the test "test_get_time_sets_cache_control_no_store" passes
    And the summary reports 0 failed

  Scenario: Two requests a second apart return different times on the deployed environment
    Given the change is deployed to the environment behind the CDN
    When a human sends GET "/api/time" twice, one second apart
    Then the two "now" values differ
    And the response header "cache-control" is "no-store"
    And any CDN cache status header, such as "x-cache" or "cf-cache-status", does not read HIT

  Scenario: A non-GET request to the time endpoint is refused (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
