Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app on the deployed environment
  I want GET /api/time to tell the edge cache not to store its response
  So that two requests a second apart return two different "now" values

  Background:
    Given the Task Notes backend API is running
    And locally it is published on the host at "http://localhost:8010"

  Scenario: GET /api/time carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "now" ends with "+00:00"
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite is available
    When the integration tests in "backend/tests/integration/test_server_time_integration.py" are run
    Then the run passes
    And the test "test_get_time_response_carries_cache_control_no_store" asserts the "cache-control" header equals "no-store"

  Scenario: Two requests a second apart return different values on the deployed environment (criterion 3)
    Given the merged change is deployed behind the CDN at "https://<deployed-host>"
    When a client sends a GET request to "/api/time"
    And waits one second
    And sends a second GET request to "/api/time"
    Then the two responses' "now" values differ
    And the second "now" is later than the first
    And both responses carry the header "Cache-Control" with value "no-store"

  Scenario: POST to /api/time is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
