Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to report which build I am talking to
  So that I can tell which commit a deployment is running

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has a string field "version"
    And the response body has a string field "commit"

  Scenario: A full 40-character sha is reported as its first 12 characters
    Given the backend was started with "BUILD_COMMIT" set to "49c5d32dbdfb9ac66826decc406cf33bdfe68f13"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "49c5d32dbdfb"

  Scenario: A short commit value is reported unchanged
    Given the backend was started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset BUILD_COMMIT reports "unknown"
    Given the backend was started with "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend source
    When reading "backend/app/schemas/version.py"
    Then "VersionResponse" declares "version" and "commit" as str
    And the API docs at "/docs" show "VersionResponse" as the 200 response schema of "GET /api/version"

  Scenario: The version and commit tests cover the set and unset paths
    Given the backend test suite
    When the version unit and integration tests run
    Then they pass
    And the set and unset commit tests are reported as passed

  Scenario: A blank BUILD_COMMIT reports "unknown" (edge case)
    Given the backend was started with "BUILD_COMMIT" set to an empty string
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "unknown"
