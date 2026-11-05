Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes app
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with uptime_seconds and started_at (criterion 1)
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response body has exactly the keys "uptime_seconds" and "started_at"
    And the response body field "uptime_seconds" is a JSON number
    And the response body field "started_at" is an ISO 8601 date-time string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart (criterion 2)
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    And the client waits one second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are at least 0
    And the second "uptime_seconds" is larger than the first

  Scenario: started_at is captured once and serialised in UTC with an explicit offset (criterion 3)
    Given the backend is running
    When a client sends a GET request to "/api/uptime" twice
    Then "started_at" is the identical string in both responses
    And "started_at" ends in "+00:00"
    And "started_at" does not end in "Z" and carries no local offset

  Scenario: The response body is defined by a Pydantic schema (criterion 4)
    Given the backend is running
    When a reviewer opens the OpenAPI document at "http://localhost:8010/docs"
    Then "GET /api/uptime" returns the "UptimeResponse" schema
    And the schema has the fields "uptime_seconds" and "started_at"
    And "started_at" is documented as a plain string without a "date-time" format
    And the schema is defined in "backend/app/schemas/uptime.py"

  Scenario: A restarted backend reports a later started_at and a small uptime_seconds (edge case)
    Given the backend answered GET "/api/uptime" with a "started_at" value
    When the "backend" service is restarted and is running again
    And a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And "started_at" is later than the value read before the restart
    And "uptime_seconds" is a few seconds, smaller than before the restart
