Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tie a response to the commit that produced it

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: The commit comes from BUILD_COMMIT and is shortened to 12 characters
    Given the backend was started with "BUILD_COMMIT" set to the 40-character sha "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"
    And the router source contains no string literal for the commit

  Scenario: A commit of 12 characters or fewer is returned unchanged (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset or blank BUILD_COMMIT yields "unknown"
    Given the backend was started with "BUILD_COMMIT" unset or set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "unknown"

  Scenario: The response body is declared by a Pydantic schema
    Given the backend is running
    When a client sends a GET request to "/openapi.json"
    Then the "VersionResponse" schema lists "version" and "commit" as required string properties
    And the schema is declared in "backend/app/schemas/version.py"

  Scenario: Unit and integration tests cover the set and unset commit paths
    Given the backend test suite is available
    When the config, version service and version integration tests are run
    Then no test fails or errors
    And tests for the set and the unset commit paths are listed as passed
