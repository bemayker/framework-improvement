Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes app
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"
    And the backend has finished starting

  Scenario: The endpoint answers 200 with uptime_seconds and started_at (criterion 1)
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number, not a quoted string
    And "started_at" is a JSON string holding an ISO 8601 timestamp

  Scenario: uptime_seconds is non-negative and grows between calls a second apart (criterion 2)
    Given a client has sent a GET request to "/api/uptime" and noted "uptime_seconds" as A
    When the client waits one second
    And the client sends a GET request to "/api/uptime" and notes "uptime_seconds" as B
    Then A is greater than or equal to 0
    And B is greater than or equal to 0
    And B is greater than A by at least 0.9

  Scenario: started_at is captured once and does not change between requests (criterion 3)
    When a client sends a GET request to "/api/uptime" twice, a few seconds apart
    Then both responses carry a character-for-character identical "started_at"
    And "uptime_seconds" differs between the two responses

  Scenario: started_at is UTC with an explicit +00:00 offset (criterion 3)
    When a client sends a GET request to "/api/uptime"
    Then "started_at" ends in "+00:00"
    And "started_at" does not end in "Z"
    And "started_at" is earlier than the current UTC time by about "uptime_seconds"

  Scenario: A backend restart produces a new started_at and a small uptime (criterion 3)
    Given a client has noted "started_at" from "/api/uptime" as the old start
    When the "backend" service is restarted and answers again
    And the client sends a GET request to "/api/uptime"
    Then "started_at" is later than the old start
    And "uptime_seconds" is small, a few seconds

  Scenario: The response body is documented by the UptimeResponse schema (criterion 4)
    When a client sends a GET request to "/openapi.json"
    Then the GET operation on "/api/uptime" documents a 200 response referencing the "UptimeResponse" component
    And that component has the properties "uptime_seconds" and "started_at"
    And "uptime_seconds" is documented as a number
    And "started_at" is documented as a plain string with no "date-time" format
    And "backend/app/schemas/uptime.py" defines the class "UptimeResponse"
    When the test files "backend/tests/unit/test_uptime_schema_unit.py", "backend/tests/unit/test_uptime_service_unit.py" and "backend/tests/integration/test_uptime_integration.py" are run
    Then the run reports "0 failed"

  Scenario: A non-GET method is rejected with 405 (edge case)
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405

  Scenario: The endpoint needs no database (edge case)
    Given the "db" service has been stopped
    And the backend was not restarted
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response body has the keys "uptime_seconds" and "started_at"
