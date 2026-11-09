Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit is deployed

  Background:
    Given the Task Notes backend is running from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with string fields version and commit
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the fields "version" and "commit"
    And both "version" and "commit" are strings

  Scenario: A 40-character BUILD_COMMIT is returned as its first 12 characters
    Given the environment variable "BUILD_COMMIT" is "3f9a1c2b7d4e5f60718293a4b5c6d7e8f9012345"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "3f9a1c2b7d4e"

  Scenario: A short BUILD_COMMIT is returned unchanged
    Given the environment variable "BUILD_COMMIT" is "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset BUILD_COMMIT yields "unknown"
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is described by the Pydantic schema VersionResponse
    Given the API's OpenAPI document at "/openapi.json"
    When the "VersionResponse" schema is read
    Then it lists "version" and "commit" as required string properties

  Scenario: The version tests cover the set and unset commit paths
    Given the backend test suite
    When the version unit and integration tests run
    Then 0 tests fail
    And at least one test sets "BUILD_COMMIT" to a 40-character sha and one leaves it unset

  Scenario: A blank BUILD_COMMIT yields "unknown" (edge case)
    Given the environment variable "BUILD_COMMIT" is set to a single space
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"
