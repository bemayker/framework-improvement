Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    Given the backend was started with "BUILD_COMMIT" set to a 40-character sha
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response content type is "application/json"
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: A 40-character BUILD_COMMIT is reported as its first 12 characters
    Given the backend was started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A BUILD_COMMIT of 12 characters or fewer is reported unchanged
    Given the backend was started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset BUILD_COMMIT is reported as unknown
    Given the backend was started with "BUILD_COMMIT" not set
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A blank BUILD_COMMIT is reported as unknown (edge case)
    Given the backend was started with "BUILD_COMMIT" set to three spaces
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The commit comes from the environment, not from the router
    Given the file "backend/app/routers/version.py"
    When its source is read
    Then it calls "get_build_commit()"
    And it contains no quoted commit value

  Scenario: The response body is defined by a Pydantic schema
    Given the file "backend/app/schemas/version.py"
    When its source is read
    Then "VersionResponse" declares the string fields "version" and "commit"
    And a GET request to "/api/version" returns a body with exactly the fields "version" and "commit"

  Scenario: The version and build-commit tests pass
    Given the backend test suite
    When the tests in "tests/unit/test_config_unit.py", "tests/unit/test_version_service_unit.py" and "tests/integration/test_version_integration.py" are run
    Then 0 failed
    And at least one test sets "BUILD_COMMIT" and at least one leaves it unset, in both the unit and the integration files
