Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to tell any CDN in front of the API not to store its response
  So that two requests a second apart return two different "now" values on the deployed environment

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"

  Scenario: The time endpoint response carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 UTC time ending in "Z"

  Scenario: A test asserts the Cache-Control header on the response
    When the tests in "backend/tests/integration/test_server_time_integration.py" are run with pytest
    Then the run passes, reporting no failed or errored test, and the command exits 0
    And the test "test_get_time_returns_no_store_cache_control" is among the tests that ran

  Scenario: Two requests a second apart return different values on the deployed environment
    Given this item is merged and deployed
    And the deployed host name is known
    When a human sends a GET request to "/api/time" on the deployed host
    And waits one second
    And sends the same GET request again
    Then the "now" values of the two responses differ
    And both responses carry the header "Cache-Control" with the value "no-store"

  Scenario: The header is scoped to the time route only (edge case)
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response carries no "Cache-Control" header with the value "no-store"

  Scenario: A POST to the time endpoint is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
