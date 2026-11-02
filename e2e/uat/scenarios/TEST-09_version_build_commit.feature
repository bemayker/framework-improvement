Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tie a running backend to the commit it was built from

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit (criterion 1)
    Given the environment variable "BUILD_COMMIT" is "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: A 40-character BUILD_COMMIT is reported as its first 12 characters (criterion 2)
    Given the environment variable "BUILD_COMMIT" is "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A BUILD_COMMIT of 12 characters or fewer is reported unchanged (criterion 2)
    Given the environment variable "BUILD_COMMIT" is "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset BUILD_COMMIT is reported as unknown (criterion 2)
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "unknown"

  Scenario: A blank BUILD_COMMIT is reported as unknown (edge case)
    Given the environment variable "BUILD_COMMIT" is set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "unknown"

  Scenario: The response body is defined by the Pydantic schema (criterion 3)
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the keys "version" and "commit"
    And the OpenAPI schema "VersionResponse" at "/openapi.json" lists "version" and "commit" as required

  Scenario: The version and integration tests cover the set and unset commit paths (criterion 4)
    Given the backend test suite
    When the version unit and integration tests are run
    Then 0 tests fail
    And at least one test sets "BUILD_COMMIT" to a 40-character sha and asserts the 12-character prefix
    And at least one test removes "BUILD_COMMIT" and asserts "unknown"
