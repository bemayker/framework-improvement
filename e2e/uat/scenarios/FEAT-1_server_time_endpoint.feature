Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current time, so a client can detect clock
  skew against the API without a second service.

  Background:
    Given the backend is running

  Scenario: Criterion 1, the endpoint returns 200 with now and timezone
    When a client sends GET /api/time
    Then the status is 200
    And the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"

  Scenario: Criterion 2, now is computed per request, in UTC with an explicit offset
    When a client sends GET /api/time twice, one second apart
    Then the two "now" values differ by about one second
    And each "now" ends in "Z", the UTC offset designator
    And no "now" is a timestamp without an offset

  Scenario: Criterion 3, the response body is defined by a Pydantic schema
    When a client reads /openapi.json
    Then the 200 response of GET /api/time references the "ServerTimeResponse" schema
    And "now" in that schema has format "date-time"

  Scenario: Criterion 4, the unit and integration tests cover shape, offset and freshness
    When the tests in backend/tests/unit/test_server_time_unit.py, backend/tests/integration/test_server_time_integration.py and backend/tests/unit/test_main_unit.py are run
    Then the run reports 0 failed

  Scenario: Edge case, a non-GET method is rejected
    When a client sends POST /api/time
    Then the status is 405
