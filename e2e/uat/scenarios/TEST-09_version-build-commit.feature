Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has the string field "version"
    And the response body has the string field "commit"

  Scenario: The commit is the first 12 characters of BUILD_COMMIT set at build time
    Given the backend image was built with BUILD_COMMIT "62be9fd76e4beeb5ec93d5fd3e9da1a35242d049"
    And the backend is running
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "62be9fd76e4b"

  Scenario: A commit of 12 characters or fewer is returned whole (edge case)
    Given the backend image was built with BUILD_COMMIT "abc1234"
    And the backend is running
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: The commit defaults to unknown when BUILD_COMMIT is not set
    Given the backend image was built with no BUILD_COMMIT
    And the backend is running
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client sends a GET request to "/openapi.json"
    Then the 200 response of "GET /api/version" references the schema "VersionResponse"
    And the "VersionResponse" schema has the required string properties "version" and "commit"

  Scenario: The version and commit tests cover the set and unset paths
    Given the backend test suite
    When the version unit and integration tests run
    Then 0 tests fail
    And the run includes the set and unset commit tests at both tiers
