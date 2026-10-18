Feature: TEST-09 Version endpoint reports the build commit
  As an operator of the Task Notes API
  I want GET /api/version to report which build commit the backend was built from
  So that I can tell which build a client is talking to

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8011"

  Scenario: The version is returned with status 200 and two string fields (criterion 1)
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the fields "version" and "commit"
    And the response body field "version" is a string equal to "0.1.0"
    And the response body field "commit" is a string

  Scenario: commit is the first 12 characters of a 40-character BUILD_COMMIT (criterion 2)
    Given the environment variable "BUILD_COMMIT" is "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: commit is "unknown" when BUILD_COMMIT is unset (criterion 2)
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A short BUILD_COMMIT is returned unchanged (criterion 2, edge case)
    Given the environment variable "BUILD_COMMIT" is "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: A blank BUILD_COMMIT counts as unset (criterion 2, edge case)
    Given the environment variable "BUILD_COMMIT" is "   "
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The commit comes from one declared source, not from the router (criterion 2)
    Given the source file "backend/app/routers/version.py"
    Then the handler passes the commit in from "get_build_commit()"
    And no commit string is typed into the router
    And "docker-compose.yml" lists "BUILD_COMMIT" with the default "unknown" in the backend service environment

  Scenario: The response body is defined by a Pydantic schema (criterion 3)
    Given the source file "backend/app/schemas/version.py"
    Then "VersionResponse" is a Pydantic model with exactly the fields "version" and "commit", both strings
    And the route in "backend/app/routers/version.py" declares response_model "VersionResponse"

  Scenario: Only GET is allowed (edge case)
    When a client sends a POST request to "/api/version"
    Then the response status code is 405

  Scenario: The set and unset commit paths are covered by the automated tests (criterion 4)
    When the tests "tests/unit/test_config_unit.py", "tests/unit/test_version_service_unit.py" and "tests/integration/test_version_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run reports 0 failed
