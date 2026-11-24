Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that a CDN in front of the API never serves one stale "now" to every caller

  Scenario: The time endpoint forbids caching (criterion 1)
    Given the backend is running
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite
    When the server time integration tests run
    Then the run passes
    And the test "test_get_time_sets_cache_control_no_store" asserts the "cache-control" header equals "no-store"

  Scenario: Two requests a second apart return different times on the deployed environment (criterion 3)
    Given the fix is deployed behind the CDN
    When a client sends a GET request to "/api/time" on the deployed host
    And waits one second
    And sends the same GET request again
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" values of the two responses differ

  Scenario: A POST to the time endpoint is refused (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
