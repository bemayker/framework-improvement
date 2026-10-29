Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit is deployed

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: An unset BUILD_COMMIT reports the default "unknown"
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A set BUILD_COMMIT is reported as the commit
    Given the environment variable "BUILD_COMMIT" is "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: A BUILD_COMMIT longer than 12 characters is truncated (edge case)
    Given the environment variable "BUILD_COMMIT" is "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"
    And the response body field "commit" is exactly 12 characters long

  Scenario: The response body is defined by the Pydantic schema
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the keys "version" and "commit"
    And the OpenAPI documentation at "/docs" shows the 200 response schema "VersionResponse" with string properties "version" and "commit"

  Scenario: The tests cover the set and unset commit paths
    Given the backend test suite
    When the config, version service and version integration tests run
    Then 0 tests fail
    And at least one unit case and one integration case set "BUILD_COMMIT"
    And at least one unit case and one integration case leave "BUILD_COMMIT" unset
