Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell deployments apart

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with a version and a commit
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: Without BUILD_COMMIT the commit is unknown
    Given the backend was started with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: With BUILD_COMMIT set the commit comes from that variable
    Given the backend was started with "BUILD_COMMIT" set to "abc123"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"

  Scenario: The response body is exactly the schema's two fields
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the keys "version" and "commit"

  Scenario: The version and config tests cover the set and unset commit paths
    Given the backend test suite
    When the version and config unit tests and the version integration tests run
    Then 0 tests fail
    And the run includes the commit set, unset and blank cases

  Scenario: A 40-character sha is truncated to its first 12 characters (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"
