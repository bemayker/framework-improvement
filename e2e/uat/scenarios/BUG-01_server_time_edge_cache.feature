Feature: BUG-01 Server time is not served stale from the edge cache
  As a client of the Task Notes API on the deployed environment
  I want GET /api/time to tell the CDN not to cache its response
  So that two requests a second apart return two different server times

  Scenario: The response carries Cache-Control no-store (criterion 1)
    Given the Task Notes backend API is running at "http://localhost:8000" (or the backend URL the handover names)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with "+00:00"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite is available
    When the server-time integration tests are run
    Then the test "test_get_time_sets_cache_control_no_store" is among the tests run
    And that test passes
    And the run reports 0 failed

  Scenario: Two requests a second apart return different times on the deployed environment (criterion 3)
    Given the change is deployed behind the CDN at "https://<deployed-host>"
    When a client sends a GET request to "/api/time"
    And waits one second
    And sends a second GET request to "/api/time"
    Then both responses carry the header "Cache-Control" with value "no-store"
    And the "now" value of the second response differs from the first and is later than it
    And any CDN cache-status header reads a miss, bypass or dynamic value, never a hit

  Scenario: A POST to the route is rejected (edge case)
    Given the Task Notes backend API is running at "http://localhost:8000" (or the backend URL the handover names)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
