Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tie a running backend to the commit it was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with a version and a commit string
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the fields "version" and "commit"
    And both "version" and "commit" are strings

  Scenario: An unset BUILD_COMMIT reports unknown
    Given the environment variable "BUILD_COMMIT" is not set for the backend
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A set BUILD_COMMIT is reported as the commit
    Given the backend has been started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend source code
    When a reader opens "backend/app/schemas/version.py"
    Then "VersionResponse" declares "version" and "commit" as strings
    And the route in "backend/app/routers/version.py" declares "response_model=VersionResponse"
    And the router contains no commit string literal

  Scenario: The set and unset commit paths are covered by tests
    Given the backend test suite
    When the config unit tests, the version service unit tests and the version integration tests run
    Then no test fails
    And each of the three files covers "BUILD_COMMIT" set and "BUILD_COMMIT" unset

  Scenario: A BUILD_COMMIT longer than 12 characters is truncated to its first 12
    Given the backend has been started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A BUILD_COMMIT of exactly 12 characters is returned unchanged
    Given the backend has been started with "BUILD_COMMIT" set to "0123456789ab"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A blank BUILD_COMMIT reports unknown (edge case)
    Given the backend has been started with "BUILD_COMMIT" set to an empty string
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "unknown"
