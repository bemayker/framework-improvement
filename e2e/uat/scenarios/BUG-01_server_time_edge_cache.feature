Feature: BUG-01 Server time is not stored by the edge cache
  GET /api/time must carry Cache-Control: no-store so the CDN in front of
  the deployed API never serves a stale "now".

  Scenario: Criterion 1 - the time response carries Cache-Control no-store
    Given the backend is running
    When a client requests GET /api/time
    Then the response status is 200
    And the Cache-Control header is "no-store"
    And the body has a "now" value ending in "Z" or "+00:00" and "timezone" equal to "UTC"

  Scenario: Criterion 2 - a test asserts the header on the response
    Given the backend test suite
    When the server-time integration tests run
    Then the Cache-Control header assertion passes with 0 failed

  @deployed-only
  Scenario: Criterion 3 - two requests a second apart return different values on the deployed environment
    Given the fix is deployed behind the CDN
    When GET /api/time is requested twice one second apart
    Then the two "now" values differ
    And neither response is marked as a CDN cache hit

  Scenario: Edge case - POST to the time endpoint is rejected
    Given the backend is running
    When a client sends POST /api/time
    Then the response status is 405
