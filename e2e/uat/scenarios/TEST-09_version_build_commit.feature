Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell deployments apart

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has the string fields "version" and "commit"

  Scenario: A full 40-character sha is cut to its first 12 characters
    Given the backend was started with "BUILD_COMMIT" set to "3f2a9c1d4e5b6a7f8091a2b3c4d5e6f708192a3b"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "3f2a9c1d4e5b"

  Scenario: A short commit value is returned unchanged
    Given the backend was started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset BUILD_COMMIT gives unknown
    Given the backend was started with "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A blank BUILD_COMMIT gives unknown (edge case)
    Given the backend was started with "BUILD_COMMIT" set to three spaces
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by the VersionResponse schema
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the fields "version" and "commit"
    And the 200 response schema in "/docs" is "VersionResponse"

  Scenario: The version and config tests cover the set and unset commit paths
    Given the backend test suite
    When the version and config unit tests and the version integration tests run
    Then 0 tests fail
