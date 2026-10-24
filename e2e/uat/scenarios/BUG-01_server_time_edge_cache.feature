Feature: BUG-01 Server time is not stored by the edge cache
  GET /api/time carries Cache-Control: no-store so a CDN in front of the API never serves a stale clock value.

  Scenario: Criterion 1 - the response carries Cache-Control no-store
    Given the backend is running
    When a client sends GET /api/time
    Then the status is 200
    And the response header "Cache-Control" is exactly "no-store"
    And the body still has exactly the keys "now" and "timezone"

  Scenario: Criterion 2 - a test asserts the header on the response
    Given the backend test suite
    When the server time integration tests run
    Then 0 tests fail
    And "test_get_time_response_carries_cache_control_no_store" is among the tests that ran
    And "test_get_time_cache_control_is_set_on_every_request" is among the tests that ran

  @post-deploy @manual
  Scenario: Criterion 3 - after deploy, two requests a second apart return different values
    Given the BUG-01 change is deployed behind the CDN
    When a human requests GET /api/time on the deployed host twice, one second apart
    Then the two "now" values differ
    And the response header "Cache-Control" is "no-store"

  Scenario: Edge case - the header is set on every request, not only the first
    Given the backend is running
    When a client sends GET /api/time twice in a row
    Then both responses carry the header "Cache-Control" with value "no-store"
