Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can match a running backend to the commit it was built from

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: A long BUILD_COMMIT is truncated to its first 12 characters
    Given the backend was started with "BUILD_COMMIT" set to "3f9c2a1b7d4e5f60718293a4b5c6d7e8f9012345"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "3f9c2a1b7d4e"

  Scenario: A short BUILD_COMMIT is returned unchanged (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "abc123"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"

  Scenario: An unset BUILD_COMMIT reports unknown
    Given the backend was started with "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is exactly the schema fields
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the fields "version" and "commit"
    And the body is produced by the "VersionResponse" Pydantic schema in "backend/app/schemas/version.py"

  Scenario: The version tests cover the set and unset commit paths
    Given the repository is checked out
    When the backend unit and integration version tests are run
    Then 0 tests fail
    And at least one test covers a set "BUILD_COMMIT" and one covers an unset "BUILD_COMMIT" at each of the unit and integration levels
