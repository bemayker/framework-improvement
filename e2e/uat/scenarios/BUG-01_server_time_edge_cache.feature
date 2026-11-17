Feature: BUG-01 Server time is not stored by the edge cache
  The time endpoint must forbid caching so every request reaches the server.

  Scenario: Criterion 1 - the time response forbids storing
    Given the API is running
    When a client sends GET /api/time
    Then the response status is 200
    And the response has header "Cache-Control" with value "no-store"
    And the body "now" carries an explicit UTC offset

  Scenario: Criterion 2 - a test asserts the header
    Given the backend test suite
    When test_server_time_integration.py runs
    Then it passes
    And it includes test_get_time_sets_cache_control_no_store, which asserts the header

  Scenario: Criterion 3 - two requests a second apart return different values (deployed, human check)
    Given the deployed API behind the CDN
    When a client sends GET /api/time twice, one second apart
    Then the two "now" values differ
    And the response does not report an edge cache hit

  Scenario: Edge case - POST to the time endpoint is rejected
    Given the API is running
    When a client sends POST /api/time
    Then the response status is 405
