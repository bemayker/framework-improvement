Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: A full 40-character BUILD_COMMIT is reported as its first 12 characters
    Given the backend has been started with "BUILD_COMMIT" set to "3f9c2a1b7d4e8f6a5c0b9d2e1f4a7c3b6d8e0f12"
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "3f9c2a1b7d4e"

  Scenario: An unset BUILD_COMMIT is reported as unknown
    Given the backend has been started with "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A blank BUILD_COMMIT is treated as unset (edge case)
    Given the backend has been started with "BUILD_COMMIT" set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A short BUILD_COMMIT is returned unchanged (edge case)
    Given the backend has been started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: The response body is defined by the Pydantic schema
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the keys "version" and "commit"
    And the OpenAPI documentation at "/docs" lists the 200 response schema as "VersionResponse"

  Scenario: The version test files cover the set and unset commit paths
    Given the repository is checked out
    When the config unit, version service unit and version integration test files are run
    Then the summary reports 0 failed
