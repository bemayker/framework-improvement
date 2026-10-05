Feature: TEST-09 Version endpoint reports the build commit
  A client can ask the API which build it is talking to. The commit comes from
  the build-time BUILD_COMMIT variable (default "unknown"), cut to its first
  12 characters. These are API observations: request GET /api/version and read
  the JSON body.

  Background:
    Given the backend API is running

  Scenario: Criterion 1 - the version endpoint returns version and commit
    When a client requests GET /api/version
    Then the response status is 200
    And the response content type is application/json
    And the body has exactly the string fields "version" and "commit"

  Scenario: Criterion 2 - commit is "unknown" when BUILD_COMMIT is not set
    Given the backend image was built without BUILD_COMMIT
    When a client requests GET /api/version
    Then the "commit" field is "unknown"

  Scenario: Criterion 2 - commit comes from the build-time BUILD_COMMIT
    Given the backend image was built with BUILD_COMMIT "abc1234"
    When a client requests GET /api/version
    Then the "commit" field is "abc1234"

  Scenario: Criterion 3 - the response body is defined by a Pydantic schema
    When a client requests GET /openapi.json
    Then the "VersionResponse" component lists "version" and "commit" as required string properties

  Scenario: Criterion 4 - the set and unset commit paths are covered by tests
    Given the backend unit and integration test suites
    When the version, config and version service tests run
    Then the set, unset and blank BUILD_COMMIT tests pass in the unit tier
    And the set and unset BUILD_COMMIT tests pass in the integration tier

  Scenario: Edge case - a 40-character sha is cut to its first 12 characters
    Given the backend image was built with BUILD_COMMIT "0123456789abcdef0123456789abcdef01234567"
    When a client requests GET /api/version
    Then the "commit" field is "0123456789ab"
    And the "commit" field is 12 characters long
