Feature: BUG-06 Health endpoint forbids caching
  As an operator of the Task Notes app
  I want GET /api/health to forbid caching
  So that an edge cache never serves a stale health answer

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"

  Scenario: The response carries Cache-Control no-store, status and body unchanged (criterion 1)
    Given the database is up
    When a client sends a GET request to "/api/health"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "status" is "ok"
    And the response body has exactly the fields "status" and "database"

  Scenario: A test reproduces the defect (criterion 2)
    Given the backend test suite
    When the health cache-control integration tests are run
    Then 0 tests fail
    And the test "test_get_health_ok_response_carries_cache_control_no_store" asserts that the "cache-control" header equals "no-store"
    And the test "test_get_health_degraded_response_carries_cache_control_no_store" asserts that the "cache-control" header equals "no-store"

  Scenario: The degraded 503 response also carries Cache-Control no-store (edge case)
    Given the database is unreachable
    When a client sends a GET request to "/api/health"
    Then the response status code is 503
    And the response header "Cache-Control" is "no-store"
    And the response body field "status" is "degraded"
