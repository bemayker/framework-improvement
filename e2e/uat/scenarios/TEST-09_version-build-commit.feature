Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend is running
    And the backend API is reachable at "http://localhost:8010"

  Scenario: The endpoint answers 200 with a version and a commit
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: The commit comes from BUILD_COMMIT, truncated to 12 characters
    Given the backend was started with "BUILD_COMMIT" set to "3f9c2a1b7d4e8f60a1b2c3d4e5f60718293a4b5c"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "3f9c2a1b7d4e"

  Scenario: A short BUILD_COMMIT comes back unchanged
    Given the backend was started with "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: An unset or blank BUILD_COMMIT yields "unknown"
    Given the backend was started with "BUILD_COMMIT" unset
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by the Pydantic schema
    When a client sends a GET request to "/api/version"
    Then the response body has exactly the keys "version" and "commit"
    And the OpenAPI document at "/openapi.json" names the 200 response schema "VersionResponse"

  Scenario: The unit and integration tests cover the set and unset paths
    Given the repository is at the feature branch tip
    When the version unit and integration tests are run
    Then 0 tests fail
    And a test sets BUILD_COMMIT and a test leaves it unset, in both tiers

  Scenario: A full 40-character sha is truncated to its first 12 characters (edge case)
    Given the backend was started with "BUILD_COMMIT" set to a 40-character sha
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" has length 12
    And it equals the first 12 characters of that sha
