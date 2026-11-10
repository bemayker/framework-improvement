Feature: BUG-01 Server time is not cached at the edge
  As a client of the Task Notes API
  I want GET /api/time to forbid shared caching
  So that two requests a second apart return different server times, even behind a CDN

  Background:
    Given the Task Notes backend is running
    And no database is required for this endpoint

  Scenario: The time response carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with the explicit offset "+00:00"

  Scenario: A test asserts the header on the response
    Given the backend test suite
    When the server-time integration tests run
    Then they report 0 failed
    And one of them asserts that the "Cache-Control" header of a GET "/api/time" response equals "no-store"

  Scenario: The header is present on every repeated call (edge case)
    When a client sends a GET request to "/api/time" twice, one second apart
    Then both responses carry the header "Cache-Control" with the value "no-store"
    And the second "now" value is later than the first

  Scenario: The deployed reproduction returns two different values (human check on the deployed environment)
    Given the fix is deployed to the deployed environment
    When a client sends a GET request to "/api/time" on the deployed host
    And waits one second
    And sends a second GET request to "/api/time" on the deployed host
    Then both responses carry the header "Cache-Control" with the value "no-store"
    And the two "now" values differ
