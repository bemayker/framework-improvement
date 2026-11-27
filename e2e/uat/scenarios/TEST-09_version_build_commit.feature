Feature: Version endpoint reports the build commit
  A client can ask the API which build it is talking to.

  Scenario: Criterion 1, the version endpoint returns version and commit
    Given the API is running
    When a client requests GET /api/version
    Then the response status is 200
    And the body has a string field "version"
    And the body has a string field "commit"

  Scenario: Criterion 2, commit comes from BUILD_COMMIT
    Given BUILD_COMMIT is set to "abc123"
    When a client requests GET /api/version
    Then the "commit" field equals "abc123"

  Scenario: Criterion 2, commit defaults to unknown when BUILD_COMMIT is unset
    Given BUILD_COMMIT is not set
    When a client requests GET /api/version
    Then the "commit" field equals "unknown"

  Scenario: Criterion 2, a blank BUILD_COMMIT is treated as unset
    Given BUILD_COMMIT is set to whitespace only
    When a client requests GET /api/version
    Then the "commit" field equals "unknown"

  Scenario: Edge case, a 40-character sha is truncated to 12 characters
    Given BUILD_COMMIT is "3f9c2ab71d04e5a6b7c8d9e0f1a2b3c4d5e6f708"
    When a client requests GET /api/version
    Then the "commit" field equals "3f9c2ab71d04"

  Scenario: Criterion 3, the response body is defined by a Pydantic schema
    Given the API is running
    When a client reads /openapi.json
    Then the VersionResponse schema declares "version" and "commit" as required strings

  Scenario: Criterion 4, the tests cover the set and unset commit paths
    Given the backend test suite
    When the version unit and integration tests run
    Then the run passes with no failed or errored test
