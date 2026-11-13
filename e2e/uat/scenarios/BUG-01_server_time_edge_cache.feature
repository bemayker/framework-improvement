Feature: BUG-01 Server time is not served stale from the edge cache
  As a client of the Task Notes API
  I want every GET /api/time response to forbid caching
  So that a CDN in front of the API never serves one stale "now"

  Background:
    Given the Task Notes backend is running at "http://localhost:8000"

  Scenario: GET /api/time carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with "+00:00"

  Scenario: A test asserts the Cache-Control header (criterion 2)
    Given the backend test suite
    When the server-time integration tests run
    Then "test_get_time_sets_cache_control_no_store" passes
    And the summary reports 0 failed

  Scenario: Two requests a second apart return different values on the deployed environment (criterion 3, human check)
    Given the change is deployed behind the CDN
    When a client sends a GET request to "https://<deployed-host>/api/time"
    And waits one second
    And sends a second GET request to "https://<deployed-host>/api/time"
    Then the two "now" values differ
    And the responses carry the header "Cache-Control" with value "no-store"
    And no CDN cache-hit header such as "X-Cache: HIT" or "CF-Cache-Status: HIT" is present

  Scenario: A POST to /api/time is rejected with 405 (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
