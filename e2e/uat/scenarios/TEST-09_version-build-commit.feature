Feature: TEST-09 Version endpoint reports the build commit
  GET /api/version tells a client which build it is talking to: the application
  version and the commit the build was made from. There is no UI for it, so the
  scenarios are phrased as HTTP requests and responses.

  Background:
    Given the backend is running and reachable at http://localhost:8010

  Scenario: Criterion 1 - version responds with 200 and the two string fields
    Given BUILD_COMMIT is not set for the backend
    When a client requests GET /api/version
    Then the response status is 200
    And the response content type is application/json
    And the body is a JSON object with exactly the keys "version" and "commit"
    And "version" and "commit" are both JSON strings

  Scenario: Criterion 2 - commit defaults to unknown when BUILD_COMMIT is unset
    Given BUILD_COMMIT is not set for the backend
    When a client requests GET /api/version
    Then "commit" is "unknown"

  Scenario: Criterion 2 - commit comes from BUILD_COMMIT when it is set
    Given BUILD_COMMIT is set to "abc1234" for the backend
    When a client requests GET /api/version
    Then "commit" is "abc1234"

  Scenario: Criterion 2 edge case - a blank BUILD_COMMIT is treated as unset
    Given BUILD_COMMIT is set to an empty value for the backend
    When a client requests GET /api/version
    Then "commit" is "unknown"

  Scenario: Criterion 2 edge case - a 40-character sha is shortened to its first 12 characters
    Given BUILD_COMMIT is set to "0123456789abcdef0123456789abcdef01234567" for the backend
    When a client requests GET /api/version
    Then "commit" is "0123456789ab"

  Scenario: Criterion 2 - commit is not typed into the router
    When a reviewer searches backend/app for "BUILD_COMMIT"
    Then the only code reading it is in backend/app/core/config.py
    And backend/app/routers/version.py holds no commit literal and calls get_build_commit()

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    When a client opens the OpenAPI document at /openapi.json
    Then the 200 response of GET /api/version references the schema "VersionResponse"
    And "version" and "commit" are declared as strings
    And both fields are required

  Scenario: Criterion 4 - the unit and integration tests cover the set and unset commit paths
    When the tests in backend/tests/unit/test_config_unit.py, backend/tests/unit/test_version_service_unit.py and backend/tests/integration/test_version_integration.py are run
    Then the result reports 0 failed
    And each of the service unit tests and the integration tests has a case for BUILD_COMMIT set to a 40-character sha and one for BUILD_COMMIT unset

  Scenario: Edge case - a method other than GET is rejected
    When a client requests POST /api/version
    Then the response status is 405
