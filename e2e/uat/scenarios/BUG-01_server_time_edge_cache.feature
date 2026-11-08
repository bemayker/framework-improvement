Feature: BUG-01 Server time is not cached by the edge

  Background:
    Given the backend API is running at "http://localhost:8000"

  Scenario: Criterion 1 - GET /api/time carries Cache-Control no-store
    When a client sends GET /api/time
    Then the response status is 200
    And the "Cache-Control" header is "no-store"
    And the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"

  Scenario: Criterion 2 - A test asserts the header on the response
    When the tests in "backend/tests/integration/test_server_time_integration.py", "backend/tests/unit/test_server_time_service_unit.py" and "backend/tests/unit/test_main_unit.py" are run
    Then the run reports 0 failed
    And the integration test asserts the "cache-control" response header equals "no-store"

  Scenario: Criterion 3 - Deployed reproduction returns two different values
    Given the fix is merged and deployed behind the CDN
    When two GET /api/time requests are sent one second apart to the deployed host
    Then the two "now" values differ
    And the response carries "Cache-Control: no-store"

  Scenario: Edge case - POST is rejected and carries no cached body
    When a client sends POST /api/time
    Then the response status is 405
    And the response body does not contain "now"
