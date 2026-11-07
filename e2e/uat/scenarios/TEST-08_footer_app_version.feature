Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the backend
  So that I know which build I am looking at

  Background:
    Given the Task Notes stack is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer renders the backend's version on the landing page (criterion 1)
    Given the backend reports version "0.1.0" at GET /api/version
    When I open "http://localhost:5183"
    Then the footer identified by "app-footer" reads "Task Notes v" followed by the backend's version

  Scenario: The version comes from the backend at runtime (criterion 2)
    Given frontend/package.json says version "0.0.0" and the backend says "0.1.0"
    When I open the landing page
    Then the browser makes one GET request to "/api/version" on the backend
    And the footer shows "0.1.0" and not "0.0.0"

  Scenario: Unresolved version renders without it (criterion 3)
    Given GET /api/version is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it does not contain "undefined", "null", "unknown" or a trailing gap

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter tests
    Then a version-present case and a version-absent case both pass

  Scenario: Backend version wins over the bundle's version (criterion 5)
    Given frontend/package.json says "0.0.0" and the backend says "0.1.0"
    When I open the landing page
    Then the footer shows "0.1.0"

  Scenario: Loading state shows the app name only (criterion 6)
    Given GET /api/version has not answered yet
    When the landing page renders
    Then the footer reads exactly "Task Notes"
    And it shows no version, no "v", no placeholder and no spinner

  Scenario: Failure state shows the app name only (criterion 7)
    Given GET /api/version answers 500, a malformed body or the "unknown" sentinel
    When I open the landing page
    Then the footer reads exactly "Task Notes" and not "unknown"

  Scenario: Footer recovers once the backend is reachable again (edge case)
    Given the backend was stopped and the footer read "Task Notes"
    When I start the backend and reload the page
    Then the footer reads "Task Notes v0.1.0"
