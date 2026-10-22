Feature: BUG-01 Server time is not cached by the edge
  The time endpoint tells the CDN not to store its responses, so two requests
  a second apart return different values on the deployed environment.

  Scenario: Criterion 1 - the time response carries Cache-Control no-store
    Given the API is running
    When a client sends GET /api/time
    Then the response status is 200
    And the Cache-Control header is "no-store"
    And the body contains exactly "now" and "timezone"

  Scenario: Criterion 2 - a test asserts the header
    Given the backend test suite
    When the server time integration and unit tests run
    Then they report 0 failed
    And the integration file contains a test asserting the Cache-Control header

  Scenario: Criterion 3 - the deployed reproduction returns two different values
    Given the fix is deployed behind the CDN
    When GET /api/time is requested twice one second apart
    Then the two "now" values differ

  Scenario: Edge case - the header is present on consecutive responses
    Given the API is running
    When a client sends GET /api/time twice in a row
    Then both responses carry the Cache-Control header "no-store"
    And the two "now" values differ
