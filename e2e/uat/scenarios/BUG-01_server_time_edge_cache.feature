Feature: BUG-01 Server time is not stored by the edge cache
  As a client of the Task Notes API
  I want GET /api/time to forbid caching
  So that every request reaches the API and returns the current server time

  Background:
    Given the Task Notes backend API is running

  Scenario: The response carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" has the value "no-store"
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite is available
    When the server-time integration tests are run
    Then the test "test_get_time_sets_cache_control_no_store" passes
    And the run reports 0 failed

  Scenario: Two requests on the deployed environment return different times (criterion 3)
    Given the fix is deployed and the CDN in front of the API is active
    And this scenario runs against the deployed host, verified by a human
    When a client sends a GET request to "/api/time" on the deployed host
    And waits a few seconds
    And sends a second GET request to "/api/time" on the deployed host
    Then both responses carry the header "Cache-Control" with the value "no-store"
    And the "now" field of the second response is later than the "now" field of the first
    And no response is served from the edge cache

  Scenario: A non-GET method is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
