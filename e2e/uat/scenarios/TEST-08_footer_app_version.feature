Feature: TEST-08 Footer shows the app version
  As anyone looking at a running Task Notes instance
  I want the footer to show the backend's version
  So that I can tell which build I am on

  Background:
    Given the Task Notes stack is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the version string on the landing page (criterion 1)
    Given the backend reports version "0.1.0" at "GET /api/version"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"

  Scenario: The version comes from the backend at runtime, not from the frontend (criterion 2)
    Given the backend reports version "0.1.0" and the frontend package version is "0.0.0"
    When I open the landing page
    Then the browser requests "GET /api/version" from the backend and receives status 200
    And the footer reads "Task Notes v0.1.0"
    And the footer does not contain "v0.0.0"

  Scenario: An unresolvable version renders without it (criterion 3)
    Given the backend is stopped
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer shows no "v", no "undefined", no "null", no "unknown" and no trailing gap

  Scenario: Both the version-present and version-absent paths are covered by a component test (criterion 4)
    Given the frontend unit suite
    When I run "npm --prefix frontend test"
    Then the AppFooter tests for a present version and for an absent version pass

  Scenario: The footer shows the backend's version, not the frontend's own (criterion 5)
    Given the backend reports version "9.9.9-manual"
    When I open the landing page
    Then the footer reads "Task Notes v9.9.9-manual"

  Scenario: Loading and failure states read Task Notes with no placeholder (criterion 6)
    Given the version request is still pending
    When I look at the footer before the request completes
    Then the footer reads exactly "Task Notes"
    And once the request completes the footer reads "Task Notes v0.1.0"

  Scenario: Backend reports the unknown sentinel (edge case)
    Given the backend answers "GET /api/version" with {"version": "unknown"}
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And it does not read "Task Notes vunknown"

  Scenario: Version request is blocked in the browser (edge case)
    Given the "/api/version" request is blocked
    When I open the landing page
    Then the footer is still visible and reads exactly "Task Notes"
