Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can match a running backend to the commit it was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with a version and a commit string
    Given the backend was built with the environment variable "BUILD_COMMIT" set
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: The commit comes from BUILD_COMMIT and defaults to unknown
    Given the backend was built with "BUILD_COMMIT" set to "abc123"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"
    When the backend is rebuilt with "BUILD_COMMIT" unset or empty
    And a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the keys "version" and "commit"
    And the OpenAPI documentation at "/docs" lists the 200 response as "VersionResponse"

  Scenario: The unit and integration tests cover the set and unset commit paths
    Given the repository is checked out
    When the backend unit and integration version tests are run
    Then 0 tests fail
    And the set path and the unset path of the commit are among the tests run

  Scenario: A full 40-character sha is truncated to its first 12 characters (edge case)
    Given the backend was built with "BUILD_COMMIT" set to "1f1df4f723f8d8695ff74e774b2af1c086c9cf0e"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "1f1df4f723f8"
