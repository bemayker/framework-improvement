Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current time
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: A request returns 200 with an ISO 8601 UTC now and timezone equal to UTC
    Given the backend is running
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response body is a single JSON object with exactly the keys "now" and "timezone"
    And the response body field "timezone" is "UTC"
    And the response body field "now" ends with the offset "+00:00"

  Scenario: now is computed per request rather than cached at import
    Given the backend is running
    When a client sends a GET request to "/api/time"
    And waits one second
    And sends a second GET request to "/api/time"
    Then the second response's "now" value is later than the first
    And both "now" values end with the offset "+00:00"

  Scenario: The response body is defined by the TimeResponse schema
    Given the backend is running
    When the generated OpenAPI document at "/openapi.json" is inspected
    Then it defines a "TimeResponse" schema with the properties "now" and "timezone"
    And the 200 response of "/api/time" references that schema
    And the "timezone" property allows only the value "UTC"

  Scenario: Unit and integration tests cover the shape, the offset and the per-request freshness
    Given the repository at this branch
    When the backend test suite runs
    Then "test_time_unit.py" and "test_time_integration.py" both pass
    And their assertions cover the exact "+00:00" suffix and the per-request freshness

  Scenario: Two consecutive reads differ even when issued back to back (edge case)
    Given the backend is running
    When a client sends a GET request to "/api/time"
    And immediately sends a second GET request to "/api/time"
    Then the two "now" values are not identical
    And each still ends with the offset "+00:00"
