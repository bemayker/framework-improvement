Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that the CDN in front of the deployed API never serves a stale "now"

  Scenario: Criterion 1, GET /api/time carries Cache-Control no-store
    Given the Task Notes backend API is running at "http://localhost:8000"
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 timestamp with an explicit UTC offset

  Scenario: Criterion 2, a test asserts the header on the response
    Given the backend test suite is checked out on the feature branch
    When the server-time unit and integration tests are run
    Then the summary reports 0 failed
    And the integration test asserts that the "cache-control" response header equals "no-store"

  Scenario: Criterion 3, the deployed reproduction returns two different values (human check)
    Given the change is merged and deployed to an environment with a CDN in front of the API
    When a client requests GET "/api/time" on the deployed host, waits one second, and requests it again
    Then the two "now" values differ
    And the response headers include "cache-control: no-store"
    And no CDN cache-hit header such as "x-cache: HIT" or "cf-cache-status: HIT" is present

  Scenario: Edge case, the header is present on every repeated call
    Given the Task Notes backend API is running at "http://localhost:8000"
    When a client sends two GET requests to "/api/time" one second apart
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the two "now" values differ

  Scenario: Edge case, other methods on the path are rejected
    Given the Task Notes backend API is running at "http://localhost:8000"
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
