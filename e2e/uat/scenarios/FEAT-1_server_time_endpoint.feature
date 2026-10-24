Feature: FEAT-1 Server time endpoint
  A client can read the server's current UTC time from GET /api/time.

  Scenario: Criterion 1 - the endpoint returns the time and the timezone
    Given the backend is running
    When a client sends GET /api/time
    Then the status is 200
    And the body has exactly the keys "now" and "timezone"
    And "timezone" is "UTC"

  Scenario: Criterion 2 - now is in UTC with an explicit offset
    Given the backend is running
    When a client sends GET /api/time
    Then "now" is an ISO 8601 timestamp ending in "+00:00"
    And "now" does not end in "Z"

  Scenario: Criterion 3 - the response is described by the ServerTimeResponse schema
    Given the API's OpenAPI document
    When a reader looks up the GET /api/time 200 response
    Then it references the "ServerTimeResponse" schema

  Scenario: Criterion 4 - the FEAT-1 unit and integration tests pass
    Given the backend test suite
    When the FEAT-1 unit and integration modules run
    Then 0 tests fail

  Scenario: Edge case - now is computed per request
    Given the backend is running
    When a client sends GET /api/time twice, one second apart
    Then the two "now" values differ
    And both end in "+00:00"
