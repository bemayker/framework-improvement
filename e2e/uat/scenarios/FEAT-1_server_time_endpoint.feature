Feature: FEAT-1 Server time endpoint
  As a client of the Task Notes API
  I want GET /api/time to report the server's current UTC time
  So that I can detect clock skew against the API without a second service

  Background:
    Given the Task Notes backend is running locally at "http://localhost:8000"
    And no database is needed for this endpoint

  Scenario: AC1 GET /api/time answers 200 with now and timezone
    When a client sends a GET request to "/api/time"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the keys "now" and "timezone"
    And the response body field "timezone" is "UTC"

  Scenario: AC1 Other methods on the path are rejected
    When a client sends a POST request to "/api/time"
    Then the response status code is 405

  Scenario: AC2 now is computed per request
    Given a client has sent a GET request to "/api/time" and noted "now"
    When about one second passes
    And the client sends a second GET request to "/api/time"
    Then the second "now" differs from the first
    And the second "now" is later than the first

  Scenario: AC2 now is serialised in UTC with an explicit offset
    When a client sends a GET request to "/api/time"
    Then the response body field "now" ends with "+00:00"
    And the same value agrees with the output of "date -u" to within a couple of seconds

  Scenario: AC2 edge case, now never ends in Z and is never naive
    When a client sends a GET request to "/api/time" several times
    Then no "now" value ends with "Z"
    And every "now" value carries an explicit "+00:00" offset
    And no "now" value lacks an offset

  Scenario: AC3 The response body is defined by a Pydantic schema
    When a client opens "/openapi.json"
    Then the 200 response of GET "/api/time" references the "ServerTimeResponse" schema
    And that schema has the fields "now" and "timezone"
    And the handler in "backend/app/routers/server_time.py" returns a "ServerTimeResponse", not a dict literal

  Scenario: AC4 The unit and integration tests cover shape, offset and freshness
    Given the backend dependencies are installed
    When the server time unit and integration tests and the app factory unit tests are run
    Then the command exits 0
    And the summary reports no failed or errored test
    And the verbose output lists "test_get_time_computes_now_per_request"
    And the verbose output lists "test_get_time_now_ends_with_plus_zero_offset"
    And the verbose output lists "test_server_time_response_serializes_now_with_plus_zero_offset_suffix"
