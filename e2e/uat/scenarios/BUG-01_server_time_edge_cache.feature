Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want every GET /api/time response to forbid caching
  So that the CDN in front of the deployed API never returns an old server time

  Background:
    Given the Task Notes backend API is running

  Scenario: GET /api/time carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with "+00:00"

  Scenario: A test asserts the header on the response
    Given the backend test suite contains "test_get_server_time_sets_cache_control_no_store"
    When the server time tests are run
    Then that test asserts the "Cache-Control" header of a GET "/api/time" response is "no-store"
    And 0 tests fail

  Scenario: After deploy, two requests one second apart return different values
    Given the fix is deployed behind the CDN
    When a client sends a GET request to "/api/time" on the deployed host
    And the client waits one second
    And the client sends a second GET request to "/api/time" on the deployed host
    Then the two "now" values differ
    And a human verifies this on the deployed environment

  Scenario: A non-GET method is rejected and is not part of the cached surface (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
