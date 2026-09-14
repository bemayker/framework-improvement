Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current time
  So that I can detect clock skew against the API without standing up a second service

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"
    And the backend is running
    And the endpoint opens no database connection, so the state of the "db" service does not affect any scenario below

  Scenario: The endpoint answers HTTP 200 with a now timestamp and the UTC timezone label
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the two keys "now" and "timezone"
    And "timezone" is exactly "UTC"
    And "now" is a full ISO 8601 timestamp of the shape "2026-09-14T10:15:30.123456+00:00"

  Scenario: now is computed per request, in UTC, with an explicit offset, and is never naive
    When a client sends a GET request to "/api/time"
    And the client waits at least one second and sends the same request again
    Then both "now" values end with the six characters "+00:00"
    And neither "now" value ends with the letter "Z"
    And neither "now" value ends with a bare time, which is what a naive timestamp would look like
    And the second "now" parses as a later instant than the first
    And each "now" is within a few seconds of the host's own current UTC time

  Scenario: The 200 response body is documented by the ServerTimeResponse schema component
    When a client sends a GET request to "/openapi.json"
    Then the response status code is 200
    And the 200 response of "GET /api/time" references the schema component "#/components/schemas/ServerTimeResponse"
    And the "ServerTimeResponse" component has exactly the properties "now" and "timezone"
    And the "timezone" property is an enum whose only value is "UTC"
    And the router returns that Pydantic model rather than a bare dict

  Scenario: The backend test suite covers the shape, the offset and the per-request freshness
    Given a checkout of the repository with the backend dependencies synced
    When "uv run pytest -q" runs from the "backend" directory
    Then "tests/unit/test_server_time_unit.py" and "tests/integration/test_server_time_integration.py" are both collected
    And the unit tier covers the aware UTC result, the naive-datetime rejection, the non-UTC timezone rejection and the "+00:00" suffix
    And the integration tier covers the 200 body shape, a parsed offset of zero, and two requests one second apart
    And the run reports 0 failed

  Scenario: Repeated requests never return the same or an earlier timestamp (edge case)
    When a client sends three GET requests to "/api/time" in quick succession
    Then all three "now" values are distinct
    And each one parses as strictly later than the one before it
    And no value is ever repeated, because the clock is read inside the handler on every call and nothing is cached
