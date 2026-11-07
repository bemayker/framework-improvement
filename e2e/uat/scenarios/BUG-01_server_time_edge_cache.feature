Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that the CDN in front of the deployed API never returns a stale "now"

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The time response carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 timestamp with an explicit UTC offset

  Scenario: A test asserts the Cache-Control header
    Given the backend dependencies are installed
    When the server time integration and unit tests are run
    Then the run reports 0 failed
    And an integration test asserts that the "Cache-Control" header of a GET "/api/time" response equals "no-store"

  Scenario: The deployed reproduction returns two different values
    Given the fix is deployed behind the CDN
    When a human sends a GET request to "https://<deployed-host>/api/time" with "curl -si"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    When the human requests "https://<deployed-host>/api/time" twice, one second apart
    Then the "now" values of the two responses differ

  Scenario: Other routes are not marked no-store (edge case)
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response carries no "Cache-Control: no-store" header

  Scenario: POST to the time route is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
