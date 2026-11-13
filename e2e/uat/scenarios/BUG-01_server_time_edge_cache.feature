Feature: BUG-01 Server time is not stored by the edge cache
  As a client of the Task Notes API
  I want every response of GET /api/time to forbid caching
  So that a CDN in front of the API never serves me a stale server time

  Background:
    Given the Task Notes backend is running

  Scenario: The time endpoint forbids storing its response
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "now" carries an explicit UTC offset
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the Cache-Control header
    Given the backend test suite
    When the server-time integration tests run
    Then the test "test_get_server_time_sets_cache_control_no_store" passes
    And the run reports 0 failed

  Scenario: Two requests a second apart return different values on the deployed environment
    Given the API is deployed behind the CDN
    When a client sends a GET request to "/api/time" and again one second later
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" values of the two responses differ
    And no response carries a CDN cache-hit indicator

  Scenario: A POST to the time endpoint is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
    And no cached time body is served
