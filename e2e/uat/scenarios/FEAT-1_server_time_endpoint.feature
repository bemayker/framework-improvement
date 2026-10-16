Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current time, so a client can detect clock
  skew against the API without a second service. There is no UI for this
  endpoint, so the steps are HTTP requests and responses.

  Background:
    Given the backend is running at http://localhost:8010

  Scenario: Criterion 1 - the endpoint returns 200 with now and timezone UTC
    When I request GET /api/time
    Then the status is 200
    And the JSON body has exactly the keys now and timezone
    And timezone is the string UTC
    And now is an ISO 8601 string

  Scenario: Criterion 2 - now is computed per request, UTC with an explicit offset
    When I request GET /api/time and note now
    And I wait one second
    And I request GET /api/time again
    Then both now values end in Z
    And neither now value ends in +00:00 or lacks an offset
    And the second now is one second or more later than the first
    And both now values parse as aware UTC datetimes with a zero offset

  Scenario: Criterion 2 edge - a non-UTC offset is normalised to Z
    Given a ServerTimeResponse built from 05:33:49 at offset +02:00
    When it is serialised to JSON
    Then now is 2026-10-16T03:33:49Z

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    When I read the OpenAPI document at http://localhost:8010/openapi.json
    Then GET /api/time responds with the schema ServerTimeResponse
    And now is a string with format date-time
    And timezone is a string restricted to UTC
    And both properties are required

  Scenario: Criterion 4 - automated tests for the feature pass
    When I run uv run --directory backend pytest -q tests/unit/test_server_time_unit.py tests/integration/test_server_time_integration.py tests/unit/test_main_unit.py
    Then the summary line reports 0 failed
