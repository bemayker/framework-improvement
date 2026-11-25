Feature: BUG-01 Server time is not cached at the edge
  As a client of the Task Notes API
  I want GET /api/time to carry "Cache-Control: no-store"
  So that a CDN in front of the API never serves a stale "now"

  Background:
    Given the Task Notes backend API is running
    And no database is needed for this endpoint

  Scenario: Criterion 1, the response carries Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 timestamp with an explicit UTC offset

  Scenario: Criterion 2, a test asserts the header on the response
    Given the repository is checked out on the fix branch
    When the server-time integration and unit tests are run
    Then the run reports no failed or errored test
    And "test_get_server_time_sets_cache_control_no_store" asserts the "cache-control" response header

  Scenario: Criterion 3, two requests a second apart return different values on the deployed environment
    Given the fix is merged and deployed behind the CDN
    And a human knows the deployed API host
    When the human sends a GET request to "/api/time" on the deployed host
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response carries no "x-cache: HIT" header
    When the human waits one second and sends a second GET request to "/api/time"
    Then the "now" values of the two responses differ by about one second

  Scenario: Another method on /api/time answers 405 (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
