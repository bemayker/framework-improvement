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
    And the response body has exactly the fields "version" and "commit"
    And both "version" and "commit" are strings

  Scenario: A backend built without BUILD_COMMIT reports unknown
    Given the backend image was built with no BUILD_COMMIT set
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A backend built with a short BUILD_COMMIT reports it unchanged
    Given the backend image was built with BUILD_COMMIT "abc123"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"

  Scenario: A 40-character sha is truncated to its first 12 characters (edge case)
    Given the backend image was built with BUILD_COMMIT "0418677a1b2c3d4e5f60718293a4b5c6d7e8f901"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0418677a1b2c"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client reads "/openapi.json"
    Then the "VersionResponse" schema declares "version" and "commit" as required strings
    And the class "VersionResponse" in "backend/app/schemas/version.py" declares "version: str" and "commit: str"

  Scenario: The unit and integration suites cover the set and unset commit paths
    Given the backend test suite with a test database available
    When the version and config unit tests and the version integration tests run
    Then 0 tests fail
    And the set, unset and truncation tests are listed as passed
