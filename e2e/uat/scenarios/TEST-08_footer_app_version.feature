Feature: TEST-08 Footer shows the app version
  As anyone looking at a running Task Notes instance
  I want the footer to show the version the backend reports
  So that I can tell which build I am on

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the application is open at "http://localhost:5183"

  Scenario: Footer renders the version string on the landing page
    Given the backend answers "GET /api/version" with a version
    When I open the landing page
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version
    And the footer text contains no "undefined" and no "null"

  Scenario: Footer version comes from the backend at runtime, not from the frontend package
    Given the backend reports a version that differs from the "version" field of frontend/package.json
    When I open the landing page
    Then the footer shows the backend's version
    And the footer does not show the version from frontend/package.json

  Scenario: Footer renders without a version while the version is still loading
    Given the backend has not yet answered "GET /api/version"
    When I look at the footer
    Then the footer reads exactly "Task Notes"
    And there is no placeholder, no dangling "v" and no empty gap

  Scenario: Footer renders without a version when the backend is unreachable (edge case)
    Given the backend is stopped
    When I open the landing page
    Then the page still loads
    And the footer reads exactly "Task Notes"
    And the footer text contains no "undefined", no "null" and no trailing "v"

  Scenario: Footer renders without a version when the backend reports it as unresolved (edge case)
    Given the backend answers "GET /api/version" with the version "unknown"
    When I open the landing page
    Then the footer reads exactly "Task Notes"
