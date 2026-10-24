Feature: TEST-08 Footer shows the app version from the backend
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports at runtime
  So that I know which build I am looking at, even when the frontend and backend were built separately

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend is at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page (criterion 1)
    Given the backend reports the version "0.1.0" at "/api/version"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads exactly "Task Notes v0.1.0"

  Scenario: The version comes from the backend at runtime, not the frontend bundle (criterion 2)
    Given the frontend package version "0.0.0" differs from the backend version "0.1.0"
    When I open the landing page
    Then the browser requests "GET /api/version" from the backend and receives status 200
    And the footer shows the backend version "0.1.0"
    And the footer does not contain "0.0.0"

  Scenario: The footer renders without a version when it cannot be resolved (criterion 3)
    Given the backend is stopped so "/api/version" is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer contains no "v", "undefined", "null" or "unknown"
    And there is no trailing gap after "Task Notes"

  Scenario: Component tests cover both the version-present and version-absent paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then they pass with 0 failed
    And there is a test case for the version present and one for the version absent

  Scenario: Loading and failure states are decided and covered (criterion 5)
    Given the version request has not answered yet
    When the landing page renders
    Then the footer reads exactly "Task Notes" with no placeholder text
    And once the request completes the footer reads "Task Notes v0.1.0"
    And the plan records both the loading and the failure state as "Task Notes" only

  Scenario: Backend reports an unresolved version (edge case)
    Given the backend answers "/api/version" with the sentinel "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the word "unknown" is not shown
