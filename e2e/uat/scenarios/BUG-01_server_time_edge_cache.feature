Feature: BUG-01 Server time is not stored by the edge cache
  As an operator of the deployed Task Notes app
  I want GET /api/time to forbid caching
  So that the CDN in front of the API never serves a stale "now"

  Background:
    Given the Task Notes backend is running

  Scenario: GET /api/time carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" carries an explicit UTC offset

  Scenario: The backend test suite asserts the header (criterion 2)
    Given the server time integration tests exist in the backend suite
    When the server time integration and unit tests are run
    Then a test asserts the "Cache-Control" response header equals "no-store"
    And the run reports 0 failed

  Scenario: Two deployed calls a second apart return different times (criterion 3, deployed environment, human check)
    Given the fix is deployed behind the CDN
    When a human requests GET "/api/time" on the deployed host
    And waits one second
    And requests GET "/api/time" on the deployed host again
    Then both responses carry the header "Cache-Control: no-store"
    And the two "now" values differ

  Scenario: A POST to /api/time is rejected and carries no body to cache (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
