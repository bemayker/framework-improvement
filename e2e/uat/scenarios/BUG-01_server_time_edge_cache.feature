Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want every GET /api/time response to forbid caching
  So that the CDN in front of the API never replays an old "now"

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The time endpoint forbids caching (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "now" is an ISO 8601 UTC timestamp ending in "+00:00"
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite is installed
    When the integration tests in "backend/tests/integration/test_server_time_integration.py" are run
    Then the run passes with no failed or errored test
    And the test "test_get_time_sets_cache_control_no_store" asserts that the response header "Cache-Control" equals "no-store"

  Scenario: Two requests a second apart return different times on the deployed environment (criterion 3)
    Given this fix is merged and deployed
    And the deployed API sits behind its CDN
    When a client sends a GET request to "/api/time" on the deployed host
    And the client waits one second
    And the client sends a second GET request to "/api/time" on the deployed host
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" values of the two responses differ

  Scenario: A second request does not reuse the first response's now (edge case)
    Given a client has received a response from "/api/time"
    When the client sends another GET request to "/api/time" after a short delay
    Then the "now" value of the second response is later than the "now" value of the first
    And the response carries no CDN cache marker such as "age" or "x-cache: HIT"
