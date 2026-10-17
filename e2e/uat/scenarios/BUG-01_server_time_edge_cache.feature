Feature: BUG-01 Server time is not cached by the edge

  Background:
    Given the backend is running at http://localhost:8010

  Scenario: Criterion 1 - GET /api/time responses carry Cache-Control no-store
    When I send GET /api/time
    Then the response status is 200
    And the response header "cache-control" equals "no-store"
    And the body has "now" ending in "+00:00" and "timezone" equal to "UTC"

  Scenario: Criterion 2 - A test asserts the header on the response
    When I run the tests in tests/integration/test_server_time_integration.py and tests/unit/test_server_time_router_unit.py
    Then 0 failed
    And the integration test for the cache-control header is among them

  Scenario: Criterion 3 - Deployed reproduction returns two different values
    Given the fix is deployed behind its CDN
    When I send GET https://<deployed-host>/api/time twice, one second apart
    Then both responses carry the header "cache-control" equal to "no-store"
    And the two "now" values differ

  Scenario: Edge case - a second request a second later also carries the header and a later now
    Given I have sent GET /api/time once
    When I wait one second and send GET /api/time again
    Then the second response header "cache-control" equals "no-store"
    And the second "now" is later than the first "now"
