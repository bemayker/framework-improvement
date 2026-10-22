Feature: TEST-09 Version endpoint reports the build commit
  GET /api/version tells a client which build it is talking to: the backend
  version and the commit the image was built from. The commit comes from the
  BUILD_COMMIT environment variable set at build time, defaults to "unknown"
  and is cut to its first 12 characters. There is no UI for this endpoint;
  scenarios are HTTP requests against the running backend.

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
  Scenario: The commit is the first 12 characters of a full sha set at build time
    Given the image was built with BUILD_COMMIT "0123456789abcdef0123456789abcdef01234567"
    When a client sends GET "/api/version"
    Then "commit" is "0123456789ab"

  # Criterion 2
  Scenario: The commit is unknown when no build commit was set
    Given the image was built without BUILD_COMMIT
    When a client sends GET "/api/version"
    Then "commit" is "unknown"

  # Criterion 2, edge case (shorter than the cut)
  Scenario: A value shorter than 12 characters is returned unchanged
    Given the image was built with BUILD_COMMIT "abc1234"
    When a client sends GET "/api/version"
    Then "commit" is "abc1234"

  # Criterion 2, edge case (exactly 12 characters)
  Scenario: A value exactly 12 characters long is returned unchanged
    Given the image was built with BUILD_COMMIT "0123456789ab"
    When a client sends GET "/api/version"
    Then "commit" is "0123456789ab"

  # Criterion 2, edge case (blank value)
  Scenario: A blank value is treated as unset
    Given the image was built with BUILD_COMMIT set to a blank value
    When a client sends GET "/api/version"
    Then "commit" is "unknown"

  # Criterion 3
  Scenario: The response is defined by the VersionResponse schema
    When a reader opens "/openapi.json"
    Then the 200 response of GET "/api/version" references "#/components/schemas/VersionResponse"
    And "VersionResponse" lists "version" and "commit" as required properties
    And "version" has type "string"
    And "commit" has type "string"

  # Criterion 4
  Scenario: The version tests pass
    When the tests in "tests/unit/test_config_unit.py", "tests/unit/test_version_service_unit.py" and "tests/integration/test_version_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run reports 0 failed
