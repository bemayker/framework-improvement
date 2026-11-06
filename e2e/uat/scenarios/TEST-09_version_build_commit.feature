Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The version endpoint returns 200 with version and commit strings
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has a string field "version"
    And the response body has a string field "commit"

  Scenario: The commit is the first 12 characters of BUILD_COMMIT
    Given the backend was started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"
    And the response body field "version" is unchanged

  Scenario: The commit defaults to unknown when BUILD_COMMIT is unset
    Given the backend was started with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A short BUILD_COMMIT is returned unchanged
    Given the backend was started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: The router declares no commit literal
    Given the source file "backend/app/routers/version.py"
    When it is read
    Then it contains no commit string literal
    And the commit value comes from "get_build_commit()", which reads the "BUILD_COMMIT" setting

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client reads "/openapi.json"
    Then the 200 response of "GET /api/version" references "VersionResponse"
    And "VersionResponse" requires the string fields "version" and "commit"
    And "VersionResponse" is declared in "backend/app/schemas/version.py"

  Scenario: The set and unset commit paths are covered by tests
    Given the backend test suite
    When the config unit tests, the version service unit tests and the version integration tests run
    Then 0 tests fail
    And each file has a test for a set "BUILD_COMMIT" and a test for an unset "BUILD_COMMIT"

  Scenario: A blank BUILD_COMMIT reports unknown (edge case)
    Given the backend was started with "BUILD_COMMIT" set to an empty string
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "commit" is "unknown"
