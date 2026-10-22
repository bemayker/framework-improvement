Feature: TEST-07 Uptime endpoint
  GET /api/uptime reports how long the backend process has been running and
  the UTC instant it started, so an operator can tell a restart from a
  long-lived process without reading container logs. There is no UI for this
  endpoint; scenarios are HTTP requests against the running backend.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  # Criterion 1
  Scenario: The endpoint returns the uptime and the start time
    When a client sends GET "/api/uptime"
    Then the status is 200
    And the body holds exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is a JSON string

  # Criterion 2
  Scenario: Uptime is non-negative and grows between two calls a second apart
    When a client sends GET "/api/uptime" and again one second later
    Then both "uptime_seconds" values are 0 or greater
    And the second "uptime_seconds" exceeds the first by about 1 second

  # Criterion 3
  Scenario: The start time is the same on every call and carries a UTC offset
    When a client sends GET "/api/uptime" twice, two seconds apart
    Then "started_at" is identical in both bodies
    And "started_at" ends in "Z", the ISO 8601 zero-offset designator
    And "started_at" parses to a datetime whose UTC offset is zero

  # Criterion 3, edge case (restart)
  Scenario: A restart yields a new start time and a small uptime
    Given a client has read "started_at" from GET "/api/uptime"
    When the backend service is restarted and is running again
    And a client sends GET "/api/uptime"
    Then "started_at" is a later instant than before the restart
    And "uptime_seconds" is small, a few seconds

  # Criterion 4
  Scenario: The response is defined by the UptimeResponse schema
    When a reader opens "/openapi.json"
    Then the 200 response of GET "/api/uptime" references "#/components/schemas/UptimeResponse"
    And "UptimeResponse" lists "uptime_seconds" and "started_at" as required properties
    And "uptime_seconds" has type "number"
    And "started_at" has type "string" and format "date-time"

  # Regression guard for criteria 1 to 4
  Scenario: The uptime tests pass
    When the tests in "tests/unit/test_uptime_unit.py", "tests/unit/test_main_unit.py" and "tests/integration/test_uptime_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run reports 0 failed
