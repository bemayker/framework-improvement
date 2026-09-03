Feature: TEST-07 Uptime endpoint
  As an operator of the Task Notes API
  I want GET /api/uptime to report how long the process has been running
  So that I can tell a restart from a long-lived process without reading container logs

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"
    And the endpoint needs no database, so the "db" service state does not affect it
    And no frontend consumes this endpoint, so every check is an HTTP response read with curl

  Scenario: The endpoint answers 200 with the uptime and the process start
    Given the backend is running
    When a client sends a GET request to "/api/uptime"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the two fields "uptime_seconds" and "started_at"
    And "uptime_seconds" is a JSON number
    And "started_at" is a quoted ISO 8601 timestamp string

  Scenario: uptime_seconds is non-negative and grows between two calls a second apart
    Given the backend is running
    When a client sends a GET request to "/api/uptime", waits one second, and sends it again
    Then both "uptime_seconds" values are greater than or equal to 0
    And the second "uptime_seconds" is strictly greater than the first
    And the two values differ by roughly one second
    And the OpenAPI document at "/openapi.json" declares "components.schemas.UptimeResponse.properties.uptime_seconds" with "type" "number" and "minimum" 0
    And backend/app/routers/uptime.py contains no negativity comparison and no HTTPException

  Scenario: started_at is captured once per process and carries the explicit +00:00 offset
    Given the backend is running
    When a client sends a GET request to "/api/uptime" twice in succession
    Then both responses carry a character-for-character identical "started_at"
    And the two "uptime_seconds" values differ, so the identical value is not a cached response
    And "started_at" ends with "+00:00" rather than with "Z"
    And "started_at" parses as an aware timestamp whose UTC offset is zero
    And backend/app/services/uptime_service.py assigns STARTED_AT once at module level
    And get_uptime() reads STARTED_AT without reassigning it

  Scenario: The response body is declared by the UptimeResponse Pydantic schema
    Given the backend is running
    When a client sends a GET request to "/openapi.json"
    Then the 200 response of "/api/uptime" references the component schema "UptimeResponse"
    And "components.schemas.UptimeResponse" declares "started_at" with "type" "string" and "format" "date-time"
    And "components.schemas.UptimeResponse.required" lists both "uptime_seconds" and "started_at"
    And backend/app/schemas/uptime.py defines UptimeResponse as a Pydantic BaseModel with the fields "uptime_seconds" and "started_at"
    And the router returns UptimeResponse(...) rather than a dict literal

  Scenario: A backend restart moves started_at later and resets uptime_seconds (edge case)
    Given the backend is running and has been up for more than a minute
    And a client has recorded the current "started_at" and "uptime_seconds"
    When the operator runs "docker compose restart backend"
    And the backend reports running again
    And a client sends a GET request to "/api/uptime"
    Then "started_at" is a later timestamp than the recorded one
    And "uptime_seconds" is a small value of a few seconds rather than the recorded one
    And this is the restart an operator is meant to be able to see
