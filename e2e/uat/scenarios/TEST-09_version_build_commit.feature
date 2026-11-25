Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tie a running backend to the commit it was built from

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"
    And no database is needed to answer GET /api/version

  Scenario: The endpoint answers 200 with version and commit strings
    Given the environment variable "BUILD_COMMIT" is not set
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: A full 40-character sha is shortened to its first 12 characters
    Given the environment variable "BUILD_COMMIT" is "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"
    And the response body field "commit" is exactly 12 characters long

  Scenario: A value of 12 or fewer characters is returned unchanged (edge case)
    Given the environment variable "BUILD_COMMIT" is "abc123"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"

  Scenario: An unset or blank BUILD_COMMIT yields "unknown"
    Given the environment variable "BUILD_COMMIT" is not set or is an empty value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The build passes an empty BUILD_COMMIT and the application supplies "unknown"
    Given the backend image is built with docker compose and no BUILD_COMMIT build argument
    And the compose file and the Dockerfile pass an empty BUILD_COMMIT
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"
    And "unknown" is defined only in the backend settings module, not in the router, the Dockerfile or the compose file

  Scenario: A build-time BUILD_COMMIT reaches the running container
    Given the backend image is built with the build argument "BUILD_COMMIT" set to "fedcba9876543210fedcba9876543210fedcba98"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "fedcba987654"

  Scenario: The commit value comes from the declared source, never from the router
    Given the source file "backend/app/routers/version.py"
    When a reviewer reads it
    Then it contains no commit string literal
    And the value is produced by "get_build_commit()"

  Scenario: The response body is defined by a Pydantic schema
    When a client sends a GET request to "/openapi.json"
    Then "components.schemas.VersionResponse" lists "version" and "commit"
    And both properties are of type "string" and both are required
    And the schema is declared in "backend/app/schemas/version.py"

  Scenario: The set and unset commit paths are covered by automated tests
    When the version unit and integration test files are run
    Then the run passes with no failed or errored test
    And the tests for the set path and the unset path are both reported as passed
