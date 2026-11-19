Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that a CDN in front of the API never serves a stale server time

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010" locally, or at the deployed host for the deployed scenario

  Scenario: Criterion 1 - GET /api/time carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with "+00:00"

  Scenario: Criterion 2 - a test asserts the header on the response
    Given the server-time unit and integration test files
    When the server-time tests are run
    Then the run passes with no failed or errored test
    And "test_get_time_sets_cache_control_no_store" asserts that the "cache-control" header equals "no-store"

  Scenario: Criterion 3 - after deploy, two requests a second apart return different values
    Given the fix is deployed behind the edge cache
    When a client sends a GET request to "/api/time"
    And the client waits one second
    And the client sends a second GET request to "/api/time"
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" values of the two responses differ

  Scenario: Edge case - a POST is rejected and is not a server-time response
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
    And the response is not a server-time body
