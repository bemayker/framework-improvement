Feature: TEST-09 Version endpoint reports the build commit
  GET /api/version tells a client which build it is talking to: the app version
  and the build commit. The commit comes from the BUILD_COMMIT environment
  variable, defaults to "unknown", and is cut to its first 12 characters. There
  is no UI for it, so the scenarios are phrased as HTTP requests and responses.

  Background:
    Given the backend is running and reachable at http://localhost:8010

  Scenario: Criterion 1 - version responds with 200 and the two fields
    When a client requests GET /api/version
    Then the response status is 200
    And the response content type is application/json
    And the body is a JSON object with exactly the keys "version" and "commit"
    And "version" is a JSON string
    And "commit" is a JSON string

  Scenario: Criterion 2 - commit defaults to unknown when BUILD_COMMIT is unset
    Given BUILD_COMMIT is not set for the backend
    When a client requests GET /api/version
    Then "commit" is "unknown"

  Scenario: Criterion 2 - commit is the first 12 characters of a longer BUILD_COMMIT
    Given BUILD_COMMIT is "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"
    When a client requests GET /api/version
    Then "commit" is "1a2b3c4d5e6f"
    And "version" is unchanged

  Scenario: Criterion 2 edge case - a short BUILD_COMMIT is returned unchanged
    Given BUILD_COMMIT is "abc123"
    When a client requests GET /api/version
    Then "commit" is "abc123"

  Scenario: Criterion 2 edge case - a blank BUILD_COMMIT is treated as unset
    Given BUILD_COMMIT is set to a single space
    When a client requests GET /api/version
    Then "commit" is "unknown"

  Scenario: Criterion 2 - the router holds no commit literal
    When the file backend/app/routers/version.py is read
    Then it contains no commit string literal
    And the commit value comes from get_build_commit()

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    When a client opens the OpenAPI document at /openapi.json
    Then the 200 response of GET /api/version references the schema "VersionResponse"
    And "version" is declared as a required string
    And "commit" is declared as a required string

  Scenario: Criterion 4 - unit and integration tests cover the set and unset commit paths
    When the tests in backend/tests/unit/test_config_unit.py, backend/tests/unit/test_version_service_unit.py and backend/tests/integration/test_version_integration.py are run
    Then the summary line reports 0 failed

  Scenario: Edge case - a method other than GET is rejected
    When a client requests POST /api/version
    Then the response status is 405
