Feature: BUG-01 Server time is never served from an edge cache
  As an API client
  I want GET /api/time to carry Cache-Control: no-store
  So that a CDN never serves one stale "now" value

  Scenario: Criterion 1 - the time response carries no-store
    Given the backend is running
    When a client requests GET /api/time
    Then the status is 200
    And the Cache-Control header is "no-store"
    And the body has "timezone" equal to "UTC" and a "now" ending in "+00:00"

  Scenario: Criterion 2 - a test asserts the header
    Given the backend test suite
    When the server-time integration tests run
    Then test_get_time_sets_cache_control_no_store passes with 0 failed

  Scenario: Criterion 3 - two requests a second apart return different values (verified by a human on the deployed environment)
    Given the fix is deployed behind the CDN
    When a client requests GET /api/time twice, one second apart
    Then the two "now" values differ and the second is later than the first

  Scenario: Edge case - POST is rejected
    Given the backend is running
    When a client sends POST /api/time
    Then the status is 405
