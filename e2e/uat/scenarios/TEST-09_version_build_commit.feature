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
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: An unset BUILD_COMMIT yields the default "unknown"
    Given the backend has been started with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A 40-character BUILD_COMMIT is truncated to its first 12 characters (edge case)
    Given the backend has been started with "BUILD_COMMIT" set to "a1b2c3d4e5f60718293a4b5c6d7e8f9012345678"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "a1b2c3d4e5f6"
    And the response body field "version" is unchanged

  Scenario: A short BUILD_COMMIT is returned unchanged
    Given the backend has been started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: A blank BUILD_COMMIT is treated as unset
    Given the backend has been started with "BUILD_COMMIT" set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response body contains exactly the keys "version" and "commit"
    And the OpenAPI document at "/docs" shows the 200 response as "VersionResponse"

  Scenario: Tests cover the set and unset commit paths
    Given the backend unit and integration test suites
    When they run
    Then the set (truncated) and unset ("unknown") commit tests report 0 failed
