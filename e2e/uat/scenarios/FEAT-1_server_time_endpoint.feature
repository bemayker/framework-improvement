Feature: FEAT-1 Server time endpoint
  GET /api/time reports the server's current UTC time, so a client can detect
  clock skew against the API without a second service. There is no UI for this
  endpoint; scenarios are HTTP requests against the running backend.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  # Criterion 1
  Scenario: The endpoint returns the current time and the timezone
    When a client sends GET "/api/time"
    Then the status is 200
    And the body holds exactly the keys "now" and "timezone"
    And "now" is a JSON string
    And "timezone" is "UTC"

  # Criterion 2
  Scenario: The time is computed per request
    When a client sends GET "/api/time" and again one second later
    Then the two "now" values differ
    And the second "now" is about 1 second later than the first

  # Criterion 2
  Scenario: The time is UTC with an explicit offset and never naive
    When a client sends GET "/api/time"
    Then "now" ends in "Z", the ISO 8601 zero-offset designator
    And "now" does not end in "+00:00"
    And "now" parses to a datetime whose UTC offset is zero

  # Criterion 2, edge case (method)
  Scenario: A non-GET method is rejected
    When a client sends POST "/api/time"
    Then the status is 405

  # Criterion 3
  Scenario: The response is defined by the ServerTimeResponse schema
    When a reader opens "/openapi.json"
    Then the 200 response of GET "/api/time" references "#/components/schemas/ServerTimeResponse"
    And "ServerTimeResponse" has a property "now" of type "string" and format "date-time"
    And "ServerTimeResponse" has a property "timezone" restricted to "UTC"

  # Criterion 4
  Scenario: The time endpoint tests pass
    When the tests in "tests/unit/test_server_time_unit.py", "tests/unit/test_main_unit.py" and "tests/integration/test_server_time_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run reports 0 failed
