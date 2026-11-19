Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tie a running backend to the commit it was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The version endpoint returns the version and the commit
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the string fields "version" and "commit"
    And the response body field "version" equals the version in backend/pyproject.toml

  Scenario: The commit defaults to unknown when BUILD_COMMIT is unset
    Given the backend was started with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The commit comes from the BUILD_COMMIT environment variable
    Given the backend was started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"
    And the router source holds no commit literal

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When the OpenAPI document at "/openapi.json" is read
    Then the 200 response of "GET /api/version" references the "VersionResponse" schema
    And "VersionResponse" requires the string fields "version" and "commit"

  Scenario: The set and unset commit paths are covered by tests
    Given the version unit and integration tests exist in the backend test suite
    When those tests are run
    Then the run passes
    And a test exists for the commit reported when "BUILD_COMMIT" is set
    And a test exists for the commit reported when "BUILD_COMMIT" is unset

  Scenario: A BUILD_COMMIT longer than 12 characters is truncated (edge case, 40-character sha)
    Given the backend was started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"
    And the commit is 12 characters long

  Scenario: A BUILD_COMMIT of 12 characters or fewer is returned unchanged (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "0123456789ab"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"
