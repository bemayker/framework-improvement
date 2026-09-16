Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current time
  So that I can detect clock skew against the API without running a second service

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint returns 200 with the exact two-key shape
    Given the backend is running
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response body has exactly the keys "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: "now" is computed per request, in UTC, with an explicit offset, never naive
    Given the backend is running
    When a client sends a GET request to "/api/time" and records the "now" value
    And a client sends a second GET request to "/api/time" at least one second later and records the "now" value
    Then the two "now" values differ
    And the second "now" value is later than the first
    And both "now" values end in the explicit offset "+00:00"

  Scenario: The response body is defined by a Pydantic schema, not a bare dict
    Given the backend is running
    When a client fetches "/openapi.json"
    Then "components.schemas" contains a schema named "TimeResponse"
    And that schema declares "now" as a string with format "date-time"
    And that schema declares "timezone" as a string fixed to "UTC"
    And the "GET /api/time" operation's response references the "TimeResponse" schema

  Scenario: Unit and integration tests cover the shape, the offset, and the per-request freshness
    Given the repository checkout on this branch
    When the backend unit and integration test suites run
    Then "tests/unit/test_time_router_unit.py" and "tests/integration/test_time_integration.py" execute and pass
    And the executed tests assert the two-key response shape, the exact "+00:00" offset suffix, and two consecutive requests returning different, increasing values

  Scenario: A non-UTC aware instant is still reported in UTC (edge case)
    Given a "TimeResponse" is built from an instant carrying the offset "+02:00"
    When that "TimeResponse" is serialised
    Then the "now" field names the same instant with the offset "+00:00"
