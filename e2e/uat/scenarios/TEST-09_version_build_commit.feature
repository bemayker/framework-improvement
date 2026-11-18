Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The version endpoint answers 200 with version and commit strings
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has a string field "version"
    And the response body has a string field "commit"

  Scenario: An unset BUILD_COMMIT yields the default "unknown"
    Given the backend was built with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A 40-character BUILD_COMMIT is reported as its first 12 characters (edge case)
    Given the backend was built with "BUILD_COMMIT" set to "3f9c2a7b1d4e8f6a0c5b9e2d7a1f4c8b6e3d0a9f"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "3f9c2a7b1d4e"

  Scenario: A BUILD_COMMIT of 12 characters or fewer is reported unchanged
    Given the backend was built with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a reader opens the OpenAPI docs at "http://localhost:8010/docs"
    Then the 200 response of GET "/api/version" is the schema "VersionResponse"
    And "VersionResponse" lists "version" and "commit" as required string fields

  Scenario: The unit and integration tests cover the set and unset commit paths
    Given the repository is checked out
    When the version unit and integration test files are run
    Then the run passes with no failed or errored test
