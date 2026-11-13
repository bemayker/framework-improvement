Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes app
  I want GET /api/uptime to report how long the backend process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with uptime_seconds and started_at
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response is JSON
    And the response body has exactly the keys "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is a JSON string

  Scenario: uptime_seconds is non-negative and increases between two calls a second apart
    Given a client has sent a GET request to "/api/uptime" and noted "uptime_seconds"
    When the client waits about one second
    And the client sends a second GET request to "/api/uptime"
    Then both "uptime_seconds" values are greater than or equal to 0
    And the second "uptime_seconds" is larger than the first by roughly 1

  Scenario: started_at is captured once and serialised in UTC with an explicit offset
    When a client sends two GET requests to "/api/uptime" a few seconds apart
    Then "started_at" is identical, character for character, in both responses
    And "started_at" ends in "+00:00"
    And "uptime_seconds" grew between the two responses

  Scenario: started_at changes when the backend is restarted
    Given a client has noted "started_at" from "/api/uptime"
    When the "backend" service is restarted and answers again
    And the client sends a GET request to "/api/uptime"
    Then "started_at" is a later timestamp than the one noted before the restart
    And "uptime_seconds" is small, a few seconds

  Scenario: The response body is defined by the UptimeResponse schema
    Given the generated OpenAPI document at "/openapi.json"
    When the client reads the 200 response of "GET /api/uptime"
    Then it references the "UptimeResponse" schema
    And "UptimeResponse" has the fields "uptime_seconds" and "started_at"

  Scenario: A POST to the uptime endpoint is rejected with 405 (edge case)
    When a client sends a POST request to "/api/uptime"
    Then the response status code is 405
