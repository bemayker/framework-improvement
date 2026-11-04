Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: The commit is read from BUILD_COMMIT and cut to its first 12 characters
    Given the environment variable "BUILD_COMMIT" is "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "0123456789ab"

  Scenario: A BUILD_COMMIT of 12 characters or fewer is returned unchanged
    Given the environment variable "BUILD_COMMIT" is "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset BUILD_COMMIT reports unknown
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A blank BUILD_COMMIT reports unknown (edge case)
    Given the environment variable "BUILD_COMMIT" is set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a developer opens the API docs at "/docs" and expands the 200 response of "GET /api/version"
    Then the schema shown is "VersionResponse"
    And it lists "version" and "commit" as required string properties
    And "VersionResponse" is declared in "backend/app/schemas/version.py"

  Scenario: The set and unset commit paths are covered by tests
    Given the backend test suite
    When the version unit and integration tests run
    Then 0 tests fail
    And one integration test sets a 40-character BUILD_COMMIT and asserts the 12-character commit
    And one integration test unsets BUILD_COMMIT and asserts "unknown"
