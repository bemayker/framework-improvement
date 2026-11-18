Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can match a running backend to the commit it was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with a version and a commit
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the string fields "version" and "commit"

  Scenario: The commit comes from BUILD_COMMIT
    Given the backend was started with the environment variable "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"
    And the router source contains no commit string literal

  Scenario: The commit defaults to unknown when BUILD_COMMIT is unset
    Given the backend was started with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A BUILD_COMMIT longer than 12 characters is truncated (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "3f9c2a7b1d4e8f60a5b2c9d1e7f3a4b6c8d0e2f1"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "3f9c2a7b1d4e"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client reads "/openapi.json"
    Then the "VersionResponse" schema declares "version" and "commit" as required strings
    And "VersionResponse" is defined in "backend/app/schemas/version.py"

  Scenario: The set and unset commit paths are covered by tests
    Given the backend test suite
    When the version unit and integration tests run
    Then the run passes with no failed or errored test
