Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tie a running backend to the commit it was built from

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"

  Scenario: The endpoint answers 200 with a version and a commit string
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the string fields "version" and "commit"

  Scenario: The commit defaults to "unknown" when BUILD_COMMIT is not set
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The commit comes from the BUILD_COMMIT environment variable
    Given the backend was started with the environment variable "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"
    And the router source contains no commit string literal

  Scenario: The response body is defined by the VersionResponse schema
    Given the backend serves its OpenAPI document
    When a reader opens "/docs" and expands GET "/api/version"
    Then the 200 response schema is named "VersionResponse"
    And "VersionResponse" declares the required string fields "version" and "commit"

  Scenario: The unit and integration tests cover the set and unset commit paths
    Given the backend test suite for the version endpoint
    When the version unit and integration tests run
    Then the summary reports 0 failed
    And one integration test runs with "BUILD_COMMIT" set and one with it unset, each asserting "commit"

  Scenario: A BUILD_COMMIT longer than 12 characters is truncated to 12
    Given the backend was started with "BUILD_COMMIT" set to the 40-character sha "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"
    And that value is exactly 12 characters long

  Scenario: A BUILD_COMMIT of exactly 12 characters is returned unchanged
    Given the backend was started with "BUILD_COMMIT" set to "0123456789ab"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A blank BUILD_COMMIT counts as unset (edge case)
    Given the backend was started with "BUILD_COMMIT" set to three spaces
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A container image built with a commit argument reports that commit (edge case)
    Given the backend image was built with the build argument "BUILD_COMMIT" set to a 40-character sha
    When a client sends a GET request to "/api/version" on the running container
    Then the response body field "commit" is the first 12 characters of that sha
