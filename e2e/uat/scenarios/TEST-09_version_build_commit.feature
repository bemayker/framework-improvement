Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to report which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the string fields "version" and "commit"

  Scenario: A set BUILD_COMMIT is reported as the commit
    Given the backend was started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset BUILD_COMMIT reports unknown
    Given the backend was started with "BUILD_COMMIT" unset or blank
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A full 40-character sha is truncated to its first 12 characters (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: The response body is defined by the VersionResponse schema
    Given the backend is running
    When a client sends a GET request to "/openapi.json"
    Then the schema "components.schemas.VersionResponse" requires "version" and "commit"
    And the 200 response of "/api/version" references "VersionResponse"

  Scenario: The set and unset commit paths are covered by the test suite
    Given the backend test suite
    When the version unit and integration tests run
    Then they pass
