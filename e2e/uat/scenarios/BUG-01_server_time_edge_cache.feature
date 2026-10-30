Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that the CDN in front of the API never returns an old time

  Background:
    Given the Task Notes backend API is published on the host at "http://localhost:8010"

  Scenario: The response carries Cache-Control no-store
    Given the backend is running
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 timestamp with an explicit UTC offset

  Scenario: A test asserts the header on the response
    Given the backend test suite is installed
    When the server-time integration tests run
    Then the test "test_get_time_sets_cache_control_no_store" is among the tests run and passes
    And 0 tests failed

  Scenario: After deploy, two requests a second apart return different values
    Given the fix is deployed and the deployed host name is known
    When a client sends a GET request to "https://<deployed-host>/api/time"
    And the client waits 1 second
    And the client sends a second GET request to "https://<deployed-host>/api/time"
    Then the two response bodies carry different "now" values
    And the response headers of the first request include "cache-control: no-store"

  Scenario: Two requests return different now values locally (edge case)
    Given the backend is running with no edge cache in front of it
    When a client sends two GET requests to "/api/time" one second apart
    Then the "now" value of the second response is later than the "now" value of the first
