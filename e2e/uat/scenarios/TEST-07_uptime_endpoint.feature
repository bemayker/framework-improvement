Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes API
  I want GET /api/uptime to report how long the process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"
    And the backend is running
    And the endpoint opens no database connection, so the state of the "db" service does not affect any scenario below

  Scenario: The endpoint answers HTTP 200 with an elapsed-seconds number and a start timestamp
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the two keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a bare JSON number, written without quotes
    And "started_at" is a quoted ISO 8601 timestamp of the shape "2026-09-14T09:51:03.412876+00:00"
    And no other key is present in the body

  Scenario: uptime_seconds is never negative and grows between two calls a second apart
    When a client sends a GET request to "/api/uptime"
    And the client waits at least one second and sends the same request again
    Then both "uptime_seconds" values are zero or greater
    And neither value is negative
    And the second "uptime_seconds" is strictly greater than the first
    And the difference between them is at least one second

  Scenario: started_at is captured once at startup and is serialised in UTC with an explicit offset
    When a client sends a GET request to "/api/uptime"
    And the client waits a few seconds and sends the same request again
    Then both "started_at" values are byte-for-byte identical
    And the "uptime_seconds" value has grown between the two responses, so the timestamp is not recomputed per request
    And each "started_at" ends with the six characters "+00:00"
    And neither "started_at" ends with the letter "Z"
    And neither "started_at" ends with a bare time, which is what a naive timestamp would look like
    And "started_at" plus "uptime_seconds" is within a few seconds of the host's own current UTC time

  Scenario: The 200 response body is documented by the UptimeResponse schema component
    When a client sends a GET request to "/openapi.json"
    Then the response status code is 200
    And the 200 response of "GET /api/uptime" references the schema component "#/components/schemas/UptimeResponse"
    And the "UptimeResponse" component has exactly the properties "uptime_seconds" and "started_at"
    And both properties are listed as required
    And the "uptime_seconds" property has a minimum of 0
    And the router returns that Pydantic model rather than a bare dict

  Scenario: A backend restart moves started_at forward and resets the counter (edge case)
    Given a client has sent a GET request to "/api/uptime" and noted "uptime_seconds" and "started_at"
    When the backend container is restarted and reports running again
    And a client sends a GET request to "/api/uptime"
    Then the new "started_at" is a later instant than the noted one
    And the new "uptime_seconds" is a small value of a few seconds at most
    And the new "uptime_seconds" is smaller than the noted one
    And the new "started_at" still ends with the six characters "+00:00"
