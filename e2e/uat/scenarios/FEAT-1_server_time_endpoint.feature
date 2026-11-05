Feature: FEAT-1 Server time endpoint

  Background:
    Given the backend is running at http://localhost:8010

  Scenario: Criterion 1 - GET /api/time returns 200 with now and timezone
    When a client sends GET /api/time
    Then the status is 200
    And the content-type is application/json
    And the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"

  Scenario: Criterion 2 - now is computed per request in UTC with an explicit offset
    When a client sends GET /api/time
    And the client waits about one second
    And the client sends GET /api/time again
    Then the two "now" values differ
    And the second "now" is later than the first
    And both "now" values end with "+00:00"
    And neither "now" value ends with "Z" or lacks an offset

  Scenario: Criterion 3 - the body is defined by a Pydantic schema
    When a client reads the OpenAPI schema at /openapi.json
    Then the 200 response of GET /api/time references "ServerTimeResponse"

  Scenario: Criterion 4 - unit and integration tests cover shape, offset and freshness
    Given the repository
    When the tests in backend/tests/unit/test_server_time_unit.py, backend/tests/integration/test_server_time_integration.py and backend/tests/unit/test_main_unit.py run
    Then 0 failed

  Scenario: Edge case - a non-GET method is rejected
    When a client sends POST /api/time
    Then the status is 405
