Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend reports
  So that I can tell which build I am looking at

  Background:
    Given the Task Notes stack (db, backend, frontend) is running per docker-compose.yml
    And the frontend is at "http://localhost:5183" and the backend at "http://localhost:8010"

  Scenario: Footer renders the version string (criterion 1)
    Given the backend answers "GET /api/version" with a version
    When I open "http://localhost:5183/" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: The version comes from the backend at runtime (criterion 2)
    Given the backend reports a version different from the "version" in frontend/package.json
    When I open the landing page
    Then the footer shows the backend's version
    And the footer does not show the frontend package version
    And the browser made a "GET /api/version" request to the backend

  Scenario: Unresolvable version renders without it (criterion 3, edge case)
    Given the backend is stopped
    When I open the landing page
    Then the page still renders
    And the footer reads exactly "Task Notes"
    And the footer shows no "undefined", "null" or "unknown" and no trailing gap

  Scenario: Component tests cover both paths (criterion 4)
    Given the frontend test suite
    When I run the AppFooter and version client tests
    Then the run reports 0 failed
    And there is a version-present case and a version-absent case

  Scenario: Loading state shows the app name only (criterion 5)
    Given the version request is slow
    When the landing page first renders
    Then the footer reads "Task Notes" until the version arrives
    And the footer is not blank and shows no "loading" text
    And once the version arrives the footer reads "Task Notes v" followed by that version
