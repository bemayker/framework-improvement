Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes API
  I want every GET /api/time response to forbid caching
  So that a CDN in front of the API never returns an old "now"

  Background:
    Given the Task Notes backend is running on "http://localhost:8000"

  Scenario: The time endpoint forbids caching (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends in "+00:00"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite is available
    When the integration module "backend/tests/integration/test_server_time_integration.py" is run
    Then the run passes
    And it includes the test "test_get_time_sets_cache_control_no_store"

  Scenario: Two calls a second apart return different times on the deployed environment (criterion 3, verified by a human)
    Given the fix is deployed behind the CDN
    When a client sends a GET request to "/api/time"
    And one second later sends a second GET request to "/api/time"
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" value of the second response differs from the first

  Scenario: A POST to the time endpoint is rejected and returns no time (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
    And the response body carries no "now" field
