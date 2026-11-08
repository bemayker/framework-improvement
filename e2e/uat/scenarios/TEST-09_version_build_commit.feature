Feature: TEST-09 Version endpoint reports the build commit
  As an operator of the Task Notes app
  I want GET /api/version to report the commit the backend was built from
  So that a running deployment can be traced back to its source

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with string version and commit fields
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: The commit comes from BUILD_COMMIT and is capped at 12 characters
    Given the backend was built with "BUILD_COMMIT" set to "81e1e8fa4bd74ad5b468f0d1aa5a2cd63e71b393"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "81e1e8fa4bd7"

  Scenario: A short BUILD_COMMIT is returned unchanged
    Given the backend was built with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: A backend built with no BUILD_COMMIT reports unknown (edge case)
    Given the backend was built with "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A blank BUILD_COMMIT is treated as unset (edge case)
    Given the backend was built with "BUILD_COMMIT" set to a blank value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is exactly the VersionResponse schema
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the fields "version" and "commit"
    And the OpenAPI schema at "/docs" names "VersionResponse" as the 200 response of "GET /api/version"

  Scenario: The version and integration tests cover the set and unset commit paths
    Given the repository checkout
    When the tests in "backend/tests/unit/test_version_service_unit.py", "backend/tests/unit/test_config_unit.py" and "backend/tests/integration/test_version_integration.py" run
    Then 0 failed
