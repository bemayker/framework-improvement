Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell a deployed build from another by its commit

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with a version and a commit
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body has exactly the string fields "version" and "commit"

  Scenario: Without a build-time value the commit is unknown
    Given the backend image was built with no "BUILD_COMMIT" value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The commit comes from the build-time variable, not from the router
    Given the backend image was built with "BUILD_COMMIT" set to "abc123"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"

  Scenario: The response body is declared by a Pydantic schema
    Given the backend is running
    When a client opens "/openapi.json"
    Then the schema "VersionResponse" lists "version" and "commit" as required string fields

  Scenario: The set and unset commit paths are covered by tests
    Given the version and config unit tests and the version integration tests
    When they are run together
    Then no test fails
    And the run includes a test for a set commit and a test for an unset commit

  Scenario: A 40-character sha is cut to its first 12 characters
    Given the backend image was built with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A value of exactly 12 characters is returned unchanged (edge case)
    Given the backend image was built with "BUILD_COMMIT" set to "0123456789ab"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A blank value counts as unset (edge case)
    Given the backend image was built with "BUILD_COMMIT" set to a blank value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"
