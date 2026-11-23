Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend is published on the host at "http://localhost:8010"

  Scenario: A long BUILD_COMMIT is reported as its first 12 characters
    Given the backend runs with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body field "version" is a string
    And the response body field "commit" is "0123456789ab"

  Scenario: A short BUILD_COMMIT is reported unchanged
    Given the backend runs with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "abc1234"

  Scenario: An unset BUILD_COMMIT is reported as unknown
    Given the backend runs with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "unknown"

  Scenario: A blank BUILD_COMMIT is treated as unset (edge case)
    Given the backend runs with "BUILD_COMMIT" set to a blank value of only spaces
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "unknown"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client reads "/openapi.json"
    Then the 200 response of "GET /api/version" references the schema "VersionResponse"
    And "VersionResponse" has the string properties "version" and "commit"

  Scenario: The unit and integration tests cover the set and unset commit paths
    Given the backend test suites for configuration, the version service and the version endpoint
    When they are run
    Then no test fails or errors
    And the set, unset and 40-character commit tests are reported as passed
