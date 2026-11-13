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
    And the response body has exactly the string fields "version" and "commit"

  Scenario: The commit is the first 12 characters of the build-time BUILD_COMMIT
    Given the backend image was built with BUILD_COMMIT set to a 40-character sha
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" equals the first 12 characters of that sha

  Scenario: The commit is "unknown" when BUILD_COMMIT was not set at build time
    Given the backend image was built without BUILD_COMMIT
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by the VersionResponse Pydantic schema
    Given the backend is running
    When the OpenAPI document is fetched from "/openapi.json"
    Then the "VersionResponse" schema lists "version" and "commit" as required
    And both properties have type "string"

  Scenario: A BUILD_COMMIT of 12 characters or fewer is returned unchanged (edge case)
    Given the backend image was built with BUILD_COMMIT set to "abc123"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"
