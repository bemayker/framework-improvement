Feature: BUG-01 Server time is not cached by the edge
  As an operator of the Task Notes app
  I want GET /api/time to tell every cache not to store its response
  So that two requests a second apart return two different times on the deployed environment

  Background:
    Given the Task Notes backend is running at "http://localhost:8000"
    And no database is required for this endpoint

  Scenario: The time response carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 time with an explicit UTC offset

  Scenario: A test asserts the header on the response
    Given the backend test suite
    When the server time integration tests run
    Then the test "test_get_time_sets_cache_control_no_store" passes
    And it asserts that the "Cache-Control" response header equals "no-store"

  Scenario: Two requests a second apart return different times on the deployed environment
    Given the fix is deployed and the API is reached through its CDN at "https://<deployed-host>"
    When a client sends a GET request to "/api/time" and notes "now"
    And the client waits one second
    And the client sends a GET request to "/api/time" again
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the two "now" values differ

  Scenario: A write method is refused (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
