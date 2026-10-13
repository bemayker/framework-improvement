Feature: TEST-09 Version endpoint reports the build commit
  GET /api/version tells a client which build it is talking to, by reporting the
  commit the backend image was built from next to the package version.

  Background:
    Given the backend is running

  Scenario: Criterion 1, the endpoint returns 200 with version and commit strings
    When a client sends GET /api/version
    Then the status is 200
    And the body has exactly the keys "version" and "commit"
    And "version" is a string
    And "commit" is a string

  Scenario: Criterion 2, commit is "unknown" when no build commit was set
    Given the backend was built without BUILD_COMMIT
    When a client sends GET /api/version
    Then "commit" is "unknown"

  Scenario: Criterion 2, commit comes from BUILD_COMMIT and a short value is returned unchanged
    Given the backend was built with BUILD_COMMIT "abc1234"
    When a client sends GET /api/version
    Then "commit" is "abc1234"
    And the router contains no commit string literal, the value comes from get_build_commit()

  Scenario: Edge case, a 40-character sha is shortened to its first 12 characters
    Given the backend was built with BUILD_COMMIT "0123456789abcdef0123456789abcdef01234567"
    When a client sends GET /api/version
    Then "commit" is "0123456789ab"

  Scenario: Criterion 3, the response body is defined by a Pydantic schema
    When a client reads /openapi.json
    Then the 200 response of GET /api/version references the "VersionResponse" schema
    And "version" and "commit" in that schema are strings

  Scenario: Criterion 4, the version tests pass
    When the tests in backend/tests/unit/test_config_unit.py, backend/tests/unit/test_version_service_unit.py and backend/tests/integration/test_version_integration.py are run
    Then the run reports 0 failed
    And the tests include BUILD_COMMIT set, a 40-character sha, and BUILD_COMMIT unset
