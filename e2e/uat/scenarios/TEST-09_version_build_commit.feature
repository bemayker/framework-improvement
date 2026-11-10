Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings (criterion 1)
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: The commit comes from BUILD_COMMIT, and defaults to unknown (criterion 2)
    Given the backend is running with "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A short BUILD_COMMIT is returned unchanged (criterion 2)
    Given the backend is running with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: A blank BUILD_COMMIT is treated as unset (criterion 2, edge case)
    Given the backend is running with "BUILD_COMMIT" set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A BUILD_COMMIT longer than 12 characters is cut to its first 12 (criterion 2, edge case)
    Given the backend is running with "BUILD_COMMIT" set to "3f9a2c1b7d4e5f60718293a4b5c6d7e8f9a0b1c2"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "3f9a2c1b7d4e"
    And the response body field "commit" is exactly 12 characters long

  Scenario: The response body is defined by the VersionResponse schema (criterion 3)
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the keys "version" and "commit"
    And the OpenAPI document at "/docs" shows the 200 response as "VersionResponse"

  Scenario: Unit and integration tests cover the set and unset commit paths (criterion 4)
    Given the repository is checked out with a reachable PostgreSQL for the integration tier
    When the backend unit and integration version tests are run
    Then 0 tests fail
    And both a set-commit test and an unset-commit test exist at the unit and the integration tier
