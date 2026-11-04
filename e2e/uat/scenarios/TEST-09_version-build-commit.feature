Feature: TEST-09 Version endpoint reports the build commit
  A client can ask the API which build it is talking to.

  Background:
    Given the backend is running

  # Criterion 1
  Scenario: The version endpoint returns the version and the commit
    When a client requests GET /api/version
    Then the status is 200
    And the body has a string "version"
    And the body has a string "commit"

  # Criterion 2
  Scenario: A full sha in BUILD_COMMIT is reported as its first 12 characters
    Given BUILD_COMMIT is "0123456789abcdef0123456789abcdef01234567"
    When a client requests GET /api/version
    Then "commit" is "0123456789ab"

  # Criterion 2
  Scenario: An unset BUILD_COMMIT is reported as unknown
    Given BUILD_COMMIT is unset
    When a client requests GET /api/version
    Then "commit" is "unknown"

  # Edge case
  Scenario: A blank BUILD_COMMIT is reported as unknown
    Given BUILD_COMMIT is set to a blank value
    When a client requests GET /api/version
    Then "commit" is "unknown"

  # Criterion 3
  Scenario: The body has exactly the keys defined by the schema
    When a client requests GET /api/version
    Then the body has exactly the keys "version" and "commit"

  # Criterion 4
  Scenario: The version unit and integration tests pass
    Given the repository
    When the version unit and integration tests run
    Then 0 failed
