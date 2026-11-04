Feature: BUG-01 Server time is not served stale from the edge cache
  As an API consumer behind the CDN
  I want GET /api/time responses to carry a no-store cache directive
  So that two requests a second apart return two different "now" values

  Background:
    Given the Task Notes backend is running
    And the backend API is published at "http://localhost:8010"

  Scenario: GET /api/time carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with "+00:00"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the server-time unit and integration test files
    When the backend test suite for those files is run
    Then no test fails
    And one integration test asserts that the "cache-control" response header equals "no-store"

  Scenario: Two requests a second apart return different values on the deployed environment (criterion 3)
    Given the fix is deployed behind the CDN at "https://<deployed-host>"
    When a client sends a GET request to "/api/time"
    And the client waits 1 second
    And the client sends a second GET request to "/api/time"
    Then both responses have status code 200
    And the "now" value of the second response differs from the "now" value of the first
    And no CDN cache-hit header reports a hit on either response

  Scenario: The header is present on every repeated call, not only the first (edge case)
    When a client sends a GET request to "/api/time"
    And the client sends a second GET request to "/api/time"
    Then both responses carry the response header "Cache-Control" with value "no-store"
    And the "now" value of the second response is later than the first
