Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with string fields version and commit
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has a string field "version"
    And the response body has a string field "commit"

  Scenario: The commit comes from BUILD_COMMIT when it is set
    Given the backend was started with the environment variable "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: The commit is "unknown" when BUILD_COMMIT is unset
    Given the backend was started with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A full 40-character sha is truncated to its first 12 characters (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: The response body is defined by the VersionResponse schema
    Given the backend is running
    When a reader opens the API docs at "http://localhost:8010/docs"
    And inspects the 200 response of "GET /api/version"
    Then its response schema is "VersionResponse"
    And that schema lists the required string fields "version" and "commit"

  Scenario: The unit and integration tests cover the set and unset commit paths
    Given the backend test suite
    When the version unit and integration tests run
    Then 0 tests fail
    And each of the three version test files has a test that sets "BUILD_COMMIT" and one that unsets it
