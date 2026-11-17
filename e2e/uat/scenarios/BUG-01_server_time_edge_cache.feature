Feature: BUG-01 Server time is not stored by the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to tell caches not to store its response
  So that the deployed environment always returns the current server time

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The response carries Cache-Control no-store
    Given the backend is running
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" is an ISO 8601 UTC timestamp

  Scenario: A test asserts the header on the response
    Given the backend test suite
    When the server-time integration tests run
    Then the run passes
    And it includes "test_get_server_time_sets_cache_control_no_store", which asserts the "Cache-Control" header equals "no-store"

  Scenario: The deployed environment returns a fresh time on every request
    Given the change is deployed behind its edge cache
    When a client sends a GET request to "/api/time" on the deployed host, waits one second, and sends it again
    Then the two "now" values differ
    And the response header "Cache-Control" is "no-store"
    And no CDN cache-status header reports a HIT

  Scenario: A POST is rejected and no cached body is served (edge case)
    Given the backend is running
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
    And the response does not carry a server-time body
