Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to report which build I am talking to
  So that I can tell which commit is deployed

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with string fields version and commit
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: An unset BUILD_COMMIT yields the commit "unknown"
    Given the backend has been started with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A blank BUILD_COMMIT is treated as unset
    Given the backend has been started with the environment variable "BUILD_COMMIT" set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A short BUILD_COMMIT is returned unchanged
    Given the backend has been started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: A 40-character BUILD_COMMIT is truncated to its first 12 characters (edge case)
    Given the backend has been started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"
    And that value is 12 characters long

  Scenario: The commit value comes from the environment, not from the router
    Given the file "backend/app/routers/version.py"
    When its source is read
    Then it contains no quoted commit value
    And the commit is taken from the service function "get_build_commit()"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client sends a GET request to "/openapi.json"
    Then the schema "VersionResponse" lists "version" and "commit" as required string properties
    And "VersionResponse" is declared in "backend/app/schemas/version.py"

  Scenario: The unit and integration tests cover the set and unset commit paths
    Given the backend test suite
    When the tests in "backend/tests/unit/test_config_unit.py", "backend/tests/unit/test_version_service_unit.py" and "backend/tests/integration/test_version_integration.py" are run
    Then the summary line reports no failed or errored test
    And the command exits 0
