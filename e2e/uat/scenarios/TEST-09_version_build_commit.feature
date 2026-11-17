Feature: TEST-09 Version endpoint reports the build commit
  A client can ask the API which build it is talking to.

  Scenario: AC1 - The version endpoint returns version and commit
    Given the backend is running
    When a client requests GET /api/version
    Then the status is 200
    And the body is a JSON object with string fields "version" and "commit"

  Scenario: AC2 - Commit comes from BUILD_COMMIT
    Given BUILD_COMMIT is set to "abc1234"
    When a client requests GET /api/version
    Then "commit" is "abc1234"

  Scenario: AC2 - Commit defaults to unknown when BUILD_COMMIT is unset
    Given BUILD_COMMIT is unset
    When a client requests GET /api/version
    Then "commit" is "unknown"

  Scenario: AC2 - Commit defaults to unknown when BUILD_COMMIT is blank
    Given BUILD_COMMIT is set to whitespace only
    When a client requests GET /api/version
    Then "commit" is "unknown"

  Scenario: AC2 edge case - A 40-character sha is truncated to 12 characters
    Given BUILD_COMMIT is "3f9c2a1b7d4e8f60a1b2c3d4e5f60718293a4b5c"
    When a client requests GET /api/version
    Then "commit" is "3f9c2a1b7d4e"
    And "commit" is exactly 12 characters long

  Scenario: AC3 - The response body is defined by a Pydantic schema
    Given the backend is running
    When a client reads /openapi.json
    Then the VersionResponse component declares "version" and "commit" as required strings

  Scenario: AC4 - Unit and integration tests cover the set and unset commit paths
    Given the backend test suite is available
    When the tests selected by "build_commit or commit" are run
    Then the set and unset commit tests are included
    And the run passes with no failed or errored test
