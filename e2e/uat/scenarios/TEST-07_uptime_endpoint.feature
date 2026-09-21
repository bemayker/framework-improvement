Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes API
  I want GET /api/uptime to report how long the process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A request returns 200 with exactly the two documented keys
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response body is a JSON object with exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a bare JSON number, not a quoted string
    And "started_at" is a JSON string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart
    Given the backend is running
    When a client sends a GET request to "/api/uptime" and records "uptime_seconds"
    And the client waits at least one second and sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are greater than or equal to 0
    And the second "uptime_seconds" value is at least 1 greater than the first

  Scenario: started_at is captured once at startup and carries an explicit UTC offset
    Given the backend has not restarted since it started serving
    When a client sends a GET request to "/api/uptime" and records "started_at"
    And the client sends a second GET request to "/api/uptime"
    Then the two "started_at" values are character-for-character identical
    And "started_at" ends with the explicit offset "+00:00", not "Z" and not a bare digit string

  Scenario: The response body is defined by the UptimeResponse schema
    Given the backend is running
    When the generated OpenAPI document at "/openapi.json" is inspected
    Then it defines a "UptimeResponse" schema with properties "uptime_seconds" of type "number" and "started_at" of type "string"
    And the "started_at" property carries the annotation "format": "date-time"
    And the 200 response of "/api/uptime" references the "UptimeResponse" schema

  Scenario: A backend restart resets uptime_seconds and moves started_at forward (edge case)
    Given the backend has been running for at least a few seconds
    When a client sends a GET request to "/api/uptime" and records "started_at" and "uptime_seconds"
    And the backend process is restarted
    And the client sends a GET request to "/api/uptime" once the backend is running again
    Then the new "started_at" is later than the recorded "started_at"
    And the new "uptime_seconds" is smaller than the recorded "uptime_seconds", close to 0
