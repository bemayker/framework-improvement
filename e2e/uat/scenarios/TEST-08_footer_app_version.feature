Feature: TEST-08 Footer shows the app version
  As a visitor of the Task Notes app
  I want the footer to show the version reported by the backend
  So that I can tell which build I am looking at, even when the frontend and backend were built separately

  Background:
    Given the Task Notes stack (frontend, backend, database) is running per docker-compose.yml
    And the frontend is served at "http://localhost:5183"
    And the backend is served at "http://localhost:8010"

  Scenario: Footer renders the backend version on the landing page (criterion 1)
    Given the backend answers GET /api/version with a version
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v" followed by that version

  Scenario: The version comes from the backend at runtime, not from the frontend (criterion 2)
    Given the backend version is "0.1.0" and the "version" field of frontend/package.json is "0.0.0"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads "Task Notes v0.1.0"
    And the footer does not read "Task Notes v0.0.0"
    And the browser made one request to GET /api/version on the backend that returned status 200
    And the source of AppFooter.tsx contains neither the text "0.1.0" nor "package.json"

  Scenario: The footer renders without a version while the version is still loading (criterion 3)
    Given the request to GET /api/version is still pending
    When the landing page has loaded
    Then the footer identified by "app-footer" reads exactly "Task Notes"
    And the footer shows no version, no placeholder and no trailing " v"
    And once the request completes the footer reads "Task Notes v" followed by the version

  Scenario: The footer renders without a version when the backend is unreachable (criterion 3, edge case)
    Given the backend is stopped so GET /api/version does not answer
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" is still visible
    And it reads exactly "Task Notes"
    And it does not contain "undefined", "null", "unknown" or a trailing " v"

  Scenario: The footer treats the backend's unknown version as unresolved (criterion 3, edge case)
    Given the backend answers GET /api/version with the version "unknown"
    When I open "http://localhost:5183" in a browser
    Then the footer identified by "app-footer" reads exactly "Task Notes"
    And it does not contain "unknown"

  Scenario: A component test covers both the version-present and version-absent paths (criterion 4)
    Given the frontend test suite
    When I run the tests in src/components/AppFooter.test.tsx
    Then the run reports 0 failed
    And the file contains a test for a resolved backend version
    And the file contains tests for a pending, a rejected and a null version that each expect the text "Task Notes"
