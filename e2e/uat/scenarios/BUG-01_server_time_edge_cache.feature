Feature: BUG-01 Server time is not stored by the edge cache

  Background:
    Given the backend is running on http://localhost:8010

  Scenario: Criterion 1 - the time endpoint forbids caching
    When I request GET /api/time
    Then the status is 200
    And the Cache-Control header is exactly "no-store"

  Scenario: Criterion 2 - a test asserts the header
    Given the repository checked out on the BUG-01 branch
    When I run the server time integration and unit test files
    Then the run reports 0 failed
    And test_get_server_time_sets_cache_control_no_store is among the tests run

  Scenario: Criterion 3 - the deployed endpoint returns fresh values
    Given the fix is deployed behind the CDN
    When I request the deployed GET /api/time twice, one second apart
    Then the two "now" values differ
    And each response carries the header Cache-Control "no-store"

  Scenario: Edge case - the body is unchanged and the header is scoped to the endpoint
    When I request GET /api/time
    Then the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"
    When I request GET /api/health
    Then the response has no Cache-Control "no-store" header
