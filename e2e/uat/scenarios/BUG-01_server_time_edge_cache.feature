Feature: BUG-01 Server time is not served stale from the edge cache
  As a client of the Task Notes API
  I want GET /api/time to be marked uncacheable
  So that the CDN in front of the deployed API never serves a stale "now"

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The time response carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the Cache-Control header on the response
    Given the backend test suite is available
    When the server time integration tests are run
    Then a test asserts that the "Cache-Control" header of a GET "/api/time" response equals "no-store"
    And the run reports 0 failed

  Scenario: Two requests a second apart return different times on the deployed environment
    Given the fix is deployed and a human has the deployed API host
    When a client sends a GET request to "/api/time" on the deployed host
    And the client waits one second
    And the client sends a second GET request to "/api/time" on the deployed host
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" values of the two responses differ

  Scenario: The no-store directive is scoped to the time route only (edge case)
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response does not carry the header "Cache-Control" with value "no-store"
