Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the deployed Task Notes app
  I want GET /api/time to forbid caching
  So that the CDN in front of the API never returns a stale "now"

  Background:
    Given the Task Notes backend is running and published at "http://localhost:8010"

  Scenario: Time responses carry Cache-Control no-store
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 timestamp with an explicit UTC offset

  Scenario: A test asserts the header on the response
    Given the backend test suite is available
    When the server time integration tests run
    Then the test that asserts the "Cache-Control" header equals "no-store" passes
    And the run reports 0 failed

  Scenario: The deployed environment returns two different values one second apart
    Given the merge containing BUG-01 is deployed
    And a human has the deployed API host
    When the human requests "GET /api/time" on the deployed host, waits one second and requests it again
    Then the two "now" values differ
    And both responses carry the header "Cache-Control" with value "no-store"

  Scenario: The directive is scoped to the time route only (edge case)
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response carries no "Cache-Control" header with value "no-store"

  Scenario: POST to the time route is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
