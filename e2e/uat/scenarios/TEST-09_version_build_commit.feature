Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tie a running backend to the commit it was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the string fields "version" and "commit"

  Scenario: An unset BUILD_COMMIT reports unknown
    Given the backend was started with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A 40-character BUILD_COMMIT is truncated to its first 12 characters (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "ac6e44ce1a904f608a5ee6d69dcd1f04429c458e"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "ac6e44ce1a90"

  Scenario: A BUILD_COMMIT of 12 characters or fewer is returned unchanged
    Given the backend was started with "BUILD_COMMIT" set to "abc123"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client reads the OpenAPI document at "/openapi.json"
    Then the 200 response of "GET /api/version" references the "VersionResponse" schema
    And that schema lists "version" and "commit" as strings

  Scenario: The set and unset commit paths are covered by tests
    Given the backend test suite
    When the version unit and integration tests run
    Then 0 tests fail
    And each of the unit and integration files has a test with BUILD_COMMIT set and a test with it unset
