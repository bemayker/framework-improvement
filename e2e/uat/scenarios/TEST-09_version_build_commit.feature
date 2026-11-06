Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell deployments apart

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings (criterion 1)
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body is a JSON object with exactly the keys "version" and "commit"
    And both "version" and "commit" are strings

  Scenario: A full 40-character BUILD_COMMIT is cut to its first 12 characters (criterion 2)
    Given the backend was started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: An unset BUILD_COMMIT reports unknown (criterion 2)
    Given the backend was started with "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The commit has one declared source, not a router literal (criterion 2)
    Given the backend source
    When a reviewer opens "backend/app/routers/version.py"
    Then it contains no commit string literal
    And the value comes from "get_build_commit()" in "backend/app/services/version_service.py"

  Scenario: The response body is defined by a Pydantic schema (criterion 3)
    Given the backend source
    When a reviewer opens "backend/app/schemas/version.py"
    Then "VersionResponse" declares "version: str" and "commit: str"
    And the route in "backend/app/routers/version.py" uses "response_model=VersionResponse"

  Scenario: Set and unset commit paths are covered by tests (criterion 4)
    Given the backend test suite
    When the config, version service and version integration tests run
    Then the run ends with 0 failed
    And the unit and integration tiers each have a test with BUILD_COMMIT set and one with it unset

  Scenario Outline: Values of 12 characters or fewer pass through unchanged (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "<value>"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "<value>"

    Examples:
      | value        |
      | 0123456789ab |
      | abc1234      |
