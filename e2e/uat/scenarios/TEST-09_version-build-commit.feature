Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The version endpoint answers 200 with a version and a commit (criterion 1)
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has the string field "version"
    And the response body has the string field "commit"

  Scenario: The commit is "unknown" when BUILD_COMMIT is not set (criterion 2)
    Given the backend image was built without a "BUILD_COMMIT" value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The commit comes from BUILD_COMMIT set at build time (criterion 2)
    Given the backend image was built with "BUILD_COMMIT" set to "abc123"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"
    And the router source contains no commit string literal

  Scenario: The response body is defined by a Pydantic schema (criterion 3)
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the keys "version" and "commit"
    And the OpenAPI document at "/docs" shows the 200 response schema "VersionResponse" with the fields "version" and "commit"

  Scenario: The version tests cover the set and unset commit paths (criterion 4)
    Given the backend test suite
    When the version unit and integration tests run
    Then 0 tests fail
    And the unit tests cover a short, an exactly 12 character, a longer than 12 character and an unset commit
    And the integration tests cover an unset commit and a 40 character sha

  Scenario: A 40-character sha is truncated to its first 12 characters (edge case)
    Given the backend image was built with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"
    And the response body field "commit" is 12 characters long
