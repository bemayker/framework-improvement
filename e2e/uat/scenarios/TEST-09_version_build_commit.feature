Feature: TEST-09 Version endpoint reports the build commit
  GET /api/version tells a client which build it is talking to: the package
  version and the commit the build was made from. The commit comes from the
  BUILD_COMMIT environment variable and is cut to its first 12 characters.
  There is no UI for this endpoint; scenarios are HTTP requests against the
  running backend.

  Background:
    Given the backend is running and reachable at "http://localhost:8010"

  # Criterion 1
  Scenario: The endpoint returns the version and the commit
    When a client sends GET "/api/version"
    Then the status is 200
    And the body holds exactly the keys "version" and "commit"
    And "version" is a JSON string
    And "commit" is a JSON string

  # Criterion 2
  Scenario: The commit is "unknown" when BUILD_COMMIT is not set
    Given BUILD_COMMIT is not set for the backend
    When a client sends GET "/api/version"
    Then "commit" is "unknown"

  # Criterion 2
  Scenario: The commit comes from the BUILD_COMMIT environment variable
    Given BUILD_COMMIT is set to "abc1234" for the backend
    When a client sends GET "/api/version"
    Then "commit" is "abc1234"

  # Criterion 3
  Scenario: The response is defined by the VersionResponse schema
    When a reader opens "/openapi.json"
    Then the 200 response of GET "/api/version" references "#/components/schemas/VersionResponse"
    And "VersionResponse" has a property "version" of type "string"
    And "VersionResponse" has a property "commit" of type "string"

  # Criterion 4
  Scenario: The version tests pass
    When the tests in "tests/unit/test_config_unit.py", "tests/unit/test_version_service_unit.py" and "tests/integration/test_version_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run reports 0 failed

  # Criterion 5
  Scenario: A commit longer than 12 characters is cut to its first 12
    Given BUILD_COMMIT is set to "0123456789abcdef0123456789abcdef01234567" for the backend
    When a client sends GET "/api/version"
    Then "commit" is "0123456789ab"

  # Criterion 5, edge case (boundary)
  Scenario: A commit of exactly 12 characters is returned unchanged
    Given BUILD_COMMIT is set to "0123456789ab" for the backend
    When a client sends GET "/api/version"
    Then "commit" is "0123456789ab"
