Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend is running from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The version endpoint answers 200 with version and commit strings
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body is a JSON object with the keys "version" and "commit"
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: The commit comes from BUILD_COMMIT and defaults to "unknown"
    Given the environment variable "BUILD_COMMIT" is not set for the backend
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"
    Given the backend is restarted with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"
    And the router source holds no commit string literal and calls "get_build_commit()"

  Scenario: The response body is defined by a Pydantic schema
    When the OpenAPI document of the backend is read
    Then the 200 response of "GET /api/version" refers to "VersionResponse"
    And "VersionResponse" lists "version" and "commit" as required string properties
    And "VersionResponse" is declared in "backend/app/schemas/version.py"

  Scenario: The unit and integration tests cover the set and unset commit paths
    Given the backend test suite
    When the version unit tests, the config unit tests and the version integration tests are run
    Then no test fails
    And the run includes tests for BUILD_COMMIT set, unset, blank and longer than 12 characters

  Scenario: A 40-character sha is cut to its first 12 characters (edge case)
    Given the backend is restarted with "BUILD_COMMIT" set to "9a6bfd7c3e1f2a4b5c6d7e8f9a0b1c2d3e4f5a6b"
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "9a6bfd7c3e1f"
    And the response body field "commit" has 12 characters
