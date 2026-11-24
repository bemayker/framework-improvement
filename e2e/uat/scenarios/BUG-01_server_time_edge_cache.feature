Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that a CDN in front of the API never serves a stale server time

  Background:
    Given the Task Notes backend API is running

  Scenario: GET /api/time carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body has exactly the fields "now" and "timezone"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 time with an explicit UTC offset

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite
    When the server-time integration tests run
    Then the test "test_get_time_returns_cache_control_no_store" passes
    And it asserts the "Cache-Control" header of a GET "/api/time" response

  Scenario: Two requests a second apart return different values on the deployed environment (criterion 3)
    Given the fix is deployed behind the edge cache
    When a client sends a GET request to "/api/time"
    And one second later the client sends a second GET request to "/api/time"
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" values of the two responses differ

  Scenario: A POST to /api/time is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
