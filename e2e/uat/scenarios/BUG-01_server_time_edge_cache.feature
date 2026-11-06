Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that the CDN in front of the deployed API never serves a stale time

  Background:
    Given the Task Notes backend is running
    # No database is needed. The base URL is set per scenario: local scenarios use
    # "http://localhost:8000", the deployed-only scenario uses the deployed host.

  Scenario: The time response carries Cache-Control no-store (criterion 1)
    Given the backend is reachable at "http://localhost:8000"
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body has exactly the keys "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the repository is checked out on the BUG-01 branch
    When the server time integration tests are run
    Then 0 tests fail
    And the test "test_get_time_response_carries_cache_control_no_store" is among those that ran

  @deployed-only
  Scenario: Two requests behind the edge cache return different times (criterion 3)
    Given the fix is deployed behind the CDN at the deployed host
    When a client sends a GET request to "https://{deployed-host}/api/time"
    And waits two seconds
    And sends the same GET request again
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" value of the second response differs from the first

  Scenario: The header is scoped to the time route (edge case)
    Given the backend is reachable at "http://localhost:8000"
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response carries no "Cache-Control" header of "no-store"
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
