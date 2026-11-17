Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend is running at "http://localhost:8010"
    And no database is needed for this endpoint

  Scenario: The endpoint answers 200 with version and commit strings (criterion 1)
    Given the environment variable "BUILD_COMMIT" is unset
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: The commit comes from BUILD_COMMIT and defaults to unknown (criterion 2)
    Given the backend was started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"
    Given the backend was started with "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"
    And no commit string is typed into backend/app/routers/version.py

  Scenario: A blank BUILD_COMMIT is treated as unset (criterion 2, assumption)
    Given the backend was started with "BUILD_COMMIT" set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A 40-character BUILD_COMMIT is truncated to its first 12 characters (criterion 2, edge case)
    Given the backend was started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"
    And the response body field "commit" is exactly 12 characters long

  Scenario: The response body is defined by a Pydantic schema (criterion 3)
    Given the backend is running
    When a client reads "/openapi.json"
    Then "GET /api/version" responds with the "VersionResponse" schema
    And "VersionResponse" declares required string properties "version" and "commit"
    And "VersionResponse" is defined in backend/app/schemas/version.py

  Scenario: Tests cover the set and unset commit paths (criterion 4)
    Given the backend test suite
    When the config, version service and version integration tests run
    Then they pass with no failed or errored test
    And the set and unset commit tests each report PASSED
