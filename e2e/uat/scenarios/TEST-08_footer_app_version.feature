Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version the backend is running
  So that I know which build I am looking at

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the version on the landing page
    Given the backend reports version "0.1.0" at "/api/version"
    When I open "http://localhost:5183/"
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"

  Scenario: The version comes from the backend at runtime, not from the frontend package
    Given the backend reports version "0.1.0"
    And the frontend package version is "0.0.0"
    When I open the landing page
    Then the footer shows "v0.1.0"
    And the footer does not show "v0.0.0"
    And the browser made one "GET /api/version" request that returned status 200

  Scenario: Footer renders without a version when it cannot be resolved
    Given the backend is stopped so "/api/version" is unreachable
    When I open the landing page
    Then the footer reads exactly "Task Notes"
    And the footer does not contain "undefined", "null", "unknown" or a trailing " v"
    And no element identified by "app-footer-version" exists

  Scenario: Footer recovers once the backend is back (edge case)
    Given the backend was stopped and the footer read "Task Notes"
    When I restart the backend and reload the landing page
    Then the footer reads "Task Notes v0.1.0"

  Scenario: Both paths are covered by a component test
    Given the frontend test suite
    When I run the AppFooter component tests
    Then a test for the version-present path passes
    And a test for the version-absent path passes
