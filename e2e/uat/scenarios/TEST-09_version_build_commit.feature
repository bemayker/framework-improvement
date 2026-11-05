Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell deployments apart

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint returns 200 with version and commit strings
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the fields "version" and "commit"
    And both fields are strings

  Scenario: A 40-character BUILD_COMMIT is reported as its first 12 characters
    Given the environment variable "BUILD_COMMIT" is "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A short BUILD_COMMIT is reported unchanged
    Given the environment variable "BUILD_COMMIT" is "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset BUILD_COMMIT is reported as unknown
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is described by the VersionResponse schema
    When the OpenAPI document is read at "/openapi.json"
    Then the 200 response of "GET /api/version" references "VersionResponse"
    And "VersionResponse" has the string properties "version" and "commit"

  Scenario: The test suite covers the set and unset commit paths
    Given the backend test suite
    When the version unit and integration tests run
    Then the tests with BUILD_COMMIT set and unset pass with 0 failed

  Scenario: A blank BUILD_COMMIT is reported as unknown (edge case)
    Given the environment variable "BUILD_COMMIT" is set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"
