Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current UTC time so a client can detect
  clock skew against the API. Backend only: every scenario runs against the
  HTTP endpoint, there is no UI and so no data-testid.

  Background:
    Given the backend is running on port 8000

  Scenario: Criterion 1, the endpoint returns 200 with now and timezone
    When I request GET /api/time
    Then the status is 200
    And the content type is application/json
    And the body has exactly the keys "now" and "timezone"
    And "timezone" equals "UTC"

  Scenario: Criterion 2, now is UTC with an explicit offset and never naive
    When I request GET /api/time
    Then "now" is an ISO 8601 timestamp in whole seconds
    And "now" ends with "+00:00"
    And "now" does not end with "Z"
    And "now" agrees with the current UTC time to within a few seconds

  Scenario: Criterion 2, now is computed per request
    Given I request GET /api/time and note "now"
    When I wait at least two seconds and request GET /api/time again
    Then the second "now" is later than the first
    And both values end with "+00:00"

  Scenario: Criterion 3, the response body is defined by a Pydantic schema
    When I open the OpenAPI document at /openapi.json
    Then GET /api/time's 200 response references the "ServerTimeResponse" schema
    And the "ServerTimeResponse" schema has the properties "now" and "timezone"

  Scenario: Criterion 4, the unit and integration tests cover shape, offset and freshness
    When I run the tests in backend/tests/unit/test_server_time_unit.py, backend/tests/unit/test_main_unit.py and backend/tests/integration/test_server_time_integration.py
    Then the run reports 0 failed
    And the test "test_get_time_computes_now_per_request" is among them

  Scenario: Edge case, a POST to the endpoint is rejected
    When I request POST /api/time
    Then the status is 405
