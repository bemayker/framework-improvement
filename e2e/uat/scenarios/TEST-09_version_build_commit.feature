Feature: TEST-09 Version endpoint reports the build commit
  As an operator
  I want GET /api/version to report the commit the backend was built from
  So that I can tell which build is running

  Background:
    Given the backend is running

  # Criterion 1
  Scenario: Version endpoint returns 200 with version and commit strings
    When I request GET /api/version
    Then the response status is 200
    And the response body has exactly the keys "version" and "commit"
    And "version" is a string
    And "commit" is a non-empty string

  # Criterion 2
  Scenario: Commit reports the value supplied at build time
    Given the backend was built with BUILD_COMMIT "3f9c2a1"
    When I request GET /api/version
    Then "commit" is "3f9c2a1"
    And "version" is unchanged from a build without BUILD_COMMIT

  # Criterion 2
  Scenario: Commit defaults to "unknown" when no build commit was supplied
    Given the backend was built without BUILD_COMMIT
    When I request GET /api/version
    Then "commit" is "unknown"

  # Criterion 2, edge case
  Scenario: An empty BUILD_COMMIT is treated as unset
    Given the backend was built with BUILD_COMMIT set to an empty string
    When I request GET /api/version
    Then "commit" is "unknown"
    And "commit" is not an empty string

  # Criterion 2, edge case
  Scenario: The router carries no commit literal
    When I read backend/app/routers/version.py
    Then no commit string appears in the file
    And the value comes from "get_build_commit()"

  # Criterion 3
  Scenario: The response body is the VersionResponse schema
    Given the API docs page is available
    When I inspect GET /api/version in the API docs
    Then its 200 response schema is named "VersionResponse"
    And "VersionResponse" lists "version" and "commit" as required strings

  # Criterion 4
  Scenario: Unit and integration tests cover the set and unset commit paths
    When I run the backend unit and integration tests for config, version service and version endpoint
    Then the commit set, unset and empty cases pass
    And an integration test asserts "commit" equals the set BUILD_COMMIT
    And an integration test asserts "commit" is "unknown" when it is unset
