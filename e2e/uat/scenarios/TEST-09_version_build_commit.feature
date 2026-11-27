Feature: TEST-09 Version endpoint reports the build commit
  As an operator of the Task Notes app
  I want GET /api/version to report which commit the running backend was built from
  So that I can tell exactly which build is deployed

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the string fields "version" and "commit"
    And the "version" field equals the project version declared in backend/pyproject.toml

  Scenario: An unset BUILD_COMMIT reports unknown
    Given the environment variable "BUILD_COMMIT" is not set for the backend
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A set BUILD_COMMIT is reported as the commit
    Given the environment variable "BUILD_COMMIT" is "abc123" for the backend
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"

  Scenario: A 40-character sha is truncated to its first 12 characters (edge case)
    Given the environment variable "BUILD_COMMIT" is "91e19ee37652a14621403c9bfdd0263de8767a5f" for the backend
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "91e19ee37652"

  Scenario: A blank BUILD_COMMIT counts as unset (edge case)
    Given the environment variable "BUILD_COMMIT" is whitespace only for the backend
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When the OpenAPI document at "/docs" is read
    Then the 200 response of "GET /api/version" references the schema "VersionResponse"
    And "VersionResponse" declares "version" and "commit" as strings
    And the schema is defined in backend/app/schemas/version.py
