Feature: BUG-01 Server time is not served stale from the edge cache
  As a client of the Task Notes API
  I want GET /api/time to carry a Cache-Control: no-store directive
  So that a CDN or browser never serves an old server time

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8000"

  Scenario: The time response carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is "no-store"
    And the response body field "now" is a UTC timestamp
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite is installed
    When the server-time integration tests and the app factory unit tests run
    Then they pass with 0 failed
    And the integration test asserting the "Cache-Control" header is among the passed tests

  Scenario: Two requests a second apart return different values on the deployed environment (criterion 3, deployed only)
    Given the fix is deployed and the deployed host name is known
    When a client sends a GET request to "https://<deployed-host>/api/time"
    And the client waits one second
    And the client sends the same GET request again
    Then both responses carry the header "Cache-Control: no-store" as delivered through the CDN
    And the "now" values of the two responses differ

  Scenario: Identical values on the deployed environment point at the CDN, not the code (criterion 3, failure path)
    Given the two deployed responses carry the same "now" value
    When the tester inspects the response headers
    Then a CDN cache-hit header such as "x-cache: HIT" or "cf-cache-status: HIT" is recorded on the work item
    And the cause is a CDN rule overriding the origin header, not a defect in this change

  Scenario: A method other than GET is rejected (edge case)
    When a client sends a POST request to "/api/time"
    Then the response status code is 405
