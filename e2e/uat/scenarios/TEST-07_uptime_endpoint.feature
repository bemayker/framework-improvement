Feature: TEST-07 Uptime endpoint
  GET /api/uptime reports how long the backend process has been running, so an
  operator can tell a restart from a long-lived process without reading
  container logs.

  Background:
    Given the backend is running

  Scenario: Criterion 1, the endpoint returns 200 with uptime_seconds and started_at
    When a client sends GET /api/uptime
    Then the status is 200
    And the body has exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a number
    And "started_at" is an ISO 8601 string

  Scenario: Criterion 2, uptime_seconds is non-negative and increases between calls a second apart
    When a client sends GET /api/uptime twice, one second apart
    Then both "uptime_seconds" values are at least 0
    And the second value is larger than the first by about one second

  Scenario: Criterion 3, started_at is captured once at startup and serialised in UTC
    When a client sends GET /api/uptime twice
    Then "started_at" is identical in both responses
    And "started_at" ends in "Z", the UTC offset designator
    And the router contains no datetime.now call, the start is captured in the lifespan

  Scenario: Criterion 4, the response body is defined by a Pydantic schema
    When a client reads /openapi.json
    Then the 200 response of GET /api/uptime references the "UptimeResponse" schema
    And "started_at" in that schema has format "date-time"
    And "uptime_seconds" in that schema has minimum 0

  Scenario: Edge case, a restart produces a new started_at and a reset uptime
    Given a client has read GET /api/uptime and noted "started_at"
    When the backend is restarted and the client sends GET /api/uptime again
    Then "started_at" is later than the noted value
    And "uptime_seconds" is small, a few seconds

  Scenario: Verification, the uptime tests pass
    When the tests in backend/tests/integration/test_uptime_integration.py, backend/tests/unit/test_uptime_service_unit.py, backend/tests/unit/test_uptime_schema_unit.py and backend/tests/unit/test_main_unit.py are run
    Then the run reports 0 failed
