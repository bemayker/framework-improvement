Feature: TEST-10 Footer shows the build commit
  As a visitor of the Task Notes app
  I want the footer to show the short build commit next to the version
  So that I can tell exactly which build of the application is running

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"
    And "backend/pyproject.toml" declares version "0.1.0" under [project]

  Scenario: Footer shows the first 7 characters of the commit next to the version (criterion 1)
    Given the backend was built with BUILD_COMMIT "3f9c2a71b0de4c5e8a9f00112233445566778899"
    And "GET http://localhost:8010/api/version" returns {"version":"0.1.0","commit":"3f9c2a71b0de"}
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0 (3f9c2a7)"
    And the commit is inside the element identified by "app-commit", which follows the element identified by "app-version"

  Scenario: Footer shows the app name alone when the backend is unreachable (criterion 2)
    Given the backend is stopped
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And it contains no commit, no "undefined", no "null", no "unknown" and no error text
    And there is no element identified by "app-commit"

  Scenario: Footer shows the app name alone while the request is pending (criterion 2)
    Given the "/api/version" request is slowed down
    When I open "http://localhost:5183/"
    Then while the request is pending the footer reads "Task Notes"
    And once it completes the footer reads "Task Notes v0.1.0 (3f9c2a7)"

  Scenario: Footer shows the version alone when the backend has no commit (edge case)
    Given the backend was built with BUILD_COMMIT unset
    And "GET http://localhost:8010/api/version" returns {"version":"0.1.0","commit":"unknown"}
    When I open "http://localhost:5183/"
    Then the footer reads "Task Notes v0.1.0"
    And there is no element identified by "app-commit"
    And the footer contains no parentheses and no "unknown"

  Scenario: Component tests cover success, pending and failure (criterion 3)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then the tests for the success, pending and failure paths are listed
    And they pass with 0 failed
