Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: A short BUILD_COMMIT is returned unchanged
    Given the backend was started with the environment variable "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset BUILD_COMMIT yields the default "unknown"
    Given the backend was started with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"
    And the response status code is 200

  Scenario: A 40-character BUILD_COMMIT is truncated to its first 12 characters (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: The commit comes from the declared source, not from the router
    Given the file "backend/app/routers/version.py"
    Then it contains no commit string literal
    And the commit value is obtained from "get_build_commit()" in "backend/app/services/version_service.py"

  Scenario: The response body is defined by a Pydantic schema
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the keys "version" and "commit"
    And the keys are declared by "VersionResponse" in "backend/app/schemas/version.py"

  Scenario: The version tests cover the set and unset commit paths
    Given the repository with the version unit and integration tests
    When the tests in "test_config_unit.py", "test_version_service_unit.py" and "test_version_integration.py" run
    Then 0 tests fail
    And each file has a case with "BUILD_COMMIT" set and a case with it unset
