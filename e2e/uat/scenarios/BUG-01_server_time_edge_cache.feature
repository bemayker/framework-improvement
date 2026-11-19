Feature: BUG-01 Server time is not stored by the edge cache
  As a client of the Task Notes API
  I want every GET /api/time response to forbid caching
  So that the CDN in front of the API never serves a stale "now"

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: GET /api/time responses carry Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body has exactly the fields "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header on the response
    Given the backend test suite
    When the server-time integration tests run
    Then the test "test_get_server_time_sets_cache_control_no_store" passes

  Scenario: Two requests a second apart return different values on the deployed environment
    Given the fix is merged and deployed behind the CDN
    When a client sends a GET request to "/api/time" on the deployed host
    And the client waits one second
    And the client sends a second GET request to "/api/time" on the deployed host
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" value of the second response is later than the "now" value of the first

  Scenario: POST /api/time is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
