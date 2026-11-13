Feature: TEST-09 Version endpoint reports the build commit
  A client can ask the API which build it is talking to.

  Scenario: Criterion 1 - version endpoint returns version and commit
    Given the API is running with BUILD_COMMIT set to "abc123"
    When a client requests GET /api/version
    Then the status is 200
    And the body has exactly the string fields "version" and "commit"
    And "commit" is "abc123"

  Scenario: Criterion 2 - commit comes from BUILD_COMMIT and defaults to unknown
    Given the API is running without BUILD_COMMIT
    When a client requests GET /api/version
    Then "commit" is "unknown"

  Scenario: Criterion 2 - a blank BUILD_COMMIT is treated as unset
    Given the API is running with BUILD_COMMIT set to a blank value
    When a client requests GET /api/version
    Then "commit" is "unknown"

  Scenario: Criterion 2 edge case - a long BUILD_COMMIT is truncated to 12 characters
    Given the API is running with BUILD_COMMIT set to "283fc31296537221cbdef4aedabbd59d0237dc95"
    When a client requests GET /api/version
    Then "commit" is "283fc3129653"

  Scenario: Criterion 3 - response body is defined by a schema
    Given the API is running
    When a client reads /openapi.json
    Then VersionResponse lists "version" and "commit" as required string properties

  Scenario: Criterion 4 - set and unset commit paths are tested
    Given the backend unit and integration test suites
    When they run
    Then the set and unset commit tests pass with 0 failed
