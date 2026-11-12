Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version of the backend I am talking to
  So that I can tell which build of the application is running

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"
    And "backend/pyproject.toml" declares version "0.1.0" under [project]

  Scenario: Footer renders the version on the landing page (criterion 1)
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"
    And the version is inside the element identified by "app-version"

  Scenario: The version comes from the backend at runtime, not the frontend package (criterion 2)
    Given "frontend/package.json" declares version "0.0.0"
    When I open "http://localhost:5183/"
    Then the footer shows "0.1.0" and does not contain "0.0.0"
    And the browser made at least one "GET http://localhost:8010/api/version" request that returned 200 with {"version":"0.1.0"}
    And "AppFooter.tsx" contains no version literal and no package.json import

  Scenario: Footer renders without a version when it cannot be resolved (criterion 3, edge case)
    Given requests to "/api/version" are blocked
    When I open "http://localhost:5183/"
    Then the footer reads exactly "Task Notes"
    And it contains no "v" prefix, no "undefined", no "null", no "unknown" and no trailing gap
    And there is no element identified by "app-version"

  Scenario: Footer shows the name alone while the version is loading (criterion 3)
    Given the "/api/version" request is slowed down
    When I open "http://localhost:5183/"
    Then while the request is pending the footer reads "Task Notes"
    And once it completes the footer reads "Task Notes v0.1.0"

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter tests
    Then the tests for the version present and the version absent paths are listed
    And they pass with 0 failed
