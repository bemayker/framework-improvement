Feature: BUG-01 Server time is not served stale from the edge cache

  Background:
    Given the backend API is running on port 8000

  Scenario: Criterion 1 - the time endpoint forbids caching
    When a client requests GET /api/time
    Then the response status is 200
    And the response header "Cache-Control" is "no-store"
    And the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"
    And "now" ends in "+00:00"

  Scenario: Criterion 2 - a test asserts the header on the response
    When the server-time unit and integration test files are run:
      | backend/tests/integration/test_server_time_integration.py |
      | backend/tests/unit/test_server_time_unit.py               |
    Then 0 failed
    And the integration test file asserts the "cache-control" response header equals "no-store"

  Scenario: Criterion 3 - the deployed reproduction returns two different values
    Given the fix is deployed behind the CDN at the deployed host
    When a human requests GET /api/time on the deployed host
    And waits one second
    And requests GET /api/time on the deployed host again
    Then the response carries the header "Cache-Control: no-store"
    And the two "now" values differ

  Scenario: Edge case - a non-GET method is rejected
    When a client sends POST /api/time
    Then the response status is 405
