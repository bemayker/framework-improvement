Feature: BUG-01 Server time is never served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to tell caches not to store its response
  So that two requests a second apart on the deployed environment return different times

  Background:
    Given the Task Notes backend is running

  Scenario: The time response carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with "+00:00"

  Scenario: A test asserts the Cache-Control header on the response (criterion 2)
    Given the backend integration test file "backend/tests/integration/test_server_time_integration.py"
    When the server-time unit and integration tests are run
    Then no test fails
    And one integration test asserts that the response header "cache-control" equals "no-store"

  Scenario: Two requests a second apart return different times on the deployed environment (criterion 3)
    Given the fix is deployed behind the CDN
    When a human sends a GET request to "/api/time" on the deployed host
    And waits one second
    And sends a second GET request to "/api/time" on the deployed host
    Then both responses carry the response header "Cache-Control" with value "no-store"
    And the "now" values of the two responses differ

  Scenario: A non-GET method on the time endpoint is refused (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
