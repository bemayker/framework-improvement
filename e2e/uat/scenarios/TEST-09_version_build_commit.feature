Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which deployed commit answered my request

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the string fields "version" and "commit"
    And the "version" field equals the [project].version value in backend/pyproject.toml

  Scenario: The commit comes from BUILD_COMMIT
    Given the backend has been started with the environment variable "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"
    And the router source contains no literal commit string, the value comes from get_build_commit()

  Scenario: An unset BUILD_COMMIT reports unknown
    Given the backend has been started with the environment variable "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A blank BUILD_COMMIT is treated as unset (edge case)
    Given the backend has been started with the environment variable "BUILD_COMMIT" set to an empty value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A full 40-character sha is truncated to its first 12 characters (edge case)
    Given the backend has been started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client reads the OpenAPI document at "/docs"
    Then the 200 response of "GET /api/version" is the "VersionResponse" schema
    And that schema declares the string fields "version" and "commit"
    And "VersionResponse" is declared in backend/app/schemas/version.py

  Scenario: The unit and integration tests cover the set and unset commit paths
    Given the repository is checked out with backend dependencies synced
    When the backend version unit and integration test files are run with pytest
    Then the run passes with no failed or errored test
    And the set and unset commit tests each appear as passed
