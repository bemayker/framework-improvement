Feature: BUG-01 Server time is not served stale from the edge cache
  As an operator of the Task Notes app
  I want GET /api/time to tell the edge cache not to store its response
  So that two requests a second apart return two different "now" values on the deployed environment

  Background:
    Given the Task Notes backend serves "GET /api/time"

  Scenario: The response carries Cache-Control no-store (criterion 1)
    Given the backend is running locally at "http://localhost:8010"
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body has exactly the fields "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend dependencies are installed
    When the server time integration tests are run
    Then the test "test_get_time_sets_cache_control_no_store" passes
    And it reads the "cache-control" header off the actual response, not off a module constant

  Scenario: The deployed reproduction returns two different values (criterion 3)
    Given the fix is deployed behind the edge cache
    And the verifier knows the deployed API host
    When a client sends a GET request to "https://<deployed-host>/api/time"
    And one second later sends a second GET request to the same URL
    Then both responses have status code 200
    And the "Cache-Control" header of the first response is "no-store"
    And the "now" values of the two responses differ

  Scenario: A second request is never answered from a stored copy (edge case)
    Given a client has just requested "/api/time" and read its "now" value
    When the client requests "/api/time" again
    Then the second "now" value is strictly later than the first
    And a POST request to "/api/time" answers 405
