Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell deployments apart

  Background:
    Given the Task Notes backend is running and published at "http://localhost:8010"

  Scenario: The endpoint answers 200 with version and commit strings
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the keys "version" and "commit"
    And both "version" and "commit" are strings

  Scenario: The commit is read from BUILD_COMMIT
    Given the backend was started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: The commit defaults to unknown when BUILD_COMMIT is unset
    Given the backend was started with "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: A full 40-character sha is truncated to its first 12 characters (edge case)
    Given the backend was started with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: The response body is defined by a Pydantic schema
    When a client requests "/openapi.json"
    Then the "VersionResponse" schema declares required string properties "version" and "commit"
