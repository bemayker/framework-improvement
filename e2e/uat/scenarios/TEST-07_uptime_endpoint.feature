Feature: TEST-07 Uptime endpoint
  An operator can call GET /api/uptime to see how long the backend has been
  running and when it started, so a restart can be told from a long-lived
  process without reading container logs. Every check uses curl against the
  Docker Compose stack, never a browser.

  Background:
    Given the Docker Compose stack is running with "docker compose up -d --build"
    And the backend is published at "http://localhost:8010"

  # Criterion 1
  Scenario: The uptime endpoint answers 200 with both fields
    When a client sends GET "http://localhost:8010/api/uptime"
    Then the status is 200
    And the content-type is "application/json"
    And the body is a JSON object with exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a number
    And "started_at" is a string in ISO 8601 format

  Scenario: The uptime endpoint is read-only
    When a client sends POST "http://localhost:8010/api/uptime"
    Then the status is 405

  # Criterion 2
  Scenario: Uptime is non-negative and increases between two calls a second apart
    When a client sends GET "http://localhost:8010/api/uptime" and notes "uptime_seconds" as A
    And the client waits about one second
    And the client sends GET "http://localhost:8010/api/uptime" and notes "uptime_seconds" as B
    Then A is 0 or greater
    And B is greater than A

  # Criterion 3
  Scenario: started_at is captured once at startup and carries an explicit UTC offset
    When a client sends GET "http://localhost:8010/api/uptime" three times a few seconds apart
    Then "started_at" is identical in all three responses
    And "uptime_seconds" grows with each response
    And "started_at" ends in "+00:00"

  # Criterion 3, edge case
  Scenario: A restart produces a new started_at and a small uptime_seconds
    Given a client has noted "started_at" from GET "http://localhost:8010/api/uptime" as S1
    When the backend is restarted with "docker compose restart backend"
    And the backend is running again
    And the client sends GET "http://localhost:8010/api/uptime"
    Then "started_at" is later than S1
    And "uptime_seconds" is small, a few seconds

  # Criterion 4
  Scenario: The response body is defined by a Pydantic schema in backend/app/schemas
    Given the repository checkout
    Then "backend/app/schemas/uptime.py" defines the class "UptimeResponse"
    And "backend/app/routers/uptime.py" declares "response_model=UptimeResponse"
    When the uptime schema unit tests and the uptime integration tests run
    Then 0 failed
