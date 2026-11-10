Feature: BUG-01 Server time is not served stale from the edge cache
  As an API consumer behind the CDN
  I want GET /api/time to forbid caching
  So that two requests a second apart return two different "now" values

  Background:
    Given the Task Notes backend API is published at "http://localhost:8010"

  Scenario: The time endpoint forbids caching
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with "+00:00"

  Scenario: A test asserts the Cache-Control header
    Given the backend test suite is available
    When the server time integration tests are run
    Then 0 tests fail
    And the test "test_get_server_time_sets_cache_control_no_store" asserts the "Cache-Control" header equals "no-store"

  Scenario: Two requests a second apart return different times on the deployed environment
    Given the fix is merged and deployed behind the CDN
    When a human sends a GET request to "/api/time" on the deployed host
    And waits about one second
    And sends a second GET request to "/api/time" on the deployed host
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the two "now" values differ

  Scenario: A non-GET method is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
