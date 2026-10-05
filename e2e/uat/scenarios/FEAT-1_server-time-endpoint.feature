Feature: FEAT-1 Server time endpoint

  Background:
    Given the backend is running at "http://localhost:8010"

  Scenario: Criterion 1 - GET /api/time returns 200 with now and timezone
    When I request GET /api/time
    Then the status is 200
    And the body has exactly the keys "now" and "timezone"
    And "timezone" equals "UTC"

  Scenario: Criterion 2 - now is computed per request, in UTC with an explicit offset
    When I request GET /api/time twice one second apart
    Then the two "now" values differ
    And the second "now" is later than the first
    And each "now" ends with "+00:00"
    And no "now" ends with "Z" or lacks an offset

  Scenario: Criterion 3 - the response is defined by a Pydantic schema
    Given the API docs at "/docs"
    When I open GET /api/time
    Then the 200 response is documented by the "ServerTimeResponse" schema
    And the schema has the fields "now" and "timezone"

  Scenario: Criterion 4 - the server-time tests pass
    Given the backend test suite
    When I run the server-time unit and integration tests
    Then they all pass

  Scenario: Edge case - a non-GET method is rejected
    When I send POST /api/time
    Then the status is 405
