Feature: FEAT-1 Server time endpoint
  As an API client
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API

  Background:
    Given the backend is running at "http://localhost:8010"

  Scenario: Criterion 1 - GET /api/time returns 200 with now and timezone
    When I send GET "/api/time"
    Then the response status is 200
    And the response content type is "application/json"
    And the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"

  Scenario: Criterion 2 - now is computed per request, in UTC, with an explicit offset
    When I send GET "/api/time"
    And I wait 1 second
    And I send GET "/api/time" again
    Then the two "now" values differ
    And the second "now" is later than the first
    And both "now" values end with "+00:00"
    And neither "now" value ends with "Z"

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    When I read "/openapi.json"
    Then the 200 response of GET "/api/time" references "#/components/schemas/ServerTimeResponse"

  Scenario: Criterion 4 - unit and integration tests cover shape, offset and freshness
    Given the repository is checked out on branch "feature/FEAT-1-server-time-endpoint"
    When I run the server_time unit and integration tests
    Then all of them pass and none is skipped

  Scenario: Edge case - a non-GET method is rejected with 405
    When I send POST "/api/time"
    Then the response status is 405
