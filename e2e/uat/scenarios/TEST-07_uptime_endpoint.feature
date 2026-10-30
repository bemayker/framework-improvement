Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes app
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"
    And the backend is running

  Scenario: The endpoint answers 200 with uptime_seconds and started_at
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the fields "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is an ISO 8601 date-time string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart
    When a client sends a GET request to "/api/uptime"
    And the client waits 1 second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are at least 0
    And the second "uptime_seconds" is larger than the first by about 1 second

  Scenario: started_at is captured once at startup and serialised in UTC with an explicit offset
    When a client sends a GET request to "/api/uptime"
    And the client waits 3 seconds
    And the client sends a second GET request to "/api/uptime"
    Then "started_at" is identical in both responses
    And "started_at" ends with "+00:00", not with "Z" and not without an offset
    And "started_at" is earlier than the current UTC time
    And "uptime_seconds" has grown by about 3 between the two responses

  Scenario: The response body is defined by the UptimeResponse schema
    When a reader opens "http://localhost:8010/openapi.json"
    Then "GET /api/uptime" documents its 200 response as a reference to "UptimeResponse"
    And the "UptimeResponse" schema has the fields "uptime_seconds" (number, minimum 0) and "started_at" (string)
    And the schema is defined in "backend/app/schemas/uptime.py"
    And running the tests "tests/unit/test_uptime_schema_unit.py", "tests/unit/test_uptime_service_unit.py", "tests/unit/test_main_unit.py" and "tests/integration/test_uptime_integration.py" reports 0 failed

  Scenario: A restarted backend reports a later started_at and a reset uptime (edge case)
    Given a client has read "started_at" and "uptime_seconds" from "/api/uptime"
    When the "backend" service is restarted and is running again
    And a client sends a GET request to "/api/uptime"
    Then "started_at" is later than the value read before the restart
    And "uptime_seconds" is small, a few seconds at most
