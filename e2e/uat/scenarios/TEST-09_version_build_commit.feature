Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to tell me which build I am talking to
  So that I can tell deployments apart

  Background:
    Given the Task Notes backend is running
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The endpoint answers 200 with a version and a commit string (criterion 1)
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body has exactly the string fields "version" and "commit"

  Scenario: A backend built with a short BUILD_COMMIT reports it unchanged (criterion 2)
    Given the backend image was built with the build argument "BUILD_COMMIT" set to "abc1234"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc1234"

  Scenario: A backend built without BUILD_COMMIT reports unknown (criterion 2)
    Given the backend image was built without the build argument "BUILD_COMMIT"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"
    And the router source contains no commit literal

  Scenario: A 40-character sha is truncated to its first 12 characters (edge case)
    Given the backend image was built with "BUILD_COMMIT" set to "0123456789abcdef0123456789abcdef01234567"
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A blank BUILD_COMMIT reads unknown (edge case)
    Given the backend runs with the environment variable "BUILD_COMMIT" set to an empty or whitespace-only value
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The response body is defined by a Pydantic schema (criterion 3)
    When a client reads the OpenAPI document at "/openapi.json"
    Then the 200 response of "GET /api/version" references the "VersionResponse" schema
    And that schema has the required string properties "version" and "commit"
    And "VersionResponse" is declared in "backend/app/schemas/version.py"

  Scenario: The unit and integration tests cover the set and unset paths (criterion 4)
    When the version unit and integration tests are run
    Then 0 tests fail
    And a set-path test and an unset-path test exist in the integration file
