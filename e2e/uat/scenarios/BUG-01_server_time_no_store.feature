Feature: BUG-01 Server time is never cached at the edge
  As a client of the Task Notes API
  I want GET /api/time to carry Cache-Control no-store
  So that a CDN in front of the API cannot serve a stale "now"

  Background:
    Given the Task Notes backend API is running

  Scenario: The time endpoint response carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "now" ends with "+00:00"
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header on the response
    Given the backend test suite is available
    When the server_time integration and unit tests are run
    Then 0 tests fail
    And an integration test asserts that the "Cache-Control" response header equals "no-store"

  Scenario: On the deployed environment two requests a second apart return different values
    Given the fix is merged and deployed behind the CDN
    When a client sends a GET request to "/api/time" on the deployed host
    And the client waits one second
    And the client sends a second GET request to "/api/time" on the deployed host
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" value of the second response is later than the first
    And any CDN cache-status header on the second response reports a miss or bypass, never a hit

  Scenario: The header is present on a second consecutive request (edge case)
    Given a client has already sent one GET request to "/api/time"
    When the client sends a second GET request to "/api/time"
    Then the second response carries the header "Cache-Control" with value "no-store"
    And its "now" value differs from the first response
