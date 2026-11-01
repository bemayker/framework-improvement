Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that a CDN in front of the API never serves a stale server time

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"

  Scenario: The response carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with "+00:00"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite
    When the server-time integration tests are run
    Then 0 tests fail
    And the test "test_get_time_response_carries_cache_control_no_store" asserts that the "cache-control" header equals "no-store"

  Scenario: Two requests a second apart return different values on the deployed environment (criterion 3)
    Given the change is deployed behind the edge cache
    And a human tester knows the deployed API host
    When the tester requests "GET /api/time" twice, one second apart
    Then both responses carry the header "Cache-Control: no-store"
    And neither response carries an "age" header or an "x-cache: HIT" header
    And the two "now" values differ by roughly one second

  Scenario: A second request is not served from a cache (edge case)
    Given a client has just requested "GET /api/time"
    When the client requests "GET /api/time" again
    Then the second response carries the header "Cache-Control: no-store"
    And the second "now" value is later than the first
