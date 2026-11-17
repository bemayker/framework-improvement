Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to tell shared caches never to store its response
  So that two requests a second apart on the deployed environment return two different times

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8000"

  Scenario: Criterion 1 - the response carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "now" is an ISO 8601 UTC time with an explicit offset
    And the response body field "timezone" is "UTC"

  Scenario: Criterion 2 - a test asserts the header on the response
    Given the server-time integration test file "backend/tests/integration/test_server_time_integration.py"
    When the server-time unit and integration tests are run
    Then the run passes with no failed or errored test
    And the test "test_get_time_returns_cache_control_no_store" asserts that the "Cache-Control" header equals "no-store"

  Scenario: Criterion 3 - two deployed requests a second apart return different times
    Given the change is deployed behind the edge cache
    When a human sends a GET request to "/api/time" on the deployed host, waits one second, and sends it again
    Then the first response carries the header "Cache-Control" with value "no-store"
    And the two responses carry two different "now" values
    And no response is marked as served from the edge cache

  Scenario: A non-GET request is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
