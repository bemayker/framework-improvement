Feature: BUG-01 Server time is not stored by edge caches
  As an operator of the Task Notes app
  I want GET /api/time to forbid caching
  So that a CDN in front of the API never serves a stale clock value

  Background:
    Given the backend API is running at "http://localhost:8000"

  Scenario: The time response carries Cache-Control no-store (criterion 1)
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response header "Cache-Control" is exactly "no-store"
    And the response body has exactly the keys "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: A test asserts the header on the response (criterion 2)
    Given the backend test suite is checked out on the BUG-01 branch
    When the server time integration tests are run
    Then 0 tests fail
    And the run includes "test_get_time_response_carries_cache_control_no_store"
    And the run includes "test_get_time_cache_control_is_set_on_every_request"

  Scenario: The header is present on a second consecutive call (edge case)
    Given a client has already sent a GET request to "/api/time"
    When the client sends a second GET request to "/api/time"
    Then the response header "Cache-Control" is exactly "no-store"
    And the "now" value differs from the first response or is later than it

  @post-deploy @manual
  Scenario: Two requests a second apart return different values on the deployed environment (criterion 3)
    Given the BUG-01 change is merged and deployed behind the CDN
    When a human requests "https://<deployed-host>/api/time", waits 1 second, and requests it again
    Then the two "now" values differ
    And the second "now" is about one second later than the first
