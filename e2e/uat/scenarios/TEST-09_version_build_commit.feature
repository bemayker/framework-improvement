Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the string fields "version" and "commit"
    And the response body field "version" is the "[project].version" declared in backend/pyproject.toml

  Scenario: A long BUILD_COMMIT is reported as its first 12 characters
    Given the environment variable "BUILD_COMMIT" is "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A BUILD_COMMIT of 12 or fewer characters is reported unchanged
    Given the environment variable "BUILD_COMMIT" is "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset or empty BUILD_COMMIT is reported as unknown
    Given the environment variable "BUILD_COMMIT" is unset or empty
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"
    And the router source "backend/app/routers/version.py" contains no commit string literal

  Scenario: A full 40-character sha, as CI passes it in, is truncated (edge case)
    Given the environment variable "BUILD_COMMIT" is a 40-character git sha
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" has exactly 12 characters
    And it equals the first 12 characters of that sha

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client reads "/openapi.json"
    Then the 200 response of "GET /api/version" references "VersionResponse"
    And "VersionResponse" has the string properties "version" and "commit"

  Scenario: The set and unset commit paths are covered by tests
    Given the backend unit and integration test suites for version and config
    When the version and config tests run
    Then they pass
    And tests exist for the set path and the unset path of the commit
