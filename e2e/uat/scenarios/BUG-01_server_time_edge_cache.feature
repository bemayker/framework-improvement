Feature: Server time is not cached by shared caches
  As an operator of the deployed environment
  I want GET /api/time to forbid caching
  So that clients behind the CDN always receive the current server time

  Scenario: The time endpoint carries Cache-Control no-store (criterion 1)
    Given the backend is running
    When a client requests GET /api/time
    Then the response status is 200
    And the Cache-Control header is "no-store"
    And the body has exactly the keys "now" and "timezone"
    And "now" ends with the offset "+00:00"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite
    When the server-time integration tests run
    Then 0 tests fail
    And one test asserts the Cache-Control header equals "no-store" on a GET /api/time response

  Scenario: The deployed reproduction returns two different values (criterion 3)
    Given the merged commit is deployed behind its CDN
    When GET /api/time is requested twice, one second apart
    Then both responses carry the Cache-Control header "no-store"
    And the two "now" values differ, the second later than the first
    And no response reports a cache hit

  Scenario: A write method is rejected and nothing is cached (edge case)
    Given the backend is running
    When a client sends POST /api/time
    Then the response status is 405
