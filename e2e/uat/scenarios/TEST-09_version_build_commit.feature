Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want to ask which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend is set up per docker-compose.yml
    And the API is reachable at "http://localhost:8010"

  Scenario: Version endpoint returns the version and the commit
    Given the backend is running
    When a client requests GET "/api/version"
    Then the status is 200
    And the body has exactly the keys "version" and "commit"
    And both values are strings

  Scenario: Commit defaults to "unknown" when no build commit is declared
    Given the backend was built and started without BUILD_COMMIT
    When a client requests GET "/api/version"
    Then "commit" is "unknown"

  Scenario: Commit comes from the BUILD_COMMIT build-time variable
    Given the backend was built with BUILD_COMMIT set to "abc1234"
    When a client requests GET "/api/version"
    Then "commit" is "abc1234"
    And the router source contains no hardcoded commit string

  Scenario: Response body is described by a schema (documented API)
    Given the backend is running
    When a reader opens "http://localhost:8010/docs"
    Then the 200 response of GET "/api/version" is documented as "VersionResponse"
    And it declares the required string fields "version" and "commit"

  Scenario: Test suites cover the set and unset commit paths
    Given the backend test suite
    When the version and config unit tests and the version integration tests run
    Then they pass
    And they include a set-commit path and an unset-commit path

  Scenario: A full 40-character sha is cut to its first 12 characters (edge case)
    Given the backend was built with BUILD_COMMIT set to "0123456789abcdef0123456789abcdef01234567"
    When a client requests GET "/api/version"
    Then "commit" is "0123456789ab"
    And "commit" is not the full 40 characters
