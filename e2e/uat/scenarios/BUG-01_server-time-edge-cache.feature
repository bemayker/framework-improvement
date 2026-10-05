Feature: BUG-01 Server time is not served stale from the edge cache

  Background:
    Given the backend API is running

  Scenario: Criterion 1 - the time endpoint response carries Cache-Control no-store
    When a client sends GET /api/time
    Then the response status is 200
    And the response header "Cache-Control" is "no-store"
    And the body has a "now" ISO-8601 timestamp and "timezone" "UTC"

  Scenario: Criterion 2 - a test asserts the header on the response
    Given the backend test suite
    When the server time unit and integration tests run
    Then they pass
    And the integration test asserts the "cache-control" header of GET /api/time equals "no-store"

  Scenario: Criterion 3 - on the deployed environment two requests a second apart return different values
    Given the fix is deployed behind the CDN
    When a client sends GET /api/time, waits one second, and sends GET /api/time again
    Then the two "now" values differ
    And the second is later than the first by about one second

  Scenario: Edge case - a second request within one second also carries the header
    When a client sends GET /api/time twice within one second
    Then both responses carry the header "Cache-Control" with value "no-store"
