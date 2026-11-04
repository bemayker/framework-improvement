Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tie a running backend to the commit it was built from

  Background:
    Given the Task Notes backend is running at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    Given the environment variable "BUILD_COMMIT" is set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: The commit comes from the BUILD_COMMIT environment variable
    Given the environment variable "BUILD_COMMIT" is set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"
    And the router source holds no commit literal

  Scenario: An unset BUILD_COMMIT reports unknown
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A blank BUILD_COMMIT reports unknown
    Given the environment variable "BUILD_COMMIT" is set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by the VersionResponse schema
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the fields "version" and "commit"
    And the OpenAPI document describes the 200 response as "VersionResponse"

  Scenario: A 40-character sha is truncated to its first 12 characters (edge case)
    Given the environment variable "BUILD_COMMIT" is set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: The set and unset commit paths are covered by tests
    Given the backend unit and integration test suites
    When the version, config and version service tests run
    Then the set and unset commit cases pass with 0 failed
