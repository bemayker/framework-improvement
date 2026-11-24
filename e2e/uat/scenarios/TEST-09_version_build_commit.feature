Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the fields "version" and "commit"
    And both fields are strings

  Scenario: The commit is read from BUILD_COMMIT and defaults to unknown
    Given the environment variable "BUILD_COMMIT" is unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"
    And the router source "backend/app/routers/version.py" contains no literal commit string

  Scenario: A short BUILD_COMMIT is returned unchanged
    Given the environment variable "BUILD_COMMIT" is "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: A blank BUILD_COMMIT is treated as unset
    Given the environment variable "BUILD_COMMIT" is a single space
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by a Pydantic schema
    When a client requests "/openapi.json"
    Then the 200 response of "/api/version" references "#/components/schemas/VersionResponse"
    And that schema has the required string properties "version" and "commit"

  Scenario: Unit and integration tests cover the set and unset commit paths
    Given the backend test suite
    When the version, config and service tests run
    Then the run passes with no failed or errored test
    And the tests for the set and the unset commit paths both appear as passed

  Scenario: A full 40-character sha is truncated to its first 12 characters (edge case)
    Given the environment variable "BUILD_COMMIT" is "4e631128d7285ec47eb354795bf120878553505b"
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "4e631128d728"
    And the value of "commit" is exactly 12 characters long
