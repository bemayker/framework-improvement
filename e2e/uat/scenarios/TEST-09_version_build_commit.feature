Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell deployments apart

  Background:
    Given the Task Notes backend is running
    And its API is reachable at "http://localhost:8010"

  Scenario: A long BUILD_COMMIT is cut to its first 12 characters (criterion 1)
    Given the environment variable "BUILD_COMMIT" is "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is "0123456789ab"

  Scenario: BUILD_COMMIT is read from the environment and defaults to unknown (criterion 2)
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "unknown"

  Scenario: The response shape is defined by the VersionResponse schema (criterion 3)
    When a client sends a GET request to "/openapi.json"
    Then the schema "VersionResponse" has the properties "version" and "commit"
    And both properties are of type "string"
    And both properties are required
    And the 200 response of "GET /api/version" references "#/components/schemas/VersionResponse"

  Scenario: The version and config tests cover the set and unset commit paths (criterion 4)
    Given the backend test suite
    When the config, version service and version integration tests run
    Then 0 tests fail
    And a test sets "BUILD_COMMIT" and expects the first 12 characters
    And a test unsets "BUILD_COMMIT" and expects "unknown"

  Scenario: A BUILD_COMMIT of exactly 12 characters is returned unchanged (edge case)
    Given the environment variable "BUILD_COMMIT" is "0123456789ab"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A BUILD_COMMIT shorter than 12 characters is returned unchanged (edge case)
    Given the environment variable "BUILD_COMMIT" is "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: A blank BUILD_COMMIT counts as unset (edge case)
    Given the environment variable "BUILD_COMMIT" is "   "
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: POST to the version endpoint stays not allowed (edge case)
    When a client sends a POST request to "/api/version"
    Then the response status code is 405
