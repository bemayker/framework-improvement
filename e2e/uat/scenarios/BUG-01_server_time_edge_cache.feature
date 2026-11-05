Feature: BUG-01 Server time is never served from an edge cache
  As an operator of the deployed environment
  I want GET /api/time to forbid caching
  So that a CDN in front of the API never serves a stale time

  Background:
    Given the API is running

  Scenario: Criterion 1 - the time response carries Cache-Control no-store
    When a client requests GET /api/time
    Then the response status is 200
    And the Cache-Control header is "no-store"
    And the body has "now" ending in "Z" and "timezone" equal to "UTC"

  Scenario: Criterion 2 - a test asserts the header on the response
    Given the backend test suite
    When the server time integration tests run
    Then the Cache-Control header test passes
    And the run reports 0 failed

  Scenario: Criterion 3 - the deployed reproduction returns two different values (manual, deployed only)
    Given the fix is merged and deployed
    When a human requests GET /api/time on the deployed host twice, one second apart
    Then the two "now" values differ
    And the second response shows no CDN cache-hit marker

  Scenario: Edge case - a POST is rejected and carries no cached body
    When a client sends POST /api/time
    Then the response status is 405
