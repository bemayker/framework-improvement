Feature: BUG-01 Server time is not cached by the edge
  As an API consumer
  I want GET /api/time to forbid caching
  So that two requests a second apart return different "now" values behind a CDN

  Scenario: Criterion 1 - the time endpoint carries Cache-Control no-store
    Given the API is running
    When a client requests GET /api/time
    Then the response has status 200
    And the response header "Cache-Control" is "no-store"
    And the body contains "now" ending in "+00:00" and "timezone" equal to "UTC"

  Scenario: Criterion 2 - a test asserts the header on the response
    Given the backend test suite
    When the server_time integration tests run
    Then 0 tests fail
    And one of them asserts the response header "Cache-Control" equals "no-store"

  Scenario: Criterion 3 - the deployed reproduction returns two different values
    Given the fix is deployed behind the CDN
    When a human requests GET /api/time twice, one second apart
    Then the two "now" values differ
    And the response does not report a cache hit

  Scenario: Edge case - the header is present on a later request too
    Given the API is running
    And a client has already requested GET /api/time once
    When the client requests GET /api/time again
    Then the response header "Cache-Control" is "no-store"
    And "now" is later than in the first response
