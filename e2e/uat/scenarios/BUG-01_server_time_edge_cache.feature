Feature: BUG-01 Server time is not cached at the edge
  As an API consumer
  I want GET /api/time to carry Cache-Control: no-store
  So that a CDN never serves a stale server time

  Scenario: Response carries Cache-Control no-store (criterion 1)
    Given the API is running
    When I send GET /api/time
    Then the response status is 200
    And the response has header "Cache-Control" with value "no-store"
    And the response body has a "now" value ending in "Z"
    And the response body has "timezone" equal to "UTC"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite
    When I run the server time integration tests
    Then 0 tests fail
    And test_get_time_sets_cache_control_no_store is among the tests run

  Scenario: Deployed reproduction returns two different values (criterion 3, human on deployed environment)
    Given the fix is deployed behind the CDN at "<deployed-host>"
    When I send GET /api/time
    And I wait one second
    And I send GET /api/time again
    Then the two "now" values differ

  Scenario: Header is present on consecutive requests (edge case)
    Given the API is running
    When I send GET /api/time twice in a row
    Then both responses have header "Cache-Control" with value "no-store"
    And the second "now" value is later than the first
