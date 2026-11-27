Feature: BUG-01 Server time is not stored by an edge cache
  As an operator of the Task Notes app
  I want GET /api/time to tell caches not to store its response
  So that every request reaches the API and returns the current server time

  Background:
    Given the Task Notes backend API is running
    And no database is needed for the "/api/time" endpoint

  Scenario: The response carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with "+00:00"

  Scenario: The header is asserted by an automated test
    Given the backend test suite is available
    When the server-time unit and integration tests are run
    Then the run passes with no failed or errored test
    And the integration test "test_get_time_sets_cache_control_no_store" asserts the "cache-control" response header equals "no-store"

  Scenario: Two requests a second apart return different times on the deployed environment
    Given the merged commit is deployed behind the CDN
    When a client sends a GET request to "/api/time" on the deployed host
    And the client waits one second
    And the client sends a second GET request to "/api/time" on the deployed host
    Then the "now" value of the second response differs from the first
    And the second response is not reported as a cache hit

  Scenario: A POST to the endpoint is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
