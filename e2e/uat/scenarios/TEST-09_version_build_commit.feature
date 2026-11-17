Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can match a running backend to the commit it was built from

  Background:
    Given the Task Notes backend is published on the host at "http://localhost:8010"

  Scenario: The version endpoint answers 200 with version and commit
    Given the backend is running
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body is a JSON object with exactly the string fields "version" and "commit"

  Scenario: The commit comes from BUILD_COMMIT and defaults to unknown
    Given the backend image was built without a BUILD_COMMIT value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"
    When the backend image is rebuilt with BUILD_COMMIT "abc1234"
    And a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"
    And the router source contains no commit string literal

  Scenario: A 40-character sha is truncated to its first 12 characters (edge case)
    Given the backend image was built with BUILD_COMMIT "8df9812ed349fa26e4e14c316bc61757340b04ef"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "8df9812ed349"

  Scenario: The response body is defined by a Pydantic schema
    Given the backend is running
    When a client reads "/openapi.json"
    Then the "VersionResponse" schema lists "version" and "commit" as required strings
    And "VersionResponse" is declared in "backend/app/schemas/version.py"

  Scenario: The set and unset commit paths are covered by tests
    Given the backend test suite
    When the version unit and integration tests run
    Then they pass
    And the selected tests include both a commit-set case and a commit-unset case
