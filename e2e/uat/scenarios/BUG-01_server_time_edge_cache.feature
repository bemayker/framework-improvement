Feature: BUG-01 Server time is not cached at the edge
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that the CDN in front of the deployed API never serves a stale time

  Background:
    Given the Task Notes backend is running

  Scenario: The time response carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "now" is an ISO 8601 UTC time with an explicit offset
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the server time integration tests exist in "backend/tests/integration/test_server_time_integration.py"
    When the server time unit and integration tests are run
    Then 0 tests fail
    And one test asserts that the "cache-control" header of a GET "/api/time" response equals "no-store"

  Scenario: Two requests a second apart return different times on the deployed environment (criterion 3, human check)
    Given the fix is deployed and the CDN is in front of the API
    When a human sends two GET requests to "https://<deployed-host>/api/time" one second apart
    Then the "now" values of the two responses differ
    And the response header "Cache-Control" is "no-store"

  Scenario: The time endpoint is read-only (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
