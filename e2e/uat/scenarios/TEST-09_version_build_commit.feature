Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tie behaviour to a specific commit

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit (criterion 1)
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has a string field "version"
    And the response body has a string field "commit"

  Scenario: commit is the first 12 characters of a full sha in BUILD_COMMIT (criterion 2)
    Given the backend was started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: commit defaults to unknown when BUILD_COMMIT is unset (criterion 2)
    Given the backend was started with "BUILD_COMMIT" not set
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A blank BUILD_COMMIT reports unknown (edge case)
    Given the backend was started with "BUILD_COMMIT" set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A BUILD_COMMIT of 12 characters or fewer is returned unchanged (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "abc123"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"

  Scenario: The response body is exactly the schema's two fields (criterion 3)
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the keys "version" and "commit"
    And the OpenAPI schema for the 200 response is "VersionResponse"

  Scenario: The version tests cover the set and unset commit paths (criterion 4)
    Given the repository is checked out
    When the backend unit and integration version tests run
    Then 0 tests fail
    And both a set and an unset BUILD_COMMIT are exercised at each tier
