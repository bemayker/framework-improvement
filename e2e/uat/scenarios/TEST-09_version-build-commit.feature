Feature: TEST-09 Version endpoint reports the build commit
  As a client of the Task Notes API
  I want GET /api/version to report which build I am talking to
  So that I can tell which commit a running backend was built from

  Background:
    Given the Task Notes backend runs from docker-compose.yml
    And the backend API is published on the host at "http://localhost:8010"

  Scenario: The version is returned with status 200 and two string fields (criterion 1)
    Given "BUILD_COMMIT" is not set when the stack is started
    When a client sends a GET request to "/api/version"
    Then the response status code is 200
    And the response body field "version" is a string
    And the response body field "commit" is a string

  Scenario: commit defaults to unknown when BUILD_COMMIT is unset (criterion 2)
    Given "BUILD_COMMIT" is not set when the stack is started
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: commit comes from BUILD_COMMIT (criterion 2)
    Given "BUILD_COMMIT" is "abc123" when the backend is started
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "abc123"

  Scenario: commit is cut to its first 12 characters when BUILD_COMMIT is longer (criterion 2, edge case)
    Given "BUILD_COMMIT" is "0123456789abcdef0123456789abcdef01234567" when the backend is started
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "0123456789ab"

  Scenario: A blank BUILD_COMMIT counts as unset (criterion 2, edge case)
    Given "BUILD_COMMIT" is a single space when the backend is started
    When a client sends a GET request to "/api/version"
    Then the response body field "commit" is "unknown"

  Scenario: The commit has one declared source and is never typed into the router (criterion 2)
    Given the source file "backend/app/routers/version.py"
    Then the handler calls "get_build_commit()" and contains no commit string literal
    And "BUILD_COMMIT" is read only in "backend/app/core/config.py" under "backend/app"

  Scenario: The response body is defined by a Pydantic schema (criterion 3)
    Given the source file "backend/app/schemas/version.py"
    Then "VersionResponse" declares "version" and "commit" as strings
    And a GET request to "/api/version" returns a body with exactly the keys "version" and "commit"

  Scenario: Only GET is allowed (edge case)
    When a client sends a POST request to "/api/version"
    Then the response status code is 405

  Scenario: The set and unset commit paths are covered by the automated tests (criterion 4)
    When the tests "tests/unit/test_config_unit.py", "tests/unit/test_version_service_unit.py" and "tests/integration/test_version_integration.py" are run with "uv run --directory backend pytest -q"
    Then the run reports 0 failed
